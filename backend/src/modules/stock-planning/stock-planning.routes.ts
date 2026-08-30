import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import {
  getStockPlanningConfiguration,
  getStockPlanningEngineState,
  getStockPlanningProductDetail,
  listStockPlanningExecutions,
  listStockPlanningProducts,
  runManualStockPlanningExecution,
  updateStockPlanningConfiguration,
  updateProductStockConfiguration
} from "./stock-planning.controller.js";

export const canAccessStockPlanning = requireRole("stockPlanning");
export const canGovernStockPlanning = requireRole("stockPlanningGovernance");

export const stockPlanningRoutes = Router();

stockPlanningRoutes.use(authenticateRequest);
stockPlanningRoutes.get("/configuration", canAccessStockPlanning, getStockPlanningConfiguration);
stockPlanningRoutes.put("/configuration", canGovernStockPlanning, updateStockPlanningConfiguration);
stockPlanningRoutes.get("/engine-state", canAccessStockPlanning, getStockPlanningEngineState);
stockPlanningRoutes.get("/executions", canAccessStockPlanning, listStockPlanningExecutions);
stockPlanningRoutes.post("/executions/manual", canGovernStockPlanning, runManualStockPlanningExecution);
stockPlanningRoutes.get("/products", canAccessStockPlanning, listStockPlanningProducts);
stockPlanningRoutes.get("/products/:productId/detail", canAccessStockPlanning, getStockPlanningProductDetail);
stockPlanningRoutes.patch(
  "/products/:productId/configuration",
  canAccessStockPlanning,
  updateProductStockConfiguration
);
