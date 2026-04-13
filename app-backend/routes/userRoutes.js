import {Router} from "express";
import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    loginUser,
    changePassword,
    getCurrentUser,
    adminResetPassword,
    uploadAvatar,
    updateCurrentUser,
} from "../controllers/usersController.js";
import verifyToken from "../middleware/verifyToken.js";
import authorize from "../middleware/authorize.js";
import { loginLimiter } from '../middleware/rateLimiter.js';
import { uploadImage } from '../middleware/upload.js';

const userRouter = Router();

userRouter.post("/login", loginLimiter, loginUser);

// Protected routes (authentication needed)
userRouter.use(verifyToken);

// Routes for all authenticated users
userRouter.get("/me", getCurrentUser);
userRouter.put("/me", updateCurrentUser);
userRouter.put("/change-password", changePassword);
userRouter.put("/me/avatar", uploadImage, uploadAvatar);

// Admin (manager) only routes
userRouter.post("/", authorize(["admin"]), createUser);
userRouter.get("/", authorize(["admin", "manager"]), getAllUsers);
userRouter.get("/:id", authorize(["admin", "manager"]), getUserById);
userRouter.put("/:id", authorize(["admin"]), updateUser);
userRouter.put("/:id/reset-password", authorize(["admin"]), adminResetPassword);
userRouter.delete("/:id", authorize(["admin"]), deleteUser);

export default userRouter; 