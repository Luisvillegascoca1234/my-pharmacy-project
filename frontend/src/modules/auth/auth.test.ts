import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api";
import { authApi } from "./api/auth-api";
import { authFacade } from "./facades/authFacade";
import { useAuthStore } from "./store/AuthStore";

const adminUser = {
  email: "admin@farmacia.test",
  fullName: "Responsable de farmacia",
  id: "user-admin",
  role: {
    displayName: "Un valor no canónico",
    id: "role-admin",
    name: "admin" as const
  },
  status: "active" as const
};

describe("role-based authentication", () => {
  afterEach(() => {
    useAuthStore.getState().reset();
    vi.restoreAllMocks();
  });

  it("normalizes the login identity from the institutional role", async () => {
    vi.spyOn(authApi, "login").mockResolvedValue({ token: "access-token", user: adminUser });

    const session = await authFacade.login({ email: adminUser.email, password: "secret" });

    expect(session.user.role).toEqual({
      displayName: "Administrador",
      id: "role-admin",
      name: "admin"
    });
    expect(Object.keys(session.user).sort()).toEqual(["email", "fullName", "id", "role", "status"]);
  });

  it("restores an authenticated session using identity and role only", async () => {
    vi.spyOn(authFacade, "getCurrentUser").mockResolvedValue({
      ...adminUser,
      role: { ...adminUser.role, displayName: "Administrador" }
    });
    useAuthStore.setState({ status: "idle", token: "access-token", user: null });

    await useAuthStore.getState().restoreSession();

    expect(useAuthStore.getState()).toMatchObject({
      errorCode: null,
      status: "authenticated",
      token: "access-token",
      user: {
        id: "user-admin",
        role: { id: "role-admin", name: "admin" }
      }
    });
  });

  it("keeps failed login feedback in Spanish", async () => {
    vi.spyOn(authFacade, "login").mockRejectedValue(
      new ApiError({ code: "INVALID_CREDENTIALS", message: "Invalid email or password.", statusCode: 401 })
    );

    await useAuthStore.getState().login({ email: adminUser.email, password: "incorrect" });

    expect(useAuthStore.getState()).toMatchObject({
      errorCode: "invalid_credentials",
      status: "unauthenticated",
      token: null,
      user: null
    });
  });

  it("keeps failed session restoration feedback in Spanish", async () => {
    vi.spyOn(authFacade, "getCurrentUser").mockRejectedValue(new Error("Invalid session response."));
    useAuthStore.setState({ status: "idle", token: "expired-token", user: null });

    await useAuthStore.getState().restoreSession();

    expect(useAuthStore.getState()).toMatchObject({
      errorCode: "session_restore_failed",
      status: "unauthenticated",
      token: null,
      user: null
    });
  });
});
