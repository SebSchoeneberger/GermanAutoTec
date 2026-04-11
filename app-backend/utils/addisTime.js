import { DateTime } from "luxon";

/** Wall-clock calendar for the workshop (Addis Ababa). */
export const ADDIS_TZ = "Africa/Addis_Ababa";

export const CORRECTION_LOOKBACK_DAYS = 14;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidWorkDateString(s) {
  return typeof s === "string" && DATE_RE.test(s);
}

/**
 * Inclusive Addis calendar bounds for a work day as UTC Dates (Mongo queries).
 */
export function addisWorkDateToUtcRange(workDateStr) {
  const day = DateTime.fromISO(workDateStr, { zone: ADDIS_TZ });
  if (!day.isValid) {
    throw new Error("Invalid workDate");
  }
  const start = day.startOf("day").toUTC();
  const end = day.endOf("day").toUTC();
  return {
    start: start.toJSDate(),
    end: end.toJSDate(),
  };
}

/**
 * Combine Addis work date (YYYY-MM-DD) and local time (HH:mm) into a UTC Date.
 */
export function addisDateAndTimeToUtc(workDateStr, timeHm) {
  if (typeof timeHm !== "string" || !/^\d{1,2}:\d{2}$/.test(timeHm)) {
    throw new Error("Invalid time");
  }
  const [hRaw, mRaw] = timeHm.split(":");
  const hour = parseInt(hRaw, 10);
  const minute = parseInt(mRaw, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) {
    throw new Error("Invalid time");
  }
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  const dt = DateTime.fromISO(`${workDateStr}T${hh}:${mm}:00`, { zone: ADDIS_TZ });
  if (!dt.isValid) {
    throw new Error("Invalid date/time");
  }
  return dt.toUTC().toJSDate();
}

/** workDate must be within the last CORRECTION_LOOKBACK_DAYS through today (Addis), inclusive. */
export function isWorkDateInCorrectionWindow(workDateStr) {
  const wd = DateTime.fromISO(workDateStr, { zone: ADDIS_TZ }).startOf("day");
  if (!wd.isValid) return false;
  const today = DateTime.now().setZone(ADDIS_TZ).startOf("day");
  const min = today.minus({ days: CORRECTION_LOOKBACK_DAYS - 1 });
  return wd.toMillis() >= min.toMillis() && wd.toMillis() <= today.toMillis();
}

export function addisTodayPlainDateString() {
  return DateTime.now().setZone(ADDIS_TZ).toISODate();
}

/**
 * UTC start/end for a full Gregorian year-month as seen in Addis timezone.
 * Useful for querying a complete historical month.
 */
export function addisMonthToUtcRange(year, month) {
  const monthStart = DateTime.fromObject({ year, month, day: 1 }, { zone: ADDIS_TZ });
  if (!monthStart.isValid) throw new Error("Invalid year or month");
  const start = monthStart.startOf("day").toUTC();
  const end = monthStart.endOf("month").toUTC();
  return { start: start.toJSDate(), end: end.toJSDate(), daysInMonth: monthStart.daysInMonth };
}

/** For correction forms: selectable work dates in Addis (inclusive). */
export function getCorrectionWindowPlainStrings() {
  const today = DateTime.now().setZone(ADDIS_TZ);
  const min = today.minus({ days: CORRECTION_LOOKBACK_DAYS - 1 });
  return { minWorkDate: min.toISODate(), maxWorkDate: today.toISODate() };
}

/** True if `at` (UTC) falls on workDateStr in Addis. */
export function utcInstantIsOnAddisWorkDate(at, workDateStr) {
  return DateTime.fromJSDate(at, { zone: "utc" }).setZone(ADDIS_TZ).toISODate() === workDateStr;
}
