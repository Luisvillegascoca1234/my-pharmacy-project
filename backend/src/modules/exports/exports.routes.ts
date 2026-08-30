import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import {
  downloadInventoryMovementsCsv,
  downloadSalesCsv,
  downloadStockPlanningPredictionsParquet,
  downloadStockPlanningTimeSeriesParquet
} from "./exports.controller.js";

export const canDownloadExports = requireRole("exports");

export const exportsRoutes = Router();

exportsRoutes.use(authenticateRequest);
exportsRoutes.get("/sales.csv", canDownloadExports, downloadSalesCsv);
exportsRoutes.get("/inventory-movements.csv", canDownloadExports, downloadInventoryMovementsCsv);
exportsRoutes.get(
  "/stock-planning/time-series.parquet",
  canDownloadExports,
  downloadStockPlanningTimeSeriesParquet
);
exportsRoutes.get(
  "/stock-planning/predictions.parquet",
  canDownloadExports,
  downloadStockPlanningPredictionsParquet
);
