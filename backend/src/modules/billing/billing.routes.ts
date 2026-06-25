import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import {
  cancelPreparedInvoice,
  getPreparedInvoiceById,
  listInvoiceableSales,
  listPreparedInvoices,
  prepareInvoiceFromSale
} from "./billing.controller.js";

export const canUseBilling = requireRole(["superadmin", "admin"]);

export const billingRoutes = Router();

billingRoutes.use(authenticateRequest);
billingRoutes.get("/invoiceable-sales", canUseBilling, listInvoiceableSales);
billingRoutes.get("/prepared-invoices", canUseBilling, listPreparedInvoices);
billingRoutes.post("/prepared-invoices", canUseBilling, prepareInvoiceFromSale);
billingRoutes.get("/prepared-invoices/:id", canUseBilling, getPreparedInvoiceById);
billingRoutes.post("/prepared-invoices/:id/cancel", canUseBilling, cancelPreparedInvoice);
