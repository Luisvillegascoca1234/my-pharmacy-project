import type { AuthenticatedUser } from "@pharmacy-pos/shared";

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: AuthenticatedUser;
    }
  }
}

export {};
