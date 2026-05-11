import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { createUser, getCurrentUser, getUser, listUsers, resetUserPassword, updateUser, updateUserStatus } from "./users.controller.js";

const canManageUsers = requireRole(["superadmin"]);

export const usersRoutes = Router();

usersRoutes.use(authenticateRequest);
usersRoutes.get("/me", getCurrentUser);
usersRoutes.get("/", canManageUsers, listUsers);
usersRoutes.get("/:id", canManageUsers, getUser);
usersRoutes.post("/", canManageUsers, createUser);
usersRoutes.patch("/:id", canManageUsers, updateUser);
usersRoutes.patch("/:id/status", canManageUsers, updateUserStatus);
usersRoutes.post("/:id/reset-password", canManageUsers, resetUserPassword);
