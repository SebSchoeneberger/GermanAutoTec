import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/errorResponse.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const createUser = asyncHandler(async (req, res) => {

    if (req.user.role !== "admin") {
        throw new ErrorResponse("Unauthorized, only admins can create users", 401);
    }

    const {firstName, lastName, email, password, role} = req.body;

    if (role === 'admin') {
        throw new ErrorResponse("Cannot create additional admin users", 400);
    }

    const foundUser = await User.findOne({email});
    if (foundUser) {
        throw new ErrorResponse("User already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({firstName, lastName, email, password: hashedPassword, role});

    const userResponse = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
    };

    res.status(201).json({
        status: "success",
        message: "User created successfully",
        data: userResponse,
    });
});



export const getAllUsers = asyncHandler(async (req, res) => {

    if (req.user.role !== "admin") {
        throw new ErrorResponse("Not authorized to access this route", 403);
    }

    const users = await User.find();
    res.status(200).json({
        status: "success",
        message: "Users fetched successfully",
        data: users,
    });
});



export const getUserById = asyncHandler(async (req, res) => {
    
    if (req.user.role !== "admin") {
        throw new ErrorResponse("Not authorized to access this route", 403);
    }

    const {id} = req.params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
        throw new ErrorResponse("User not found", 404);
    }

    res.status(200).json({
        status: "success",
        message: "User fetched successfully",
        data: user,
    });
});



export const updateUser = asyncHandler(async (req, res) => {

    if (req.user.role !== "admin") {
        throw new ErrorResponse("Unauthorized, only admins can update users", 401);
    }

    const {id} = req.params;
    const {firstName, lastName, email, role} = req.body;

    if (role === 'admin') {
        throw new ErrorResponse("Cannot change user role to admin", 400);
    }

    const foundUser = await User.findById(id);
    if (!foundUser) {
        throw new ErrorResponse("User not found", 404);
    }

    if (email && email !== foundUser.email) {
        const emailTaken = await User.findOne({email});
        if (emailTaken) {
            throw new ErrorResponse("Email already in use", 400);
        }
    }

    const updatedUser = await User.findByIdAndUpdate(id, {firstName, lastName, email, role}, {new: true, runValidators: true}).select('-password');

    res.status(200).json({
        status: "success",
        message: "User updated successfully",
        data: updatedUser,
    });
});



export const deleteUser = asyncHandler(async (req, res) => {
    
    if (req.user.role !== "admin") {
        throw new ErrorResponse("Unauthorized, only admins can delete users", 401);
    }

    const {id} = req.params;

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
        throw new ErrorResponse("User not found", 404);
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
        status: "success",
        message: "User deleted successfully",
    });
});



export const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body;

    const foundUser = await User.findOne({email});
    if (!foundUser) {
        throw new ErrorResponse("Invalid email or password", 401);
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
        throw new ErrorResponse("Invalid email or password", 401);
    }

    const payload = {
        id: foundUser._id,
        name: foundUser.firstName + " " + foundUser.lastName,
        role: foundUser.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "1h"});

    res.status(200).json({
        status: "success",
        message: "User logged in successfully",
        token,
        user: payload,
    });
});



export const changePassword = asyncHandler(async (req, res) => {
    const {currentPassword, newPassword} = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
        throw new ErrorResponse("User not found", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new ErrorResponse("Current password is incorrect", 401);
    }

    if (newPassword.length < 6) {
        throw new ErrorResponse("Password must be at least 6 characters", 400);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
        status: "success",
        message: "Password changed successfully"
    });
});


export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
        throw new ErrorResponse("User not found", 404);
    }

    res.status(200).json({
        status: "success",
        message: "Current user fetched successfully",
        data: user
    });
});

