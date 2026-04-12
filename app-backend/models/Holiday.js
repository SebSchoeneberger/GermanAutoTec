import mongoose from "mongoose";

const { Schema, model } = mongoose;

const holidaySchema = new Schema(
  {
    /** Gregorian work date in Addis TZ — same format as TimeCorrectionRequest.workDate */
    date: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const Holiday = model("Holiday", holidaySchema);

export default Holiday;
