import PointRequest from "../models/PointRequest.js";
import Points from "../models/Points.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/errorResponse.js";
import { getCurrentEthiopianDate, getEthiopianMonthName } from '../utils/ethiopianDate.js';

// Create point request (for employees)
export const createPointRequest = asyncHandler(async (req, res) => {
    const { requestedPoints, reason } = req.body;
    
    // Validate points
    if (requestedPoints <= 0) {
        throw new ErrorResponse("Requested points must be greater than 0", 400);
    }

    // Check if employee has pending request
    const { month, year } = getCurrentEthiopianDate();


    const pointRequest = await PointRequest.create({
        employee: req.user.id,
        requestedPoints,
        reason,
        month,
        monthName: getEthiopianMonthName(month),
        year
    });

    res.status(201).json({
        status: "success",
        message: "Point request created successfully",
        data: pointRequest
    });
});

// Get my requests (for employees)
export const getMyRequests = asyncHandler(async (req, res) => {
    const requests = await PointRequest.find({ employee: req.user.id })
        .sort('-createdAt')
        .populate('reviewedBy', 'firstName lastName');

    res.status(200).json({
        status: "success",
        data: requests
    });
});

// Get all requests (for admin/manager)
export const getAllRequests = asyncHandler(async (req, res) => {
    const { status, month, year } = req.query;
    
    let query = {};
    
    // Filter by status if provided
    if (status) {
        query.status = status;
    }

    // Filter by month/year if provided
    if (month && year) {
        query.month = month;
        query.year = year;
    }

    const requests = await PointRequest.find(query)
        .sort('-createdAt')
        .populate('employee', 'firstName lastName role')
        .populate('reviewedBy', 'firstName lastName');

    res.status(200).json({
        status: "success",
        data: requests
    });
});

// Review request (approve/reject) (for admin/manager)
export const reviewRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { status, reviewNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        throw new ErrorResponse("Invalid status", 400);
    }

    const pointRequest = await PointRequest.findById(requestId);
    if (!pointRequest) {
        throw new ErrorResponse("Request not found", 404);
    }

    if (pointRequest.status !== 'pending') {
        throw new ErrorResponse("This request has already been reviewed", 400);
    }

    pointRequest.status = status;
    pointRequest.reviewedBy = req.user.id;
    pointRequest.reviewNote = reviewNote;

    // If approved, add points
    if (status === 'approved') {
        const { month, year } = getCurrentEthiopianDate();
        let pointsRecord = await Points.findOne({
            employee: pointRequest.employee,
            month,
            year
        });

        if (!pointsRecord) {
            pointsRecord = new Points({
                employee: pointRequest.employee,
                month,
                monthName: getEthiopianMonthName(month),
                year,
                points: 0,
                updatedBy: req.user.id
            });
        }

        pointsRecord.points += pointRequest.requestedPoints;
        pointsRecord.currentTotal = pointsRecord.points;
        pointsRecord.lastUpdated = new Date();
        pointsRecord.updatedBy = req.user.id;

        await pointsRecord.save();
    }

    await pointRequest.save();

    res.status(200).json({
        status: "success",
        message: `Request ${status}`,
        data: pointRequest
    });
}); 