import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import {
  downloadInventoryMovementsCsv,
  downloadSalesCsv
} from "./exports.controller.js";

export const canDownloadExports = requireRole(["superadmin", "admin"]);

export const exportsRoutes = Router();

exportsRoutes.use(authenticateRequest);
exportsRoutes.get("/sales.csv", canDownloadExports, downloadSalesCsv);
exportsRoutes.get("/inventory-movements.csv", canDownloadExports, downloadInventoryMovementsCsv);
