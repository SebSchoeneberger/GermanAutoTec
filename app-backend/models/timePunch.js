import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * One check-in or check-out event. Server time at `at` is the source of truth for payroll logic.
 */
const timePunchSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["in", "out"],
    },
    at: {
      type: Date,
      required: true,
    },
    source: {
      type: String,
      enum: ["qr", "correction"],
      default: "qr",
    },
    correctionRequestId: {
      type: Schema.Types.ObjectId,
      ref: "TimeCorrectionRequest",
      default: null,
    },
  },
  { timestamps: false },
);

timePunchSchema.index({ employee: 1, at: -1 });

const TimePunch = model("TimePunch", timePunchSchema);

export default TimePunch;

