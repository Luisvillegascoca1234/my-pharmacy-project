import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { createAdjustment, getFefoPreview, listMovements, listProductBatches, listStock } from "./inventory.controller.js";

const canReadInventory = requireRole("batches");
const canReadInventoryMovements = requireRole("movements");
const canAdjustInventory = requireRole("adjustments");

export const inventoryRoutes = Router();

inventoryRoutes.use(authenticateRequest);
inventoryRoutes.get("/stock", canReadInventory, listStock);
inventoryRoutes.get("/movements", canReadInventoryMovements, listMovements);
inventoryRoutes.post("/adjustments", canAdjustInventory, createAdjustment);
inventoryRoutes.get("/products/:productId/batches", canReadInventory, listProductBatches);
inventoryRoutes.get("/products/:productId/fefo-preview", canReadInventory, getFefoPreview);
