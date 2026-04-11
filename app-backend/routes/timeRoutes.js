import { Router } from "express";
import {
  getTimeDisplay,
  postTimePunch,
  getMyTimeStatus,
  getAtWorkEmployees,
  getEmployeeTodayDetail,
  getEmployeeSummary,
  getEmployeeProfile,
  getMyTodayDetail,
  getMyTimeSummary,
  getTeamOverview,
  createAdminPunch,
  deleteAdminPunch,
  DISPLAY_ROLES,
  PUNCH_ROLES,
  TIME_ADMIN_ROLES,
} from "../controllers/timeController.js";
import {
  getCorrectionDateWindow,
  getMyDayPunches,
  createTimeCorrectionRequest,
  getMyTimeCorrectionRequests,
  getPendingTimeCorrectionRequests,
  approveTimeCorrectionRequest,
  rejectTimeCorrectionRequest,
} from "../controllers/timeCorrectionController.js";
import verifyToken from "../middleware/verifyToken.js";
import authorize from "../middleware/authorize.js";
import { timePunchLimiter, timeCorrectionCreateLimiter } from "../middleware/rateLimiter.js";

const timeRouter = Router();

timeRouter.use(verifyToken);

/** Workshop tablet + admin/manager: full-screen QR */
timeRouter.get("/display", authorize(DISPLAY_ROLES), getTimeDisplay);

/** Employee phones: scan flow */
timeRouter.post("/punch", timePunchLimiter, authorize(PUNCH_ROLES), postTimePunch);

timeRouter.get("/me/status", authorize(PUNCH_ROLES), getMyTimeStatus);
timeRouter.get("/me/today", authorize(PUNCH_ROLES), getMyTodayDetail);
timeRouter.get("/me/summary", authorize(PUNCH_ROLES), getMyTimeSummary);
timeRouter.get("/me/day", authorize(PUNCH_ROLES), getMyDayPunches);

timeRouter.get("/corrections/window", authorize(PUNCH_ROLES), getCorrectionDateWindow);
timeRouter.post(
  "/corrections",
  timeCorrectionCreateLimiter,
  authorize(PUNCH_ROLES),
  createTimeCorrectionRequest,
);
timeRouter.get("/corrections/mine", authorize(PUNCH_ROLES), getMyTimeCorrectionRequests);
timeRouter.get("/corrections/pending", authorize(TIME_ADMIN_ROLES), getPendingTimeCorrectionRequests);
timeRouter.patch("/corrections/:id/approve", authorize(TIME_ADMIN_ROLES), approveTimeCorrectionRequest);
timeRouter.patch("/corrections/:id/reject", authorize(TIME_ADMIN_ROLES), rejectTimeCorrectionRequest);

/** Manager/admin panel routes */
timeRouter.get("/at-work", authorize(TIME_ADMIN_ROLES), getAtWorkEmployees);
timeRouter.get("/team/overview", authorize(TIME_ADMIN_ROLES), getTeamOverview);
timeRouter.get("/employees/:employeeId/today", authorize(TIME_ADMIN_ROLES), getEmployeeTodayDetail);
timeRouter.get("/employees/:employeeId/summary", authorize(TIME_ADMIN_ROLES), getEmployeeSummary);
timeRouter.get("/employees/:employeeId/profile", authorize(TIME_ADMIN_ROLES), getEmployeeProfile);

/** Admin punch management */
timeRouter.post("/admin/punches", authorize(TIME_ADMIN_ROLES), createAdminPunch);
timeRouter.delete("/admin/punches/:id", authorize(TIME_ADMIN_ROLES), deleteAdminPunch);

export default timeRouter;
