import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { closeCashSession, getCurrentCashSession, listCashSessions, openCashSession } from "./cash.controller.js";

const canUseCashSessions = requireRole(["superadmin", "admin", "seller"]);

export const cashSessionsRoutes = Router();

cashSessionsRoutes.use(authenticateRequest);
cashSessionsRoutes.get("/", canUseCashSessions, listCashSessions);
cashSessionsRoutes.post("/open", canUseCashSessions, openCashSession);
cashSessionsRoutes.get("/current", canUseCashSessions, getCurrentCashSession);
cashSessionsRoutes.post("/:id/close", canUseCashSessions, closeCashSession);
