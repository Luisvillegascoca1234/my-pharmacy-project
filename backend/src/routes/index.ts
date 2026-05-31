import { Router } from "express";
import { alertsRoutes } from "../modules/alerts/alerts.routes.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { healthRoutes } from "../modules/health/health.routes.js";
import { inventoryRoutes } from "../modules/inventory/inventory.routes.js";
import { productCategoriesRoutes, productsRoutes } from "../modules/products/products.routes.js";
import { purchasesRoutes } from "../modules/purchases/purchases.routes.js";
import { rolesRoutes } from "../modules/roles/roles.routes.js";
import { suppliersRoutes } from "../modules/suppliers/suppliers.routes.js";
import { unitsRoutes } from "../modules/units/units.routes.js";
import { usersRoutes } from "../modules/users/users.routes.js";

export const apiRoutes = Router();

apiRoutes.use("/alerts", alertsRoutes);
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/health", healthRoutes);
apiRoutes.use("/inventory", inventoryRoutes);
apiRoutes.use("/product-categories", productCategoriesRoutes);
apiRoutes.use("/products", productsRoutes);
apiRoutes.use("/purchases", purchasesRoutes);
apiRoutes.use("/roles", rolesRoutes);
apiRoutes.use("/suppliers", suppliersRoutes);
apiRoutes.use("/units", unitsRoutes);
apiRoutes.use("/users", usersRoutes);
