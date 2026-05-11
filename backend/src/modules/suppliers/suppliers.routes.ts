import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { createSupplier, getSupplier, listSuppliers, updateSupplier } from "./suppliers.controller.js";

const canManageSuppliers = requireRole(["superadmin", "admin"]);

export const suppliersRoutes = Router();

suppliersRoutes.use(authenticateRequest);
suppliersRoutes.get("/", canManageSuppliers, listSuppliers);
suppliersRoutes.get("/:id", canManageSuppliers, getSupplier);
suppliersRoutes.post("/", canManageSuppliers, createSupplier);
suppliersRoutes.patch("/:id", canManageSuppliers, updateSupplier);
