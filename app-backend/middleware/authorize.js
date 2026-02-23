import ErrorResponse from "../utils/errorResponse.js";

const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new ErrorResponse("User not authenticated", 401);
        }

        if (!roles.includes(req.user.role)) {
            throw new ErrorResponse(
                `Role ${req.user.role} is not authorized to access this route`, 
                403
            );
        }
        next();
    }
}

export default authorize;

