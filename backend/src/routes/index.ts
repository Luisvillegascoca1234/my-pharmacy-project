import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { healthRoutes } from "../modules/health/health.routes.js";
import { productCategoriesRoutes, productsRoutes } from "../modules/products/products.routes.js";
import { unitsRoutes } from "../modules/units/units.routes.js";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/health", healthRoutes);
apiRoutes.use("/product-categories", productCategoriesRoutes);
apiRoutes.use("/products", productsRoutes);
apiRoutes.use("/units", unitsRoutes);
