import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import {
  createCategory,
  createProduct,
  getProduct,
  listCategories,
  listProducts,
  updateProduct,
  updateProductUnits
} from "./products.controller.js";

const canReadCatalogs = requireRole(["superadmin", "admin", "seller"]);
const canManageCatalogs = requireRole(["superadmin", "admin"]);

export const productCategoriesRoutes = Router();
export const productsRoutes = Router();

productCategoriesRoutes.use(authenticateRequest);
productCategoriesRoutes.get("/", canReadCatalogs, listCategories);
productCategoriesRoutes.post("/", canManageCatalogs, createCategory);

productsRoutes.use(authenticateRequest);
productsRoutes.get("/", canReadCatalogs, listProducts);
productsRoutes.get("/:id", canReadCatalogs, getProduct);
productsRoutes.post("/", canManageCatalogs, createProduct);
productsRoutes.patch("/:id", canManageCatalogs, updateProduct);
productsRoutes.put("/:id/units", canManageCatalogs, updateProductUnits);
