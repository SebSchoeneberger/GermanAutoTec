import { DateTime } from "luxon";
import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/errorResponse.js";
import { isValidWorkDateString, ADDIS_TZ } from "../utils/addisTime.js";
import { toEthiopianNumericDateStringFromGregorianDate } from "../utils/ethiopianDate.js";
import { PUNCH_ROLES } from "./timeController.js";

/** Past 3 days + today + future are all valid for leave requests. */
const LEAVE_LOOKBACK_DAYS = 3;

function isDateInLeaveWindow(dateStr) {
  const d = DateTime.fromISO(dateStr, { zone: ADDIS_TZ }).startOf("day");
  if (!d.isValid) return false;
  const min = DateTime.now().setZone(ADDIS_TZ).startOf("day").minus({ days: LEAVE_LOOKBACK_DAYS });
  return d.toMillis() >= min.toMillis();
}

function mapLeave(r) {
  return {
    id: r._id,
    employee: r.employee,
    date: r.date,
    ethiopianDate: toEthiopianNumericDateStringFromGregorianDate(r.date),
    type: r.type,
    note: r.note,
    status: r.status,
    source: r.source || "employee",
    reviewedBy: r.reviewedBy,
    reviewNote: r.reviewNote,
    reviewedAt: r.reviewedAt,
    createdAt: r.createdAt,
  };
}

/** POST /time/leave — employee submits a sick day or day-off request. */
export const createLeaveRequest = asyncHandler(async (req, res) => {
  const { date, type, note } = req.body || {};

  if (!isValidWorkDateString(date)) {
    throw new ErrorResponse("date must be YYYY-MM-DD", 400);
  }
  if (!isDateInLeaveWindow(date)) {
    throw new ErrorResponse(`date must be within the last ${LEAVE_LOOKBACK_DAYS} days or in the future`, 400);
  }
  if (!["sick", "day_off"].includes(type)) {
    throw new ErrorResponse("type must be sick or day_off", 400);
  }

  try {
    const leave = await LeaveRequest.create({
      employee: req.user.id,
      date,
      type,
      note: typeof note === "string" ? note.trim() : "",
    });
    res.status(201).json({
      status: "success",
      message: "Leave request submitted",
      data: mapLeave(leave),
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ErrorResponse("You already have a pending leave request for this date", 400);
    }
    throw err;
  }
});

/** GET /time/leave/mine — employee's own leave requests, newest first. */
export const getMyLeaveRequests = asyncHandler(async (req, res) => {
  const list = await LeaveRequest.find({ employee: req.user.id })
    .sort({ date: -1 })
    .limit(50)
    .populate("reviewedBy", "firstName lastName")
    .lean();

  res.status(200).json({
    status: "success",
    data: list.map(mapLeave),
  });
});

/** GET /time/leave/pending — manager/admin: all pending leave requests, oldest first. */
export const getPendingLeaveRequests = asyncHandler(async (req, res) => {
  const list = await LeaveRequest.find({ status: "pending" })
    .sort({ createdAt: 1 })
    .populate("employee", "firstName lastName role")
    .lean();

  res.status(200).json({
    status: "success",
    data: list.map(mapLeave),
  });
});

/** PATCH /time/leave/:id/approve — manager/admin approves a leave request. */
export const approveLeaveRequest = asyncHandler(async (req, res) => {
  const request = await LeaveRequest.findById(req.params.id);
  if (!request) throw new ErrorResponse("Request not found", 404);
  if (request.status !== "pending") throw new ErrorResponse("This request has already been reviewed", 400);

  request.status = "approved";
  request.reviewedBy = req.user.id;
  request.reviewedAt = new Date();
  request.reviewNote = typeof req.body?.reviewNote === "string" ? req.body.reviewNote : "";
  await request.save();

  res.status(200).json({ status: "success", message: "Leave approved", data: mapLeave(request) });
});

/** PATCH /time/leave/:id/reject — manager/admin rejects a leave request. */
export const rejectLeaveRequest = asyncHandler(async (req, res) => {
  const request = await LeaveRequest.findById(req.params.id);
  if (!request) throw new ErrorResponse("Request not found", 404);
  if (request.status !== "pending") throw new ErrorResponse("This request has already been reviewed", 400);

  request.status = "rejected";
  request.reviewedBy = req.user.id;
  request.reviewedAt = new Date();
  request.reviewNote = typeof req.body?.reviewNote === "string" ? req.body.reviewNote : "";
  await request.save();

  res.status(200).json({ status: "success", message: "Leave rejected", data: mapLeave(request) });
});

/** POST /time/leave/admin — admin/manager directly marks an employee sick or day off. */
export const adminCreateLeaveRecord = asyncHandler(async (req, res) => {
  const { employeeId, date, type, note } = req.body || {};

  if (!employeeId) throw new ErrorResponse("employeeId is required", 400);
  if (!isValidWorkDateString(date)) throw new ErrorResponse("date must be YYYY-MM-DD", 400);
  if (!["sick", "day_off"].includes(type)) throw new ErrorResponse("type must be sick or day_off", 400);

  const employee = await User.findById(employeeId).select("role").lean();
  if (!employee) throw new ErrorResponse("Employee not found", 404);
  if (!PUNCH_ROLES.includes(employee.role)) throw new ErrorResponse("Employee is not in a trackable role", 400);

  // Block if a non-rejected leave already exists for this employee on this date
  const existing = await LeaveRequest.findOne({ employee: employeeId, date, status: { $ne: "rejected" } }).lean();
  if (existing) {
    const label = existing.status === "pending" ? "pending request" : "approved record";
    throw new ErrorResponse(`A ${label} already exists for this employee on ${date}`, 409);
  }

  const leave = await LeaveRequest.create({
    employee: employeeId,
    date,
    type,
    note: typeof note === "string" ? note.trim() : "",
    status: "approved",
    source: "admin",
    reviewedBy: req.user.id,
    reviewedAt: new Date(),
  });

  res.status(201).json({
    status: "success",
    message: "Leave record created",
    data: mapLeave(leave),
  });
});
