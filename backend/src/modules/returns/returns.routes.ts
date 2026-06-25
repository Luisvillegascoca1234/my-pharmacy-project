import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import {
  createTotalSaleReturn,
  getSaleReturnById,
  listReturnableSales,
  listSaleReturns
} from "./returns.controller.js";

export const canUseReturns = requireRole(["superadmin", "admin"]);

export const returnsRoutes = Router();

returnsRoutes.use(authenticateRequest);
returnsRoutes.get("/returnable-sales", canUseReturns, listReturnableSales);
returnsRoutes.get("/sale-returns", canUseReturns, listSaleReturns);
returnsRoutes.post("/sale-returns", canUseReturns, createTotalSaleReturn);
returnsRoutes.get("/sale-returns/:id", canUseReturns, getSaleReturnById);
