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
    ownerType: {type: String, enum: ['Company', 'Employee', 'Customer', 'External'], default: 'Company'},
    ownerName: {type: String, required: false, trim: true},
    compatibleEngines:       [{ type: String, trim: true }],
    compatibleTransmissions: [{ type: String, trim: true }],
    // Cloudinary-hosted image — URL for display, publicId for deletion
    imageUrl:       { type: String, default: null },
    imagePublicId:  { type: String, default: null },
});

const SpareParts = model("SpareParts", sparePartsSchema);

export default SpareParts;