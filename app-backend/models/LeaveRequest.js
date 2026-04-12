import mongoose from "mongoose";

const { Schema, model } = mongoose;

const leaveRequestSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"],
    },
    type: { type: String, enum: ["sick", "day_off"], required: true },
    note: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewNote: { type: String, trim: true, maxlength: 500, default: "" },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

// One pending request per employee per date
leaveRequestSchema.index(
  { employee: 1, date: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

const LeaveRequest = model("LeaveRequest", leaveRequestSchema);

export default LeaveRequest;
