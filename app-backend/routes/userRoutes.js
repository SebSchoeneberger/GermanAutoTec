import {Router} from "express";
import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    loginUser,
    changePassword,
    getCurrentUser
} from "../controllers/usersController.js";
import verifyToken from "../middleware/verifyToken.js";
import authorize from "../middleware/authorize.js";
import { loginLimiter } from '../middleware/rateLimiter.js';

const userRouter = Router();

userRouter.post("/login", loginLimiter, loginUser);

// Protected routes (authentication needed)
userRouter.use(verifyToken);

// Routes for all authenticated users
userRouter.get("/me", getCurrentUser);
userRouter.put("/change-password", changePassword);

// Admin (manager) only routes
userRouter.post("/", authorize(["admin"]), createUser);
userRouter.get("/", authorize(["admin", "manager"]), getAllUsers);
userRouter.get("/:id", authorize(["admin", "manager"]), getUserById);
userRouter.put("/:id", authorize(["admin"]), updateUser);
userRouter.delete("/:id", authorize(["admin"]), deleteUser);

export default userRouter; 