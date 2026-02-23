import { Router } from "express";
import {
    addPoints,
    getAllEmployeePoints,
    getEmployeePoints,
    deductPoints,
    getLeaderboard
} from "../controllers/pointsController.js";
import verifyToken from "../middleware/verifyToken.js";
import authorize from "../middleware/authorize.js";

const pointsRouter = Router();

// Protect all routes
pointsRouter.use(verifyToken);

// Admin/Manager routes
pointsRouter.post("/add", authorize(["admin", "manager"]), addPoints);
pointsRouter.post("/deduct", authorize(["admin", "manager"]), deductPoints);
pointsRouter.get("/all", authorize(["admin", "manager"]), getAllEmployeePoints);

// Routes accessible by all authenticated users
pointsRouter.get("/leaderboard", getLeaderboard);
pointsRouter.get("/:employeeId", getEmployeePoints);

export default pointsRouter; 