import mongoose from "mongoose";
import { getCurrentEthiopianDate, getEthiopianMonthName } from '../utils/ethiopianDate.js';

const { Schema, model } = mongoose;

const pointRequestSchema = new Schema({
    employee: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requestedPoints: {
        type: Number,
        required: true,
        min: [1, 'Points must be at least 1']
    },
    reason: {
        type: String,
        required: true,
        trim: true,
        minlength: [10, 'Reason must be at least 10 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    month: {
        type: Number,
        required: true
    },
    monthName: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewNote: {
        type: String,
        trim: true,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to set Ethiopian date
pointRequestSchema.pre('save', function(next) {
    if (this.isNew) {
        const { month, year } = getCurrentEthiopianDate();
        this.month = month;
        this.monthName = getEthiopianMonthName(month);
        this.year = year;
    }
    next();
});

const PointRequest = model("PointRequest", pointRequestSchema);
export default PointRequest; 