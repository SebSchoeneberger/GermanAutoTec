import Holiday from "../models/Holiday.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/errorResponse.js";
import { isValidWorkDateString } from "../utils/addisTime.js";
import { toEthiopianNumericDateStringFromGregorianDate } from "../utils/ethiopianDate.js";

/** POST /time/holidays — manager/admin creates a holiday. */
export const createHoliday = asyncHandler(async (req, res) => {
  const { date, reason } = req.body || {};

  if (!isValidWorkDateString(date)) {
    throw new ErrorResponse("date must be YYYY-MM-DD", 400);
  }

  const existing = await Holiday.findOne({ date });
  if (existing) {
    throw new ErrorResponse("A holiday already exists for this date", 409);
  }

  const holiday = await Holiday.create({
    date,
    reason: reason?.trim() || "",
    createdBy: req.user.id,
  });

  res.status(201).json({
    status: "success",
    data: {
      id: holiday._id,
      date: holiday.date,
      ethiopianDate: toEthiopianNumericDateStringFromGregorianDate(holiday.date),
      reason: holiday.reason,
      createdAt: holiday.createdAt,
    },
  });
});

/** GET /time/holidays — list holidays; optional ?from=YYYY-MM-DD&to=YYYY-MM-DD. */
export const getHolidays = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const filter = {};
  if (from && isValidWorkDateString(from)) filter.date = { ...filter.date, $gte: from };
  if (to && isValidWorkDateString(to)) filter.date = { ...filter.date, $lte: to };

  const holidays = await Holiday.find(filter).sort({ date: 1 }).lean();

  res.status(200).json({
    status: "success",
    data: holidays.map((h) => ({
      id: h._id,
      date: h.date,
      ethiopianDate: toEthiopianNumericDateStringFromGregorianDate(h.date),
      reason: h.reason,
      createdAt: h.createdAt,
    })),
  });
});

/** DELETE /time/holidays/:id — manager/admin removes a holiday. */
export const deleteHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findById(req.params.id);
  if (!holiday) throw new ErrorResponse("Holiday not found", 404);

  await holiday.deleteOne();

  res.status(200).json({ status: "success", message: "Holiday removed" });
});
