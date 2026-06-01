import { Router } from "express";
import { authenticateRequest } from "../../common/middleware/authenticate-request.js";
import { requireRole } from "../../common/middleware/require-role.js";
import {
  convertPendingCart,
  createPendingCart,
  discardPendingCart,
  listPendingCarts,
  updatePendingCart
} from "./pending-carts.controller.js";

const canUsePendingCarts = requireRole(["superadmin", "admin", "seller"]);

export const pendingCartsRoutes = Router();

pendingCartsRoutes.use(authenticateRequest);
pendingCartsRoutes.get("/", canUsePendingCarts, listPendingCarts);
pendingCartsRoutes.post("/", canUsePendingCarts, createPendingCart);
pendingCartsRoutes.patch("/:id", canUsePendingCarts, updatePendingCart);
pendingCartsRoutes.post("/:id/discard", canUsePendingCarts, discardPendingCart);
pendingCartsRoutes.post("/:id/convert", canUsePendingCarts, convertPendingCart);
