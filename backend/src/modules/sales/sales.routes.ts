import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { cancelSale, createSale, getSale, listSales } from "./sales.controller.js";

const canUseSales = requireRole(["superadmin", "admin", "seller"]);

export const salesRoutes = Router();

salesRoutes.use(authenticateRequest);
salesRoutes.get("/", canUseSales, listSales);
salesRoutes.post("/", canUseSales, createSale);
salesRoutes.get("/:id", canUseSales, getSale);
salesRoutes.post("/:id/cancel", canUseSales, cancelSale);
