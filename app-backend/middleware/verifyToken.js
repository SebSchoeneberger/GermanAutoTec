import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/errorResponse.js";

const verifyToken = asyncHandler(async (req, res, next) => {

    const {authorization} = req.headers;
    if (!authorization) {
        throw new ErrorResponse("No token provided", 401);
    }

    const token = authorization.split(" ")[1];

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload) {
        throw new ErrorResponse("Invalid token", 401);
    }

    req.user = payload;
    next();
});

export default verifyToken;