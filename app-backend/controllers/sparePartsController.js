import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import SpareParts from '../models/SpareParts.js';

// Get all parts (with simple search and pagination)
export const getAllParts = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || '';

    // Simple search query
    const query = search
        ? { name: { $regex: search, $options: 'i' } }
        : {};

    const parts = await SpareParts.find(query)
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await SpareParts.countDocuments(query);

    res.status(200).json({
        success: true,
        total,
        data: parts
    });
});

// Get single part
export const getPartById = asyncHandler(async (req, res) => {
    const part = await SpareParts.findById(req.params.id);
    
    if (!part) {
        throw new ErrorResponse('Part not found', 404);
    }

    res.status(200).json({
        success: true,
        data: part
    });
});

// Create new part
export const createPart = asyncHandler(async (req, res) => {
    const part = await SpareParts.create(req.body);
    res.status(201).json({
        success: true,
        data: part
    });
});

// Update part
export const updatePart = asyncHandler(async (req, res) => {
    const part = await SpareParts.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    if (!part) {
        throw new ErrorResponse('Part not found', 404);
    }

    res.status(200).json({
        success: true,
        data: part
    });
});

// Delete part
export const deletePart = asyncHandler(async (req, res) => {
    const part = await SpareParts.findByIdAndDelete(req.params.id);

    if (!part) {
        throw new ErrorResponse('Part not found', 404);
    }

    res.status(200).json({
        success: true,
        data: {}
    });
}); 