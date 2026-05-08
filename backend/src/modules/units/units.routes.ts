import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { createUnit, listUnits } from "./units.controller.js";

const canReadCatalogs = requireRole(["superadmin", "admin", "seller"]);
const canManageCatalogs = requireRole(["superadmin", "admin"]);

export const unitsRoutes = Router();

unitsRoutes.use(authenticateRequest);
unitsRoutes.get("/", canReadCatalogs, listUnits);
unitsRoutes.post("/", canManageCatalogs, createUnit);
