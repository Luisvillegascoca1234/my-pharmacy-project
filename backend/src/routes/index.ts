import { Router } from "express";
import { healthRoutes } from "../modules/health/health.routes.js";

export const apiRoutes = Router();

apiRoutes.use("/health", healthRoutes);
