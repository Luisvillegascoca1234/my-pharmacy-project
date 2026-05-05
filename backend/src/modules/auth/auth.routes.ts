import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { login, logout, me } from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/login", login);
authRoutes.post("/logout", authenticateRequest, logout);
authRoutes.get("/me", authenticateRequest, me);
