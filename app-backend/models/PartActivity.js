import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const partActivitySchema = new Schema({
    part:             { type: Schema.Types.ObjectId, ref: 'SpareParts' },
    partName:         { type: String, required: true },
    action:           { type: String, enum: ['created', 'sold', 'restocked', 'edited', 'deleted'], required: true },
    quantityChanged:  { type: Number },
    performedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
    performedByName:  { type: String },
    createdAt:        { type: Date, default: Date.now },
});

const PartActivity = model('PartActivity', partActivitySchema);

export default PartActivity;
