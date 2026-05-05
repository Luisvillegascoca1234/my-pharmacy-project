import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { AuthSessionSchema, type AuthSession, type LoginRequest } from "@pharmacy-pos/shared";
import { env } from "../../config/env.js";
import { HttpError } from "../../common/http/http-error.js";
import { AuthRepository, toAuthenticatedUser } from "./auth.repository.js";
import type { AuditLoginContext, AuthTokenPayload } from "./auth.types.js";

export class AuthService {
  constructor(private readonly authRepository = new AuthRepository()) {}

  async login(credentials: LoginRequest, context: AuditLoginContext): Promise<AuthSession> {
    const email = credentials.email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      await this.auditFailure(email, "USER_NOT_FOUND", context);
      throw new HttpError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

    if (!isPasswordValid) {
      await this.auditFailure(email, "INVALID_PASSWORD", context, user.id);
      throw new HttpError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
    }

    if (user.status !== "active") {
      await this.auditFailure(email, "USER_INACTIVE", context, user.id);
      throw new HttpError(403, "User account is inactive.", "USER_INACTIVE");
    }

    await this.authRepository.updateLastLoginAt(user.id);
    await this.authRepository.createAuthAuditLog({
      action: "AUTH_LOGIN_SUCCESS",
      actorUserId: user.id,
      email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    const authenticatedUser = toAuthenticatedUser(user);
    const token = this.signToken({
      sub: authenticatedUser.id,
      email: authenticatedUser.email
    });

    return AuthSessionSchema.parse({
      token,
      user: authenticatedUser
    });
  }

  async getAuthenticatedUser(userId: string) {
    const user = await this.authRepository.findActiveUserById(userId);

    if (!user) {
      throw new HttpError(401, "Authentication is required.", "AUTHENTICATION_REQUIRED");
    }

    return toAuthenticatedUser(user);
  }

  async logout(userId: string | undefined, context: AuditLoginContext) {
    if (userId) {
      await this.authRepository.createAuthAuditLog({
        action: "AUTH_LOGOUT",
        actorUserId: userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });
    }
  }

  verifyToken(token: string): AuthTokenPayload {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);

      if (!isAuthTokenPayload(payload)) {
        throw new Error("Invalid token payload");
      }

      return payload;
    } catch {
      throw new HttpError(401, "Authentication is required.", "AUTHENTICATION_REQUIRED");
    }
  }

  private signToken(payload: AuthTokenPayload) {
    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
    };

    return jwt.sign(payload, env.JWT_SECRET, options);
  }

  private auditFailure(email: string, reason: string, context: AuditLoginContext, actorUserId?: string) {
    return this.authRepository.createAuthAuditLog({
      action: "AUTH_LOGIN_FAILURE",
      actorUserId,
      email,
      reason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
  }
}

function isAuthTokenPayload(payload: unknown): payload is AuthTokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "sub" in payload &&
    "email" in payload &&
    typeof payload.sub === "string" &&
    typeof payload.email === "string"
  );
}
