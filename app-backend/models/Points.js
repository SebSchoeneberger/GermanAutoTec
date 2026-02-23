import mongoose from "mongoose";
const { Schema, model } = mongoose;

const pointsSchema = new Schema({
    employee: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    points: {
        type: Number,
        default: 0,
        required: true
    },
    month: {
        type: Number,  // 1-13 (Ethiopian calendar months)
        required: true
    },
    monthName: {
        type: String,
        required: true
    },
    year: {
        type: Number,  // Ethiopian year
        required: true
    },
    currentTotal: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const Points = model("Points", pointsSchema);
export default Points; 