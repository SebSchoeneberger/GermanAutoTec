import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import SpareParts from '../models/SpareParts.js';
import PartActivity from '../models/PartActivity.js';
import { uploadToCloudinary, safeDeleteFromCloudinary } from '../config/cloudinary.js';

const VALID_SORT_FIELDS = ['name', 'quantity', 'price'];

// Silently log an activity — a logging failure must never break the main operation
const logActivity = async ({ partId, partName, action, quantityChanged, req }) => {
    try {
        await PartActivity.create({
            part:            partId,
            partName,
            action,
            quantityChanged,
            performedBy:     req.user?.id,
            performedByName: req.user?.name,
        });
    } catch (err) {
        console.error('Activity log error:', err.message);
    }
};

/**
 * Arrays (compatibleEngines, compatibleTransmissions) are sent as JSON strings
 * when the request is multipart/form-data. Parse them back to arrays if needed.
 */
const parseArrayFields = (data) => {
    if (typeof data.compatibleEngines === 'string') {
        data.compatibleEngines = JSON.parse(data.compatibleEngines);
    }
    if (typeof data.compatibleTransmissions === 'string') {
        data.compatibleTransmissions = JSON.parse(data.compatibleTransmissions);
    }
};

// Get all parts (search, category filter, sort, pagination)
export const getAllParts = asyncHandler(async (req, res) => {
    const page      = Number(req.query.page)  || 1;
    const limit     = Number(req.query.limit) || 20;
    const search    = req.query.search   || '';
    const category             = req.query.category             || '';
    const compatibleEngine     = req.query.compatibleEngine     || '';
    const compatibleTransmission = req.query.compatibleTransmission || '';
    const sortBy    = VALID_SORT_FIELDS.includes(req.query.sortBy) ? req.query.sortBy : 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    const query = {};
    if (search) {
        query.$or = [
            { name:                    { $regex: search, $options: 'i' } },
            { partNumber:              { $regex: search, $options: 'i' } },
            { brand:                   { $regex: search, $options: 'i' } },
            { compatibleEngines:       { $regex: search, $options: 'i' } },
            { compatibleTransmissions: { $regex: search, $options: 'i' } },
        ];
    }
    if (category)               query.category               = category;
    if (compatibleEngine)       query.compatibleEngines       = compatibleEngine;
    if (compatibleTransmission) query.compatibleTransmissions = compatibleTransmission;

    const [parts, total] = await Promise.all([
        SpareParts.find(query).sort({ [sortBy]: sortOrder }).skip((page - 1) * limit).limit(limit),
        SpareParts.countDocuments(query),
    ]);

    res.status(200).json({ success: true, total, data: parts });
});

// Get single part
export const getPartById = asyncHandler(async (req, res) => {
    const part = await SpareParts.findById(req.params.id);
    if (!part) throw new ErrorResponse('Part not found', 404);
    res.status(200).json({ success: true, data: part });
});

// Create new part
export const createPart = asyncHandler(async (req, res) => {
    const partData = { ...req.body };
    parseArrayFields(partData);

    // Upload image to Cloudinary if one was attached
    if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer);
        partData.imageUrl      = result.secure_url;
        partData.imagePublicId = result.public_id;
    }

    const part = await SpareParts.create(partData);
    await logActivity({ partId: part._id, partName: part.name, action: 'created', req });
    res.status(201).json({ success: true, data: part });
});

// Update part (sell / restock / edit)
// Frontend passes an optional `action` field ('sold' | 'restocked' | 'edited') in the body.
// If absent, the action is inferred from the quantity delta.
export const updatePart = asyncHandler(async (req, res) => {
    const { action, removeImage, ...updateData } = req.body;
    parseArrayFields(updateData);

    const existing = await SpareParts.findById(req.params.id);
    if (!existing) throw new ErrorResponse('Part not found', 404);

    if (req.file) {
        // Replace image: delete the old one (silently) then upload the new one
        if (existing.imagePublicId) {
            await safeDeleteFromCloudinary(existing.imagePublicId);
        }
        const result = await uploadToCloudinary(req.file.buffer);
        updateData.imageUrl      = result.secure_url;
        updateData.imagePublicId = result.public_id;
    } else if (removeImage === 'true') {
        // User explicitly removed the image
        if (existing.imagePublicId) {
            await safeDeleteFromCloudinary(existing.imagePublicId);
        }
        updateData.imageUrl      = null;
        updateData.imagePublicId = null;
    }
    // Otherwise: no image change — leave existing values untouched

    const part = await SpareParts.findByIdAndUpdate(req.params.id, updateData, { new: true });

    const quantityChanged = part.quantity - existing.quantity;
    const activityAction  = action
        ?? (quantityChanged < 0 ? 'sold' : quantityChanged > 0 ? 'restocked' : 'edited');

    await logActivity({
        partId:          part._id,
        partName:        part.name,
        action:          activityAction,
        quantityChanged: quantityChanged !== 0 ? quantityChanged : undefined,
        req,
    });

    res.status(200).json({ success: true, data: part });
});

// Delete part
export const deletePart = asyncHandler(async (req, res) => {
    const part = await SpareParts.findById(req.params.id);
    if (!part) throw new ErrorResponse('Part not found', 404);

    // Clean up the Cloudinary asset before removing the document
    if (part.imagePublicId) {
        await safeDeleteFromCloudinary(part.imagePublicId);
    }

    await logActivity({ partId: part._id, partName: part.name, action: 'deleted', req });
    await SpareParts.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
});

// Get distinct engine and transmission values for filter dropdowns
export const getCompatibilityOptions = asyncHandler(async (req, res) => {
    const [engines, transmissions] = await Promise.all([
        SpareParts.distinct('compatibleEngines'),
        SpareParts.distinct('compatibleTransmissions'),
    ]);

    res.status(200).json({
        success: true,
        data: {
            engines:       engines.filter(Boolean).sort(),
            transmissions: transmissions.filter(Boolean).sort(),
        },
    });
});

// Get recent activity log (admin / manager only)
export const getPartActivity = asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 20;
    const page  = Number(req.query.page)  || 1;

    const [activities, total] = await Promise.all([
        PartActivity.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        PartActivity.countDocuments(),
    ]);

    res.status(200).json({ success: true, total, data: activities });
});
