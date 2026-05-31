import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { createAdjustment, getFefoPreview, listMovements, listProductBatches, listStock } from "./inventory.controller.js";

const canReadInventory = requireRole(["superadmin", "admin", "seller"]);
const canAdjustInventory = requireRole(["superadmin", "admin"]);

export const inventoryRoutes = Router();

inventoryRoutes.use(authenticateRequest);
inventoryRoutes.get("/stock", canReadInventory, listStock);
inventoryRoutes.get("/movements", canReadInventory, listMovements);
inventoryRoutes.post("/adjustments", canAdjustInventory, createAdjustment);
inventoryRoutes.get("/products/:productId/batches", canReadInventory, listProductBatches);
inventoryRoutes.get("/products/:productId/fefo-preview", canReadInventory, getFefoPreview);
