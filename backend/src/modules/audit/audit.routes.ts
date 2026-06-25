import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { listAuditLogs } from "./audit.controller.js";

export const canReadAuditLogs = requireRole(["superadmin"]);

export const auditRoutes = Router();

auditRoutes.use(authenticateRequest);
auditRoutes.get("/logs", canReadAuditLogs, listAuditLogs);
