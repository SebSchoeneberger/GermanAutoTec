import { getCurrentEthiopianDate, getEthiopianMonthName } from '../utils/ethiopianDate.js';
import Points from '../models/Points.js';
import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const addPoints = asyncHandler(async (req, res) => {
    const { employeeId, points } = req.body;
    
    const employee = await User.findById(employeeId);
    if (!employee) {
        throw new ErrorResponse("Employee not found", 404);
    }
    
    if (!['mechanic', 'accountant', 'receptionist'].includes(employee.role)) {
        throw new ErrorResponse("Points can only be added to employees", 400);
    }

    const { month, year } = getCurrentEthiopianDate();
    const monthName = getEthiopianMonthName(month);

    let pointsRecord = await Points.findOne({
        employee: employeeId,
        month,
        year
    });

    if (!pointsRecord) {
        pointsRecord = new Points({
            employee: employeeId,
            month,
            monthName,
            year,
            points: 0,
            updatedBy: req.user.id
        });
    }

    pointsRecord.points += points;
    pointsRecord.currentTotal = pointsRecord.points;
    pointsRecord.lastUpdated = new Date();
    pointsRecord.updatedBy = req.user.id;

    await pointsRecord.save();

    res.status(200).json({
        status: "success",
        message: "Points added successfully",
        data: {
            ...pointsRecord.toObject(),
            ethiopianDate: `${monthName} ${year} (Ethiopian Calendar)`
        }
    });
});

// Get points for all employees (admin/manager only)
export const getAllEmployeePoints = asyncHandler(async (req, res) => {
    const { month, year } = getCurrentEthiopianDate();
    
    const points = await Points.find({ month, year })
        .populate('employee', 'firstName lastName email role')
        .populate('updatedBy', 'firstName lastName');

    res.status(200).json({
        status: "success",
        data: points
    });
});

// Get points for specific employee
export const getEmployeePoints = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { month, year } = getCurrentEthiopianDate();

    const points = await Points.findOne({ 
        employee: employeeId,
        month,
        year
    })
    .populate('employee', 'firstName lastName email role')
    .populate('updatedBy', 'firstName lastName');

    if (!points) {
        return res.status(200).json({
            status: "success",
            data: {
                points: 0,
                month,
                monthName: getEthiopianMonthName(month),
                year
            }
        });
    }

    res.status(200).json({
        status: "success",
        data: points
    });
});

// Deduct points
export const deductPoints = asyncHandler(async (req, res) => {
    const { employeeId, points: pointsToDeduct, reason } = req.body;
    
    const employee = await User.findById(employeeId);
    if (!employee) {
        throw new ErrorResponse("Employee not found", 404);
    }

    const { month, year } = getCurrentEthiopianDate();
    const monthName = getEthiopianMonthName(month);

    let pointsRecord = await Points.findOne({
        employee: employeeId,
        month,
        year
    });

    if (!pointsRecord || pointsRecord.points < pointsToDeduct) {
        throw new ErrorResponse("Insufficient points to deduct", 400);
    }

    pointsRecord.points -= pointsToDeduct;
    pointsRecord.currentTotal = pointsRecord.points;
    pointsRecord.lastUpdated = new Date();
    pointsRecord.updatedBy = req.user.id;

    await pointsRecord.save();

    res.status(200).json({
        status: "success",
        message: "Points deducted successfully",
        data: pointsRecord
    });
});

// Get monthly leaderboard
export const getLeaderboard = asyncHandler(async (req, res) => {
    const { month, year } = getCurrentEthiopianDate();

    const leaderboard = await Points.find({ month, year })
        .sort('-points')
        .populate('employee', 'firstName lastName role')
        .select('employee points monthName year');

    res.status(200).json({
        status: "success",
        data: leaderboard
    });
}); 