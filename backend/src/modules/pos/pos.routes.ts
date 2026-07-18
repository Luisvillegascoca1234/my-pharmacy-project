import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { searchPosProducts } from "./pos.controller.js";

const canUsePos = requireRole("pos");

export const posRoutes = Router();

posRoutes.use(authenticateRequest);
posRoutes.get("/products", canUsePos, searchPosProducts);
