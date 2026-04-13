import TimePunch from "../models/timePunch.js";
import TimeCorrectionRequest from "../models/timeCorrectionRequest.js";
import User from "../models/User.js";
import Holiday from "../models/Holiday.js";
import LeaveRequest from "../models/LeaveRequest.js";
import { DateTime } from "luxon";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/errorResponse.js";
import {
  getCurrentDisplayPayload,
  getStepSeconds,
  isValidWorkshopCode,
} from "../utils/workshopQrCode.js";
import {
  addisTodayPlainDateString,
  addisWorkDateToUtcRange,
  addisMonthToUtcRange,
  addisDateAndTimeToUtc,
  isValidWorkDateString,
} from "../utils/addisTime.js";
import {
  toEthiopianNumericDateStringFromDate,
  toEthiopianNumericDateStringFromGregorianDate,
} from "../utils/ethiopianDate.js";

/** Roles allowed to punch (same idea as points “employees”). */
export const PUNCH_ROLES = ["mechanic", "accountant", "receptionist"];

/** Roles allowed to show the rotating QR on the workshop screen. */
export const DISPLAY_ROLES = ["workshop", "admin", "manager"];
export const TIME_ADMIN_ROLES = ["admin", "manager"];

const PUNCH_COOLDOWN_SECONDS = 15;
const EXPECTED_MINUTES_MON_TO_FRI = 8 * 60 + 30; // 8:30 hours
const EXPECTED_MINUTES_SATURDAY = 4 * 60; // 4 hours
const LATE_CHECK_IN_HOUR = 9;
const CHECK_OUT_GRACE_HOUR = 18;

function hasInvalidAlternatingSequence(punches) {
  if (!Array.isArray(punches) || punches.length === 0) {
    return false;
  }
  if (punches[0].type !== "in") {
    return true;
  }
  for (let i = 1; i < punches.length; i += 1) {
    if (punches[i].type === punches[i - 1].type) {
      return true;
    }
  }
  return false;
}

function summarizePunchesForDay(punches, options = {}) {
  const { workDate = null, nowAddis = DateTime.now().setZone("Africa/Addis_Ababa") } = options;
  const sorted = [...punches].sort((a, b) => new Date(a.at) - new Date(b.at));
  let totalMs = 0;
  let openIn = null;
  const anomalies = [];
  let prevType = null;

  for (const punch of sorted) {
    if (prevType && prevType === punch.type) {
      anomalies.push("sequence");
    }
    prevType = punch.type;

    if (punch.type === "in") {
      openIn = punch.at;
      continue;
    }
    if (punch.type === "out" && openIn) {
      totalMs += new Date(punch.at).getTime() - new Date(openIn).getTime();
      openIn = null;
    }
  }

  const firstInAt = sorted.find((p) => p.type === "in")?.at || null;
  const lastOutAt = [...sorted].reverse().find((p) => p.type === "out")?.at || null;
  const hasOpenShift = sorted.length % 2 !== 0 || Boolean(openIn);
  const firstInAddis = firstInAt
    ? DateTime.fromJSDate(new Date(firstInAt), { zone: "utc" }).setZone("Africa/Addis_Ababa")
    : null;
  const isTodayWorkDate = workDate ? workDate === nowAddis.toISODate() : false;
  const nowPastLateCheckIn = nowAddis.hour > LATE_CHECK_IN_HOUR || (nowAddis.hour === LATE_CHECK_IN_HOUR && nowAddis.minute > 0);
  const nowPastCheckoutGrace = nowAddis.hour >= CHECK_OUT_GRACE_HOUR;

  if (firstInAddis && (firstInAddis.hour > LATE_CHECK_IN_HOUR || (firstInAddis.hour === LATE_CHECK_IN_HOUR && firstInAddis.minute > 0))) {
    anomalies.push("late_check_in");
  } else if (!firstInAddis && isTodayWorkDate && nowPastLateCheckIn) {
    anomalies.push("late_check_in");
  }

  if (hasOpenShift) {
    if (!workDate) {
      anomalies.push("missing_checkout");
    } else if (isTodayWorkDate ? nowPastCheckoutGrace : true) {
      anomalies.push("missing_checkout");
    }
  }

  return {
    firstInAt,
    lastOutAt,
    totalMinutes: Math.max(0, Math.floor(totalMs / 60000)),
    anomalies: [...new Set(anomalies)],
  };
}

function getExpectedMinutesForWorkDate(workDate) {
  const day = DateTime.fromISO(workDate, { zone: "Africa/Addis_Ababa" });
  if (!day.isValid) return 0;
  if (day.weekday >= 1 && day.weekday <= 5) return EXPECTED_MINUTES_MON_TO_FRI;
  if (day.weekday === 6) return EXPECTED_MINUTES_SATURDAY;
  return 0;
}

function buildDayBalance(workDate, dayPunches, nowAddis, holidayDates = new Set(), leaveDates = new Set()) {
  const isHoliday = holidayDates.has(workDate);
  const isOnLeave = leaveDates.has(workDate);
  const summary = summarizePunchesForDay(dayPunches, { workDate, nowAddis });
  const expectedMinutes = (isHoliday || isOnLeave) ? 0 : getExpectedMinutesForWorkDate(workDate);
  const overtimeMinutes = Math.max(0, summary.totalMinutes - expectedMinutes);
  const lostMinutes = Math.max(0, expectedMinutes - summary.totalMinutes);
  return {
    summary,
    expectedMinutes,
    overtimeMinutes,
    lostMinutes,
    isOffDay: expectedMinutes === 0,
    isHoliday,
    isOnLeave,
  };
}

function buildTodayStatusFromPunches(punches) {
  const lastPunch = punches.length ? punches[punches.length - 1] : null;
  return !lastPunch ? "none" : lastPunch.type === "in" ? "checked_in" : "checked_out";
}

function mapDaySummaryRow(workDate, dayPunches, nowAddis, holidayDates = new Set(), leaveDates = new Set()) {
  const dayBalance = buildDayBalance(workDate, dayPunches, nowAddis, holidayDates, leaveDates);
  const { summary } = dayBalance;
  return {
    workDate,
    ethiopianWorkDate: toEthiopianNumericDateStringFromGregorianDate(workDate),
    totalMinutes: summary.totalMinutes,
    expectedMinutes: dayBalance.expectedMinutes,
    overtimeMinutes: dayBalance.overtimeMinutes,
    lostMinutes: dayBalance.lostMinutes,
    isOffDay: dayBalance.isOffDay,
    isHoliday: dayBalance.isHoliday,
    isOnLeave: dayBalance.isOnLeave,
    firstInAt: summary.firstInAt ? new Date(summary.firstInAt).toISOString() : null,
    lastOutAt: summary.lastOutAt ? new Date(summary.lastOutAt).toISOString() : null,
    anomalies: summary.anomalies,
    punchesCount: dayPunches.length,
  };
}

async function getLatestPunchMapForDay(dayStart, dayEnd) {
  const dayPunches = await TimePunch.find({
    at: { $gte: dayStart, $lt: dayEnd },
  })
    .sort({ employee: 1, at: -1 })
    .populate("employee", "firstName lastName email role");

  const latestByEmployee = new Map();
  for (const punch of dayPunches) {
    const key = String(punch.employee?._id || punch.employee);
    if (!latestByEmployee.has(key)) {
      latestByEmployee.set(key, punch);
    }
  }
  return latestByEmployee;
}

/**
 * Loads all holidays in [fromDate, toDate] (inclusive, YYYY-MM-DD) and returns a Set
 * of date strings for O(1) lookups during day iteration.
 * @param {string} fromDate - YYYY-MM-DD
 * @param {string} toDate   - YYYY-MM-DD
 * @returns {Promise<Set<string>>}
 */
async function fetchHolidaySet(fromDate, toDate) {
  const holidays = await Holiday.find({ date: { $gte: fromDate, $lte: toDate } })
    .select("date")
    .lean();
  return new Set(holidays.map((h) => h.date));
}

/**
 * Loads approved leave dates for a specific employee in [fromDate, toDate] and returns a Set
 * of date strings for O(1) lookups during day iteration.
 * @param {string|import('mongoose').Types.ObjectId} employeeId
 * @param {string} fromDate - YYYY-MM-DD
 * @param {string} toDate   - YYYY-MM-DD
 * @returns {Promise<Set<string>>}
 */
async function fetchApprovedLeaveSet(employeeId, fromDate, toDate) {
  const leaves = await LeaveRequest.find({
    employee: employeeId,
    date: { $gte: fromDate, $lte: toDate },
    status: "approved",
  })
    .select("date")
    .lean();
  return new Set(leaves.map((l) => l.date));
}

/**
 * GET /time/display — build QR target URL (stateless code from server time + secret).
 */
export const getTimeDisplay = asyncHandler(async (req, res) => {
  const secret = process.env.WORKSHOP_QR_SECRET;
  if (!secret) {
    throw new ErrorResponse("Time tracking is not configured (missing WORKSHOP_QR_SECRET)", 503);
  }

  const baseUrl = process.env.PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new ErrorResponse(
      "Time tracking display is not configured (missing PUBLIC_APP_URL — e.g. https://your-app.example.com)",
      503,
    );
  }

  const stepSeconds = getStepSeconds();
  const { code, validUntil } = getCurrentDisplayPayload(secret, new Date(), stepSeconds);
  const qrUrl = `${baseUrl}/time/punch?code=${encodeURIComponent(code)}`;

  res.status(200).json({
    status: "success",
    data: {
      qrUrl,
      validUntil: validUntil.toISOString(),
      stepSeconds,
    },
  });
});

/**
 * POST /time/punch — validate window code, guard against rapid double scans,
 * then alternate in/out for today (Addis day).
 */
export const postTimePunch = asyncHandler(async (req, res) => {
  const secret = process.env.WORKSHOP_QR_SECRET;
  if (!secret) {
    throw new ErrorResponse("Time tracking is not configured (missing WORKSHOP_QR_SECRET)", 503);
  }

  const code = req.body?.code;
  if (!code || typeof code !== "string") {
    throw new ErrorResponse("Missing code", 400);
  }

  const stepSeconds = getStepSeconds();
  if (!isValidWorkshopCode(secret, code, new Date(), stepSeconds)) {
    throw new ErrorResponse("Invalid or expired code — scan the QR on the workshop screen again.", 400);
  }

  const now = new Date();
  const workDate = addisTodayPlainDateString();
  const { start: dayStart, end: dayEnd } = addisWorkDateToUtcRange(workDate);

  const dayPunches = await TimePunch.find({
    employee: req.user.id,
    at: { $gte: dayStart, $lt: dayEnd },
  }).sort({ at: 1 });

  if (hasInvalidAlternatingSequence(dayPunches)) {
    throw new ErrorResponse(
      "Today's punch sequence needs manager review before another scan.",
      409,
    );
  }

  const lastPunch = dayPunches.length ? dayPunches[dayPunches.length - 1] : null;

  if (lastPunch && now.getTime() - new Date(lastPunch.at).getTime() < PUNCH_COOLDOWN_SECONDS * 1000) {
    throw new ErrorResponse("You just scanned. Please wait a few seconds and try again.", 409);
  }

  let nextType;
  if (!lastPunch || lastPunch.type === "out") {
    nextType = "in";
  } else {
    nextType = "out";
  }

  const punch = await TimePunch.create({
    employee: req.user.id,
    type: nextType,
    at: now,
  });

  res.status(201).json({
    status: "success",
    message: nextType === "in" ? "Checked in" : "Checked out",
    data: {
      type: punch.type,
      at: punch.at.toISOString(),
      atEthiopianDate: toEthiopianNumericDateStringFromDate(punch.at),
      source: punch.source || "qr",
    },
  });
});

/**
 * GET /time/me/status — last punch today (Addis work day) for the current employee.
 */
export const getMyTimeStatus = asyncHandler(async (req, res) => {
  const workDate = addisTodayPlainDateString();
  const { start: dayStart, end: dayEnd } = addisWorkDateToUtcRange(workDate);

  const lastPunch = await TimePunch.findOne({
    employee: req.user.id,
    at: { $gte: dayStart, $lt: dayEnd },
  }).sort({ at: -1 });

  const status = !lastPunch ? "none" : lastPunch.type === "in" ? "checked_in" : "checked_out";

  res.status(200).json({
    status: "success",
    data: {
      workDate,
      ethiopianWorkDate: toEthiopianNumericDateStringFromGregorianDate(workDate),
      todayStatus: status,
      lastPunch: lastPunch
        ? {
            type: lastPunch.type,
            at: lastPunch.at.toISOString(),
            atEthiopianDate: toEthiopianNumericDateStringFromDate(lastPunch.at),
          }
        : null,
    },
  });
});

/**
 * GET /time/at-work — manager/admin panel for who is currently checked in (today).
 */
export const getAtWorkEmployees = asyncHandler(async (req, res) => {
  const workDate = addisTodayPlainDateString();
  const { start: dayStart, end: dayEnd } = addisWorkDateToUtcRange(workDate);

  const latestByEmployee = await getLatestPunchMapForDay(dayStart, dayEnd);

  const atWork = [];
  for (const punch of latestByEmployee.values()) {
    if (!punch.employee || !PUNCH_ROLES.includes(punch.employee.role)) {
      continue;
    }
    if (punch.type === "in") {
      atWork.push({
        employeeId: punch.employee._id,
        firstName: punch.employee.firstName,
        lastName: punch.employee.lastName,
        role: punch.employee.role,
        checkedInAt: punch.at.toISOString(),
        checkedInAtEthiopianDate: toEthiopianNumericDateStringFromDate(punch.at),
      });
    }
  }

  atWork.sort((a, b) => new Date(a.checkedInAt) - new Date(b.checkedInAt));

  res.status(200).json({
    status: "success",
    data: {
      date: dayStart.toISOString(),
      workDate,
      ethiopianWorkDate: toEthiopianNumericDateStringFromGregorianDate(workDate),
      count: atWork.length,
      employees: atWork,
    },
  });
});

/**
 * GET /time/employees/:employeeId/today — manager/admin detail for one employee.
 */
export const getEmployeeTodayDetail = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  const employee = await User.findById(employeeId).select("role").lean();
  if (!employee) throw new ErrorResponse("Employee not found", 404);
  if (!PUNCH_ROLES.includes(employee.role)) throw new ErrorResponse("Employee is not in a trackable role", 400);

  const workDate = addisTodayPlainDateString();
  const { start: dayStart, end: dayEnd } = addisWorkDateToUtcRange(workDate);

  const punches = await TimePunch.find({
    employee: employeeId,
    at: { $gte: dayStart, $lt: dayEnd },
  }).sort({ at: 1 });

  const lastPunch = punches.length ? punches[punches.length - 1] : null;
  const todayStatus = !lastPunch ? "none" : lastPunch.type === "in" ? "checked_in" : "checked_out";

  res.status(200).json({
    status: "success",
    data: {
      employeeId,
      date: dayStart.toISOString(),
      workDate,
      ethiopianWorkDate: toEthiopianNumericDateStringFromGregorianDate(workDate),
      todayStatus,
      punches: punches.map((p) => ({
        id: p._id,
        type: p.type,
        at: p.at.toISOString(),
        atEthiopianDate: toEthiopianNumericDateStringFromDate(p.at),
        source: p.source || "qr",
      })),
    },
  });
});

/**
 * GET /time/me/today — employee self view for today's in/out timeline.
 */
export const getMyTodayDetail = asyncHandler(async (req, res) => {
  const workDate = addisTodayPlainDateString();
  const { start: dayStart, end: dayEnd } = addisWorkDateToUtcRange(workDate);

  const punches = await TimePunch.find({
    employee: req.user.id,
    at: { $gte: dayStart, $lt: dayEnd },
  }).sort({ at: 1 });

  const lastPunch = punches.length ? punches[punches.length - 1] : null;
  const todayStatus = !lastPunch ? "none" : lastPunch.type === "in" ? "checked_in" : "checked_out";

  res.status(200).json({
    status: "success",
    data: {
      date: dayStart.toISOString(),
      workDate,
      ethiopianWorkDate: toEthiopianNumericDateStringFromGregorianDate(workDate),
      todayStatus,
      punches: punches.map((p) => ({
        id: p._id,
        type: p.type,
        at: p.at.toISOString(),
        atEthiopianDate: toEthiopianNumericDateStringFromDate(p.at),
        source: p.source || "qr",
      })),
    },
  });
});

/** Groups an array of TimePunch documents into a Map keyed by Addis work date string. */
function groupPunchesByAddisWorkDate(punches) {
  const byWorkDate = new Map();
  for (const punch of punches) {
    const workDate = DateTime.fromJSDate(punch.at, { zone: "utc" })
      .setZone("Africa/Addis_Ababa")
      .toISODate();
    const row = byWorkDate.get(workDate) || [];
    row.push({ id: punch._id, type: punch.type, at: punch.at, source: punch.source || "qr" });
    byWorkDate.set(workDate, row);
  }
  return byWorkDate;
}

/**
 * Accumulates month totals.
 * @param {DateTime} monthRef - DateTime within the target month (used to build workDate strings).
 * @param {Map} byWorkDate - punch data grouped by Addis work date.
 * @param {number} dayCount - how many days to iterate (nowAddis.day for current month, daysInMonth for historical).
 * @param {DateTime} nowAddis - current real time in Addis (for anomaly context in summarizePunchesForDay).
 */
function accumulateMonthTotals(monthRef, byWorkDate, dayCount, nowAddis, holidayDates = new Set(), leaveDates = new Set()) {
  let totalMinutes = 0;
  let expectedMinutes = 0;
  let overtimeMinutes = 0;
  let lostMinutes = 0;
  for (let day = 1; day <= dayCount; day += 1) {
    const workDate = monthRef.set({ day }).toISODate();
    const row = mapDaySummaryRow(workDate, byWorkDate.get(workDate) || [], nowAddis, holidayDates, leaveDates);
    totalMinutes += row.totalMinutes;
    expectedMinutes += row.expectedMinutes;
    overtimeMinutes += row.overtimeMinutes;
    lostMinutes += row.lostMinutes;
  }
  return { totalMinutes, expectedMinutes, overtimeMinutes, lostMinutes, netMinutes: totalMinutes - expectedMinutes };
}

/**
 * GET /time/me/summary — employee dashboard data (7-day + month summaries).
 * Accepts optional ?year=YYYY&month=M to view a historical Gregorian month.
 */
export const getMyTimeSummary = asyncHandler(async (req, res) => {
  const nowAddis = DateTime.now().setZone("Africa/Addis_Ababa");

  const yearParam = req.query.year ? parseInt(req.query.year, 10) : null;
  const monthParam = req.query.month ? parseInt(req.query.month, 10) : null;
  const isHistorical = Boolean(yearParam && monthParam);

  let monthRef;
  let dayCount;
  let queryStart;
  let queryEnd;

  if (isHistorical) {
    monthRef = DateTime.fromObject({ year: yearParam, month: monthParam, day: 1 }, { zone: "Africa/Addis_Ababa" });
    if (!monthRef.isValid) throw new ErrorResponse("Invalid year or month", 400);
    if (monthRef.startOf("month") > nowAddis.startOf("month")) {
      throw new ErrorResponse("Cannot view future months", 400);
    }
    const range = addisMonthToUtcRange(yearParam, monthParam);
    queryStart = range.start;
    queryEnd = range.end;
    dayCount = range.daysInMonth;
  } else {
    monthRef = nowAddis;
    dayCount = nowAddis.day;
    const { start } = addisWorkDateToUtcRange(nowAddis.startOf("month").toISODate());
    const { end } = addisWorkDateToUtcRange(nowAddis.toISODate());
    queryStart = start;
    queryEnd = end;
  }

  const punches = await TimePunch.find({
    employee: req.user.id,
    at: { $gte: queryStart, $lte: queryEnd },
  }).sort({ at: 1 });

  const byWorkDate = groupPunchesByAddisWorkDate(punches);

  // Last 7 days: end of the viewed month for historical, today for current
  const last7DaysRef = isHistorical ? monthRef.set({ day: dayCount }) : nowAddis;

  // Pre-fetch holidays and approved leaves covering both the month range and the last-7-days window
  const last7Start = last7DaysRef.minus({ days: 6 }).toISODate();
  const monthStart = monthRef.startOf("month").toISODate();
  const rangeStart = last7Start < monthStart ? last7Start : monthStart;
  const rangeEnd = last7DaysRef.toISODate();
  const [holidayDates, leaveDates] = await Promise.all([
    fetchHolidaySet(rangeStart, rangeEnd),
    fetchApprovedLeaveSet(req.user.id, rangeStart, rangeEnd),
  ]);

  const last7Days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = last7DaysRef.minus({ days: i }).toISODate();
    last7Days.push(mapDaySummaryRow(day, byWorkDate.get(day) || [], nowAddis, holidayDates, leaveDates));
  }
  const weekTotalMinutes = last7Days.reduce((s, r) => s + r.totalMinutes, 0);
  const weekExpectedMinutes = last7Days.reduce((s, r) => s + r.expectedMinutes, 0);
  const weekOvertimeMinutes = last7Days.reduce((s, r) => s + r.overtimeMinutes, 0);
  const weekLostMinutes = last7Days.reduce((s, r) => s + r.lostMinutes, 0);
  const weekNetMinutes = weekTotalMinutes - weekExpectedMinutes;

  const monthDays = [];
  let cumulativeMinutes = 0;
  let cumulativeExpectedMinutes = 0;
  for (let day = 1; day <= dayCount; day += 1) {
    const d = monthRef.set({ day }).toISODate();
    const row = mapDaySummaryRow(d, byWorkDate.get(d) || [], nowAddis, holidayDates, leaveDates);
    cumulativeMinutes += row.totalMinutes;
    cumulativeExpectedMinutes += row.expectedMinutes;
    monthDays.push({
      ...row,
      dayOfMonth: day,
      cumulativeMinutes,
      cumulativeExpectedMinutes,
      netMinutes: row.totalMinutes - row.expectedMinutes,
    });
  }

  const monthTotals = accumulateMonthTotals(monthRef, byWorkDate, dayCount, nowAddis, holidayDates, leaveDates);

  res.status(200).json({
    status: "success",
    data: {
      workDate: nowAddis.toISODate(),
      ethiopianWorkDate: toEthiopianNumericDateStringFromGregorianDate(nowAddis.toISODate()),
      viewYear: monthRef.year,
      viewMonth: monthRef.month,
      isCurrentMonth: !isHistorical,
      last7Days,
      month: {
        year: monthRef.year,
        month: monthRef.month,
        totalMinutes: monthTotals.totalMinutes,
        expectedMinutes: monthTotals.expectedMinutes,
        netMinutes: monthTotals.netMinutes,
        overtimeMinutes: monthTotals.overtimeMinutes,
        lostMinutes: monthTotals.lostMinutes,
        days: monthDays,
      },
      totals: {
        weekMinutes: weekTotalMinutes,
        weekExpectedMinutes,
        weekNetMinutes,
        weekOvertimeMinutes,
        weekLostMinutes,
        monthMinutes: monthTotals.totalMinutes,
        monthExpectedMinutes: monthTotals.expectedMinutes,
        monthNetMinutes: monthTotals.netMinutes,
        monthOvertimeMinutes: monthTotals.overtimeMinutes,
        monthLostMinutes: monthTotals.lostMinutes,
      },
    },
  });
});

/**
 * GET /time/team/overview — manager dashboard KPIs + all employees with today status.
 */
export const getTeamOverview = asyncHandler(async (req, res) => {
  const nowAddis = DateTime.now().setZone("Africa/Addis_Ababa");
  const workDate = nowAddis.toISODate();
  const { start: dayStart, end: dayEnd } = addisWorkDateToUtcRange(workDate);

  const [allEmployees, todayPunches, pendingCorrectionsCount, holidayDates, todayApprovedLeaves] = await Promise.all([
    User.find({ role: { $in: PUNCH_ROLES } }).select("firstName lastName role email profilePicture").sort({ firstName: 1, lastName: 1 }).lean(),
    TimePunch.find({ at: { $gte: dayStart, $lt: dayEnd } }).sort({ employee: 1, at: 1 }).lean(),
    TimeCorrectionRequest.countDocuments({ status: "pending" }),
    fetchHolidaySet(workDate, workDate),
    LeaveRequest.find({ date: workDate, status: "approved" }).select("employee").lean(),
  ]);
  const isTodayHoliday = holidayDates.has(workDate);
  const todayLeaveEmployeeIds = new Set(todayApprovedLeaves.map((l) => String(l.employee)));

  const punchesByEmployee = new Map();
  for (const p of todayPunches) {
    const key = String(p.employee);
    const row = punchesByEmployee.get(key) || [];
    row.push(p);
    punchesByEmployee.set(key, row);
  }

  let checkedInCount = 0;
  let anomaliesCount = 0;
  const employees = allEmployees.map((emp) => {
    const dayPunches = punchesByEmployee.get(String(emp._id)) || [];
    const status = buildTodayStatusFromPunches(dayPunches);
    const daySummary = summarizePunchesForDay(dayPunches, { workDate, nowAddis });
    const isOnLeaveToday = todayLeaveEmployeeIds.has(String(emp._id));
    const todayAnomalies = (isTodayHoliday || isOnLeaveToday) ? [] : daySummary.anomalies;
    if (status === "checked_in") checkedInCount += 1;
    if (todayAnomalies.length > 0) anomaliesCount += 1;
    return {
      employeeId: emp._id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      role: emp.role,
      profilePicture: emp.profilePicture || null,
      todayStatus: status,
      isOnLeaveToday,
      todayAnomalies,
      checkedInAt: status === "checked_in" ? dayPunches[dayPunches.length - 1]?.at?.toISOString?.() || null : null,
    };
  });

  res.status(200).json({
    status: "success",
    data: {
      workDate,
      ethiopianWorkDate: toEthiopianNumericDateStringFromGregorianDate(workDate),
      isHoliday: isTodayHoliday,
      kpis: {
        checkedInNow: checkedInCount,
        pendingCorrections: pendingCorrectionsCount,
        todayAnomalies: anomaliesCount,
      },
      employees,
    },
  });
});

/**
 * GET /time/employees/:employeeId/summary — manager view for one employee.
 * Accepts optional ?year=YYYY&month=M to view a historical Gregorian month.
 */
export const getEmployeeSummary = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  const employee = await User.findById(employeeId).select("role").lean();
  if (!employee) throw new ErrorResponse("Employee not found", 404);
  if (!PUNCH_ROLES.includes(employee.role)) throw new ErrorResponse("Employee is not in a trackable role", 400);

  const nowAddis = DateTime.now().setZone("Africa/Addis_Ababa");
  const todayWorkDate = nowAddis.toISODate();

  const yearParam = req.query.year ? parseInt(req.query.year, 10) : null;
  const monthParam = req.query.month ? parseInt(req.query.month, 10) : null;
  const isHistorical = Boolean(yearParam && monthParam);

  let monthRef;
  let dayCount;
  let queryStart;
  let queryEnd;

  if (isHistorical) {
    monthRef = DateTime.fromObject({ year: yearParam, month: monthParam, day: 1 }, { zone: "Africa/Addis_Ababa" });
    if (!monthRef.isValid) throw new ErrorResponse("Invalid year or month", 400);
    if (monthRef.startOf("month") > nowAddis.startOf("month")) {
      throw new ErrorResponse("Cannot view future months", 400);
    }
    const range = addisMonthToUtcRange(yearParam, monthParam);
    queryStart = range.start;
    queryEnd = range.end;
    dayCount = range.daysInMonth;
  } else {
    monthRef = nowAddis;
    dayCount = nowAddis.day;
    const { start } = addisWorkDateToUtcRange(nowAddis.startOf("month").toISODate());
    const { end } = addisWorkDateToUtcRange(todayWorkDate);
    queryStart = start;
    queryEnd = end;
  }

  const punches = await TimePunch.find({
    employee: employeeId,
    at: { $gte: queryStart, $lte: queryEnd },
  }).sort({ at: 1 });

  const byWorkDate = groupPunchesByAddisWorkDate(punches);

  const todayPunches = byWorkDate.get(todayWorkDate) || [];
  const todaySummary = summarizePunchesForDay(todayPunches, { workDate: todayWorkDate, nowAddis });

  const last7DaysRef = isHistorical ? monthRef.set({ day: dayCount }) : nowAddis;

  // Pre-fetch holidays and approved leaves covering both the month range and the last-7-days window
  const last7Start = last7DaysRef.minus({ days: 6 }).toISODate();
  const monthStart = monthRef.startOf("month").toISODate();
  const rangeStartEmp = last7Start < monthStart ? last7Start : monthStart;
  const rangeEndEmp = last7DaysRef.toISODate();
  const [holidayDates, leaveDates] = await Promise.all([
    fetchHolidaySet(rangeStartEmp, rangeEndEmp),
    fetchApprovedLeaveSet(employeeId, rangeStartEmp, rangeEndEmp),
  ]);

  const last7Days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = last7DaysRef.minus({ days: i }).toISODate();
    last7Days.push(mapDaySummaryRow(day, byWorkDate.get(day) || [], nowAddis, holidayDates, leaveDates));
  }

  const monthTotals = accumulateMonthTotals(monthRef, byWorkDate, dayCount, nowAddis, holidayDates, leaveDates);

  res.status(200).json({
    status: "success",
    data: {
      workDate: todayWorkDate,
      ethiopianWorkDate: toEthiopianNumericDateStringFromGregorianDate(todayWorkDate),
      viewYear: monthRef.year,
      viewMonth: monthRef.month,
      isCurrentMonth: !isHistorical,
      todayStatus: buildTodayStatusFromPunches(todayPunches),
      todayAnomalies: (holidayDates.has(todayWorkDate) || leaveDates.has(todayWorkDate)) ? [] : todaySummary.anomalies,
      today: {
        punches: todayPunches.map((p) => ({
          id: p.id,
          type: p.type,
          at: new Date(p.at).toISOString(),
          atEthiopianDate: toEthiopianNumericDateStringFromDate(new Date(p.at)),
          source: p.source,
        })),
      },
      last7Days,
      monthTotals: {
        workedMinutes: monthTotals.totalMinutes,
        expectedMinutes: monthTotals.expectedMinutes,
        netMinutes: monthTotals.netMinutes,
        overtimeMinutes: monthTotals.overtimeMinutes,
        lostMinutes: monthTotals.lostMinutes,
      },
    },
  });
});

/**
 * POST /time/admin/punches — admin/manager manually creates a punch for any punchable employee.
 * Body: { employeeId, type: 'in'|'out', workDate: 'YYYY-MM-DD', time: 'HH:mm' }
 */
export const createAdminPunch = asyncHandler(async (req, res) => {
  const { employeeId, type, workDate, time } = req.body || {};

  if (!["in", "out"].includes(type)) throw new ErrorResponse("type must be in or out", 400);
  if (!isValidWorkDateString(workDate)) throw new ErrorResponse("workDate must be YYYY-MM-DD", 400);

  const employee = await User.findById(employeeId).select("firstName lastName role").lean();
  if (!employee) throw new ErrorResponse("Employee not found", 404);
  if (!PUNCH_ROLES.includes(employee.role)) throw new ErrorResponse("Employee is not in a trackable role", 400);

  let at;
  try {
    at = addisDateAndTimeToUtc(workDate, String(time).trim());
  } catch {
    throw new ErrorResponse("time must be HH:mm in 24-hour format (Addis timezone)", 400);
  }

  const { start: dayStart, end: dayEnd } = addisWorkDateToUtcRange(workDate);
  const existingPunches = await TimePunch.find({
    employee: employeeId,
    at: { $gte: dayStart, $lte: dayEnd },
  }).sort({ at: 1 }).lean();

  // Simulate inserting the new punch in chronological order and validate the sequence.
  const simulated = [...existingPunches, { type, at }].sort((a, b) => new Date(a.at) - new Date(b.at));
  if (hasInvalidAlternatingSequence(simulated)) {
    throw new ErrorResponse("This punch would create an invalid in/out sequence for that day.", 409);
  }

  const punch = await TimePunch.create({
    employee: employeeId,
    type,
    at,
    source: "correction",
  });

  res.status(201).json({
    status: "success",
    message: "Punch created",
    data: {
      id: punch._id,
      type: punch.type,
      at: punch.at.toISOString(),
      atEthiopianDate: toEthiopianNumericDateStringFromDate(punch.at),
      source: punch.source,
      employee: { id: employee._id, firstName: employee.firstName, lastName: employee.lastName },
    },
  });
});

/**
 * DELETE /time/admin/punches/:id — admin/manager deletes a punch record.
 */
export const deleteAdminPunch = asyncHandler(async (req, res) => {
  const punch = await TimePunch.findById(req.params.id);
  if (!punch) throw new ErrorResponse("Punch not found", 404);

  await punch.deleteOne();

  res.status(200).json({ status: "success", message: "Punch deleted" });
});

/**
 * GET /time/employees/:employeeId/profile — rich profile for admin/manager.
 * Returns employee info, today status, 3-month trend stats, current month daily breakdown,
 * and recent correction history.
 */
export const getEmployeeProfile = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  const employee = await User.findById(employeeId).select("firstName lastName role email").lean();
  if (!employee) throw new ErrorResponse("Employee not found", 404);
  if (!PUNCH_ROLES.includes(employee.role)) throw new ErrorResponse("Employee is not in a trackable role", 400);

  const nowAddis = DateTime.now().setZone("Africa/Addis_Ababa");
  const todayWorkDate = nowAddis.toISODate();

  // Today's punches
  const { start: dayStart, end: dayEnd } = addisWorkDateToUtcRange(todayWorkDate);
  const todayPunches = await TimePunch.find({
    employee: employeeId,
    at: { $gte: dayStart, $lt: dayEnd },
  }).sort({ at: 1 });
  const todaySummary = summarizePunchesForDay(todayPunches, { workDate: todayWorkDate, nowAddis });

  // Pre-fetch holidays and approved leaves for the full 3-month trend window in one query
  const trendStart = nowAddis.minus({ months: 2 }).startOf("month").toISODate();
  const [holidayDates, leaveDates] = await Promise.all([
    fetchHolidaySet(trendStart, todayWorkDate),
    fetchApprovedLeaveSet(employeeId, trendStart, todayWorkDate),
  ]);

  // Last 3 months (current + 2 previous), newest first
  const TREND_MONTHS = 3;
  const trend = [];

  for (let i = 0; i < TREND_MONTHS; i += 1) {
    const monthRef = nowAddis.minus({ months: i }).startOf("month");
    const isCurrentMonth = i === 0;
    const dayCount = isCurrentMonth ? nowAddis.day : monthRef.daysInMonth;
    const range = addisMonthToUtcRange(monthRef.year, monthRef.month);

    const punches = await TimePunch.find({
      employee: employeeId,
      at: { $gte: range.start, $lte: isCurrentMonth ? dayEnd : range.end },
    }).sort({ at: 1 });

    const byWorkDate = groupPunchesByAddisWorkDate(punches);
    const totals = accumulateMonthTotals(monthRef, byWorkDate, dayCount, nowAddis, holidayDates, leaveDates);

    let daysWorked = 0;
    let daysExpected = 0;
    let daysAbsent = 0;
    let lateArrivals = 0;
    let missingCheckouts = 0;
    const days = [];

    for (let d = 1; d <= dayCount; d += 1) {
      const workDate = monthRef.set({ day: d }).toISODate();
      const row = mapDaySummaryRow(workDate, byWorkDate.get(workDate) || [], nowAddis, holidayDates, leaveDates);
      days.push(row);
      if (!row.isOffDay) {
        daysExpected += 1;
        if (row.totalMinutes > 0) {
          daysWorked += 1;
        } else {
          daysAbsent += 1;
        }
        if (row.anomalies.includes("late_check_in")) lateArrivals += 1;
        if (row.anomalies.includes("missing_checkout")) missingCheckouts += 1;
      }
    }

    trend.push({
      year: monthRef.year,
      month: monthRef.month,
      workedMinutes: totals.totalMinutes,
      expectedMinutes: totals.expectedMinutes,
      netMinutes: totals.netMinutes,
      overtimeMinutes: totals.overtimeMinutes,
      lostMinutes: totals.lostMinutes,
      daysWorked,
      daysExpected,
      daysAbsent,
      lateArrivals,
      missingCheckouts,
      days, // always included; frontend uses current month for day list, ignores others
    });
  }

  // Recent corrections for this employee (last 15)
  const recentCorrections = await TimeCorrectionRequest.find({ employee: employeeId })
    .sort({ createdAt: -1 })
    .limit(15)
    .lean();

  res.status(200).json({
    status: "success",
    data: {
      employee: {
        id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
        email: employee.email,
      },
      today: {
        workDate: todayWorkDate,
        ethiopianWorkDate: toEthiopianNumericDateStringFromGregorianDate(todayWorkDate),
        status: buildTodayStatusFromPunches(todayPunches),
        anomalies: todaySummary.anomalies,
        punches: todayPunches.map((p) => ({
          id: p._id,
          type: p.type,
          at: p.at.toISOString(),
          source: p.source || "qr",
        })),
      },
      trend,
      recentCorrections: recentCorrections.map((r) => ({
        id: r._id,
        status: r.status,
        kind: r.kind,
        punchType: r.punchType,
        workDate: r.workDate,
        ethiopianWorkDate: toEthiopianNumericDateStringFromGregorianDate(r.workDate),
        requestedAt: r.requestedAt?.toISOString() || null,
        note: r.note || null,
        reviewNote: r.reviewNote || null,
        createdAt: r.createdAt?.toISOString() || null,
      })),
    },
  });
});
