import mongoose from "mongoose";

const {Schema, model} = mongoose;

const sparePartsSchema = new Schema({
    name: {type: String, required: true, trim: true},
    partNumber: {type: String, required: true, trim: true},
    quantity: {type: Number, required: true},
    description: {type: String, required: false, trim: true},
    price: {type: Number, required: false},
    brand: {type: String, required: false, trim: true},
    category: {type: String, required: false, enum: ['Engine', 'Transmission', 'Brake', 'Suspension', 'Electrical','Body', 'Interior', 'Other'], trim: true},
});

const SpareParts = model("SpareParts", sparePartsSchema);

export default SpareParts;