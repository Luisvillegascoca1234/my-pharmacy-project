import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { login, logout, me } from "./auth.controller.js";

export const authRoutes = Router();
const canUseAuthenticatedSession = requireRole("authenticatedSession");

authRoutes.post("/login", login);
authRoutes.post("/logout", authenticateRequest, canUseAuthenticatedSession, logout);
authRoutes.get("/me", authenticateRequest, canUseAuthenticatedSession, me);
