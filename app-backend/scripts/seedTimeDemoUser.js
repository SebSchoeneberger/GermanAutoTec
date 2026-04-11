import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import User from "../models/User.js";
import TimePunch from "../models/timePunch.js";
import { ADDIS_TZ, addisDateAndTimeToUtc } from "../utils/addisTime.js";

const WORK_MINUTES_MON_TO_FRI = 8 * 60 + 30;
const WORK_MINUTES_SATURDAY = 4 * 60;

function getExpectedMinutes(weekday) {
  if (weekday >= 1 && weekday <= 5) return WORK_MINUTES_MON_TO_FRI;
  if (weekday === 6) return WORK_MINUTES_SATURDAY;
  return 0;
}

function formatMinutes(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function parseMonth() {
  const raw = process.env.SEED_TIME_MONTH;
  if (!raw) {
    return DateTime.now().setZone(ADDIS_TZ).startOf("month");
  }
  const dt = DateTime.fromFormat(raw, "yyyy-MM", { zone: ADDIS_TZ }).startOf("month");
  if (!dt.isValid) {
    throw new Error("SEED_TIME_MONTH must be YYYY-MM (e.g. 2026-04)");
  }
  return dt;
}

function getSeedDateRange(monthStart) {
  const endOfMonth = monthStart.endOf("month").startOf("day");
  const todayAddis = DateTime.now().setZone(ADDIS_TZ).startOf("day");
  const includeFutureDays = process.env.SEED_TIME_INCLUDE_FUTURE_DAYS === "1";
  const end = includeFutureDays ? endOfMonth : DateTime.min(endOfMonth, todayAddis);
  return { start: monthStart.startOf("day"), end };
}

// --- Shift profiles ---

/** Mixed normal worker (original demo user) */
function pickShiftMixed(dateObj) {
  const weekday = dateObj.weekday;
  const day = dateObj.day;
  if (weekday === 7) return null;
  if (weekday === 6) {
    if (day % 2 === 0) return { in: "08:05", out: "12:10" };
    if (day % 3 === 0) return { in: "08:10", out: "11:20" };
    return null;
  }
  if (day % 7 === 0) return { in: "08:20", out: "15:30" };
  if (day % 5 === 0) return { in: "07:55", out: "17:20" };
  return { in: "08:03", out: "16:37" };
}

/** Overtime king — arrives early, leaves very late almost every day */
function pickShiftOvertimeKing(dateObj) {
  const weekday = dateObj.weekday;
  const day = dateObj.day;
  if (weekday === 7) return null;
  if (weekday === 6) return { in: "07:45", out: "13:30" }; // 1.5h overtime on Saturdays
  // One sick day per month
  if (day === 14) return null;
  // Heavy overtime most days
  if (day % 3 === 0) return { in: "07:30", out: "18:00" }; // ~2.5h overtime
  if (day % 2 === 0) return { in: "07:45", out: "17:45" }; // ~1.5h overtime
  return { in: "07:50", out: "17:15" }; // ~45m overtime
}

/** Chronic latecomer — always arrives 20–45 min late, leaves close to on time */
function pickShiftLatecomer(dateObj) {
  const weekday = dateObj.weekday;
  const day = dateObj.day;
  if (weekday === 7) return null;
  if (weekday === 6) {
    // Late on Saturdays too but sometimes skips
    if (day % 4 === 0) return null;
    return { in: "08:55", out: "12:05" };
  }
  // Rotates between different degrees of lateness
  if (day % 5 === 0) return { in: "08:45", out: "16:40" }; // 45 min late
  if (day % 3 === 0) return { in: "08:35", out: "16:38" }; // 35 min late
  if (day % 2 === 0) return { in: "08:22", out: "16:35" }; // 22 min late
  return { in: "08:18", out: "16:36" };                    // 18 min late
}

/** Frequent absentee — multiple full-week gaps and random missing days */
function pickShiftAbsentee(dateObj) {
  const weekday = dateObj.weekday;
  const day = dateObj.day;
  if (weekday === 7) return null;
  // Full week absent: days 8–12
  if (day >= 8 && day <= 12) return null;
  // Full week absent: days 22–26
  if (day >= 22 && day <= 26) return null;
  // Random individual absences
  if (day === 3 || day === 17 || day === 29) return null;
  if (weekday === 6) {
    if (day % 3 === 0) return null; // extra Saturday absences
    return { in: "08:05", out: "12:00" };
  }
  return { in: "08:02", out: "16:35" }; // normal when present
}

/** Early leaver — arrives on time but consistently leaves 1–2 hours early */
function pickShiftEarlyLeaver(dateObj) {
  const weekday = dateObj.weekday;
  const day = dateObj.day;
  if (weekday === 7) return null;
  if (weekday === 6) {
    if (day % 5 === 0) return null; // occasional Saturday off
    return { in: "08:00", out: "10:30" }; // leaves 1.5h early on Saturday
  }
  // Varies how early they leave
  if (day % 7 === 0) return { in: "08:00", out: "14:30" }; // leaves 2h early
  if (day % 3 === 0) return { in: "08:01", out: "15:10" }; // leaves ~1.5h early
  if (day % 2 === 0) return { in: "07:59", out: "15:35" }; // leaves ~1h early
  return { in: "08:03", out: "15:50" };                    // leaves ~45m early
}

// --- User definitions ---

const DEMO_USERS = [
  {
    email: "demo.mechanic@germanautotec.com",
    password: "Password123!",
    firstName: "Demo",
    lastName: "Mechanic",
    role: "mechanic",
    pickShift: pickShiftMixed,
  },
  {
    email: "demo.overtime@germanautotec.com",
    password: "Password123!",
    firstName: "Tekle",
    lastName: "Haile",
    role: "mechanic",
    pickShift: pickShiftOvertimeKing,
  },
  {
    email: "demo.latecomer@germanautotec.com",
    password: "Password123!",
    firstName: "Biruk",
    lastName: "Tadesse",
    role: "mechanic",
    pickShift: pickShiftLatecomer,
  },
  {
    email: "demo.absentee@germanautotec.com",
    password: "Password123!",
    firstName: "Selam",
    lastName: "Girma",
    role: "mechanic",
    pickShift: pickShiftAbsentee,
  },
  {
    email: "demo.earlyleaver@germanautotec.com",
    password: "Password123!",
    firstName: "Yonas",
    lastName: "Bekele",
    role: "mechanic",
    pickShift: pickShiftEarlyLeaver,
  },
];

async function seedUser(userDef, start, end) {
  const { email, password, firstName, lastName, role, pickShift } = userDef;

  const passwordHash = await bcrypt.hash(password, 10);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ firstName, lastName, email, password: passwordHash, role });
    console.log(`  Created user: ${email}`);
  } else {
    user.firstName = firstName;
    user.lastName = lastName;
    user.role = role;
    user.password = passwordHash;
    await user.save();
    console.log(`  Updated user: ${email}`);
  }

  await TimePunch.deleteMany({
    employee: user._id,
    at: {
      $gte: start.toUTC().toJSDate(),
      $lt: end.plus({ days: 1 }).toUTC().toJSDate(),
    },
  });

  const docs = [];
  let workedMinutes = 0;
  let expectedMinutes = 0;
  let overtimeMinutes = 0;
  let lostMinutes = 0;

  for (let d = start; d <= end; d = d.plus({ days: 1 })) {
    const workDate = d.toISODate();
    const shift = pickShift(d);
    const expected = getExpectedMinutes(d.weekday);
    expectedMinutes += expected;

    if (!shift) {
      lostMinutes += expected;
      continue;
    }

    const inAt = addisDateAndTimeToUtc(workDate, shift.in);
    const outAt = addisDateAndTimeToUtc(workDate, shift.out);

    docs.push({ employee: user._id, type: "in", at: inAt, source: "qr" });
    docs.push({ employee: user._id, type: "out", at: outAt, source: "qr" });

    const dayWorked = Math.max(0, Math.floor((outAt.getTime() - inAt.getTime()) / 60000));
    workedMinutes += dayWorked;
    overtimeMinutes += Math.max(0, dayWorked - expected);
    lostMinutes += Math.max(0, expected - dayWorked);
  }

  if (docs.length > 0) {
    await TimePunch.insertMany(docs);
  }

  console.log(`  ${firstName} ${lastName}: ${docs.length} punches | Expected ${formatMinutes(expectedMinutes)} | Worked ${formatMinutes(workedMinutes)} | OT +${formatMinutes(overtimeMinutes)} | Lost -${formatMinutes(lostMinutes)}`);
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");

  const monthStart = parseMonth();
  const { start, end } = getSeedDateRange(monthStart);

  await mongoose.connect(uri);

  console.log(`\nSeeding time demo users for ${monthStart.toFormat("yyyy-MM")} (${start.toISODate()} → ${end.toISODate()})\n`);

  for (const userDef of DEMO_USERS) {
    await seedUser(userDef, start, end);
  }

  console.log("\nDone. Login with password: Password123!");
  console.log("Emails:");
  DEMO_USERS.forEach((u) => console.log(`  ${u.email}  (${u.firstName} ${u.lastName})`));
  console.log("");
}

run()
  .catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
