import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import {
  cancelPurchase,
  createPurchase,
  getPurchase,
  listPurchases,
  receivePurchase,
  updatePurchase
} from "./purchases.controller.js";

const canManagePurchases = requireRole(["superadmin", "admin"]);

export const purchasesRoutes = Router();

purchasesRoutes.use(authenticateRequest);
purchasesRoutes.get("/", canManagePurchases, listPurchases);
purchasesRoutes.get("/:id", canManagePurchases, getPurchase);
purchasesRoutes.post("/", canManagePurchases, createPurchase);
purchasesRoutes.patch("/:id", canManagePurchases, updatePurchase);
purchasesRoutes.post("/:id/receive", canManagePurchases, receivePurchase);
purchasesRoutes.post("/:id/cancel", canManagePurchases, cancelPurchase);
