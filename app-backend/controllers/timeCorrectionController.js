import TimePunch from "../models/timePunch.js";
import TimeCorrectionRequest from "../models/timeCorrectionRequest.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/errorResponse.js";
import {
  addisDateAndTimeToUtc,
  addisWorkDateToUtcRange,
  getCorrectionWindowPlainStrings,
  isValidWorkDateString,
  isWorkDateInCorrectionWindow,
  utcInstantIsOnAddisWorkDate,
} from "../utils/addisTime.js";
import {
  toEthiopianNumericDateStringFromDate,
  toEthiopianNumericDateStringFromGregorianDate,
} from "../utils/ethiopianDate.js";

export const getCorrectionDateWindow = asyncHandler(async (req, res) => {
  const window = getCorrectionWindowPlainStrings();
  res.status(200).json({
    status: "success",
    data: {
      ...window,
      ethiopianMinWorkDate: toEthiopianNumericDateStringFromGregorianDate(window.minWorkDate),
      ethiopianMaxWorkDate: toEthiopianNumericDateStringFromGregorianDate(window.maxWorkDate),
    },
  });
});

function mapPunch(p) {
  return {
    id: p._id,
    type: p.type,
    at: p.at.toISOString(),
    atEthiopianDate: toEthiopianNumericDateStringFromDate(p.at),
    source: p.source || "qr",
  };
}

/**
 * GET /time/me/day?date=YYYY-MM-DD — punches for that Addis work day (employee).
 */
export const getMyDayPunches = asyncHandler(async (req, res) => {
  const date = req.query.date;
  if (!isValidWorkDateString(date)) {
    throw new ErrorResponse("Query `date` must be YYYY-MM-DD", 400);
  }
  if (!isWorkDateInCorrectionWindow(date)) {
    throw new ErrorResponse("Date is outside the allowed correction window (last 14 days, Addis).", 400);
  }

  const { start, end } = addisWorkDateToUtcRange(date);
  const punches = await TimePunch.find({
    employee: req.user.id,
    at: { $gte: start, $lte: end },
  }).sort({ at: 1 });

  res.status(200).json({
    status: "success",
    data: {
      workDate: date,
      ethiopianWorkDate: toEthiopianNumericDateStringFromGregorianDate(date),
      punches: punches.map(mapPunch),
    },
  });
});

/**
 * POST /time/corrections — submit correction (missing or wrong_time).
 */
export const createTimeCorrectionRequest = asyncHandler(async (req, res) => {
  const { kind, workDate, punchType, time, note, existingPunchId } = req.body || {};

  if (!["missing", "wrong_time"].includes(kind)) {
    throw new ErrorResponse("kind must be missing or wrong_time", 400);
  }
  if (!["in", "out"].includes(punchType)) {
    throw new ErrorResponse("punchType must be in or out", 400);
  }
  if (!isValidWorkDateString(workDate)) {
    throw new ErrorResponse("workDate must be YYYY-MM-DD", 400);
  }
  if (!isWorkDateInCorrectionWindow(workDate)) {
    throw new ErrorResponse("workDate is outside the allowed window (last 14 days, Addis).", 400);
  }

  let requestedAt;
  try {
    requestedAt = addisDateAndTimeToUtc(workDate, String(time).trim());
  } catch {
    throw new ErrorResponse("time must be HH:mm in 24-hour format (Addis timezone)", 400);
  }

  const { start, end } = addisWorkDateToUtcRange(workDate);
  if (requestedAt < start || requestedAt > end) {
    throw new ErrorResponse("time does not fall on the selected work date", 400);
  }

  let existingPunch = null;
  if (kind === "wrong_time") {
    if (!existingPunchId) {
      throw new ErrorResponse("existingPunchId is required for wrong_time", 400);
    }
    const punch = await TimePunch.findById(existingPunchId);
    if (!punch) {
      throw new ErrorResponse("Punch not found", 404);
    }
    if (String(punch.employee) !== String(req.user.id)) {
      throw new ErrorResponse("Not allowed to edit this punch", 403);
    }
    if (punch.type !== punchType) {
      throw new ErrorResponse("punchType does not match the selected punch", 400);
    }
    if (!utcInstantIsOnAddisWorkDate(punch.at, workDate)) {
      throw new ErrorResponse("Selected punch is not on that work date", 400);
    }
    existingPunch = punch;
  }

  const docPayload = {
    employee: req.user.id,
    kind,
    workDate,
    punchType,
    requestedAt,
    note: typeof note === "string" ? note : "",
  };
  if (existingPunch) {
    docPayload.existingPunchId = existingPunch._id;
    docPayload.previousAt = existingPunch.at;
  }

  try {
    const doc = await TimeCorrectionRequest.create(docPayload);
    res.status(201).json({
      status: "success",
      message: "Correction request submitted",
      data: doc,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ErrorResponse("You already have a pending request for this work date.", 400);
    }
    throw err;
  }
});

export const getMyTimeCorrectionRequests = asyncHandler(async (req, res) => {
  const list = await TimeCorrectionRequest.find({ employee: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("reviewedBy", "firstName lastName")
    .lean();

  const data = list.map((r) => ({
    ...r,
    ethiopianWorkDate: toEthiopianNumericDateStringFromGregorianDate(r.workDate),
    requestedAtEthiopianDate: toEthiopianNumericDateStringFromDate(r.requestedAt),
    previousAtEthiopianDate: r.previousAt ? toEthiopianNumericDateStringFromDate(r.previousAt) : null,
  }));

  res.status(200).json({
    status: "success",
    data,
  });
});

export const getPendingTimeCorrectionRequests = asyncHandler(async (req, res) => {
  const list = await TimeCorrectionRequest.find({ status: "pending" })
    .sort({ createdAt: 1 })
    .populate("employee", "firstName lastName email role")
    .lean();

  const data = list.map((r) => ({
    ...r,
    ethiopianWorkDate: toEthiopianNumericDateStringFromGregorianDate(r.workDate),
    requestedAtEthiopianDate: toEthiopianNumericDateStringFromDate(r.requestedAt),
    previousAtEthiopianDate: r.previousAt ? toEthiopianNumericDateStringFromDate(r.previousAt) : null,
  }));

  res.status(200).json({
    status: "success",
    data,
  });
});

export const approveTimeCorrectionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const request = await TimeCorrectionRequest.findById(id);
  if (!request) {
    throw new ErrorResponse("Request not found", 404);
  }
  if (request.status !== "pending") {
    throw new ErrorResponse("This request has already been reviewed", 400);
  }

  let createdPunchId = null;
  let revertPunch = null;

  try {
    if (request.kind === "missing") {
      const punch = await TimePunch.create({
        employee: request.employee,
        type: request.punchType,
        at: request.requestedAt,
        source: "correction",
        correctionRequestId: request._id,
      });
      createdPunchId = punch._id;
    } else {
      const punch = await TimePunch.findById(request.existingPunchId);
      if (!punch) {
        throw new ErrorResponse("Original punch no longer exists", 400);
      }
      if (String(punch.employee) !== String(request.employee)) {
        throw new ErrorResponse("Punch employee mismatch", 400);
      }
      revertPunch = {
        id: punch._id,
        at: punch.at,
        source: punch.source,
        correctionRequestId: punch.correctionRequestId,
      };
      punch.at = request.requestedAt;
      punch.source = "correction";
      punch.correctionRequestId = request._id;
      await punch.save();
    }

    request.status = "approved";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.reviewNote = typeof req.body?.reviewNote === "string" ? req.body.reviewNote : null;
    await request.save();

    res.status(200).json({
      status: "success",
      message: "Request approved",
      data: request,
    });
  } catch (err) {
    if (createdPunchId) {
      await TimePunch.deleteOne({ _id: createdPunchId });
    }
    if (revertPunch) {
      await TimePunch.updateOne(
        { _id: revertPunch.id },
        {
          at: revertPunch.at,
          source: revertPunch.source,
          correctionRequestId: revertPunch.correctionRequestId,
        },
      );
    }
    throw err;
  }
});

export const rejectTimeCorrectionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const request = await TimeCorrectionRequest.findById(id);
  if (!request) {
    throw new ErrorResponse("Request not found", 404);
  }
  if (request.status !== "pending") {
    throw new ErrorResponse("This request has already been reviewed", 400);
  }

  request.status = "rejected";
  request.reviewedBy = req.user.id;
  request.reviewedAt = new Date();
  request.reviewNote = typeof req.body?.reviewNote === "string" ? req.body.reviewNote : null;
  await request.save();

  res.status(200).json({
    status: "success",
    message: "Request rejected",
    data: request,
  });
});
