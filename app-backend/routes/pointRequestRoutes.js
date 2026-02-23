import { Router } from "express";
import {
    createPointRequest,
    getMyRequests,
    getAllRequests,
    reviewRequest
} from "../controllers/pointRequestController.js";
import verifyToken from "../middleware/verifyToken.js";
import authorize from "../middleware/authorize.js";

const pointRequestRouter = Router();

// Protect all routes
pointRequestRouter.use(verifyToken);

// Employee routes
pointRequestRouter.post("/", 
    authorize(["mechanic", "accountant", "receptionist"]), 
    createPointRequest
);

pointRequestRouter.get("/my-requests", 
    authorize(["mechanic", "accountant", "receptionist"]), 
    getMyRequests
);

// Admin/Manager routes
pointRequestRouter.get("/all", 
    authorize(["admin", "manager"]), 
    getAllRequests
);

pointRequestRouter.put("/:requestId/review", 
    authorize(["admin", "manager"]), 
    reviewRequest
);

export default pointRequestRouter; 