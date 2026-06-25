import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import {
  getDailySalesReport,
  getExpiringProductsReport,
  getInventoryValuationReport
} from "./reports.controller.js";

export const canReadReports = requireRole(["superadmin", "admin"]);

export const reportsRoutes = Router();

reportsRoutes.use(authenticateRequest);
reportsRoutes.get("/daily-sales", canReadReports, getDailySalesReport);
reportsRoutes.get("/inventory-valuation", canReadReports, getInventoryValuationReport);
reportsRoutes.get("/expiring-products", canReadReports, getExpiringProductsReport);
