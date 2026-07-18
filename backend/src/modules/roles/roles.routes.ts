import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { listRoles } from "./roles.controller.js";

export const rolesRoutes = Router();
export const canReadRolesCatalog = requireRole("roles");

rolesRoutes.use(authenticateRequest);
rolesRoutes.get("/", canReadRolesCatalog, listRoles);
