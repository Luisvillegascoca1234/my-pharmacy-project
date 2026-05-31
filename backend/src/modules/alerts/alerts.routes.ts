import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { listAlerts } from "./alerts.controller.js";

export const alertsRoutes = Router();

alertsRoutes.use(authenticateRequest);
alertsRoutes.get("/", requireRole(["superadmin", "admin", "seller"]), listAlerts);
