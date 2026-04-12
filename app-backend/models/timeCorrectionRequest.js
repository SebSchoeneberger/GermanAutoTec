import mongoose from "mongoose";

const { Schema, model } = mongoose;

const timeCorrectionRequestSchema = new Schema({
  employee: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  kind: {
    type: String,
    enum: ["missing", "wrong_time"],
    required: true,
  },
  /** Addis calendar date YYYY-MM-DD (what the employee picked). */
  workDate: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, "workDate must be YYYY-MM-DD"],
  },
  punchType: {
    type: String,
    enum: ["in", "out"],
    required: true,
  },
  /** Corrected instant in UTC (from Addis date + time). */
  requestedAt: {
    type: Date,
    required: true,
  },
  existingPunchId: {
    type: Schema.Types.ObjectId,
    ref: "TimePunch",
    default: null,
  },
  /** For wrong_time: original `at` when the request was submitted. */
  previousAt: {
    type: Date,
    default: null,
  },
  note: {
    type: String,
    trim: true,
    maxlength: 500,
    default: "",
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  reviewNote: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
},
{ timestamps: true });

// One pending correction per employee per (workDate + punchType), so employees can
// submit a missing check-in and a missing check-out for the same day simultaneously.
timeCorrectionRequestSchema.index(
  { employee: 1, workDate: 1, punchType: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

const TimeCorrectionRequest = model("TimeCorrectionRequest", timeCorrectionRequestSchema);

export default TimeCorrectionRequest;
