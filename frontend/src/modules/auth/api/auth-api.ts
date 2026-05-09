import {
  type AuthenticatedUser,
  type AuthSession,
  type LoginRequest
} from "@pharmacy-pos/shared";
import { axiosApi } from "@/api";

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthSession> {
    const response = await axiosApi.post<AuthSession>("/auth/login", credentials, {
      skipAuth: true,
      skipUnauthorizedRedirect: true
    });

    return response.data;
  },

  async getCurrentUser(signal?: AbortSignal): Promise<AuthenticatedUser> {
    const response = await axiosApi.get<AuthenticatedUser>("/auth/me", {
      signal
    });

    return response.data;
  },

  async logout(): Promise<void> {
    await axiosApi.post<void>("/auth/logout", undefined, {
      skipUnauthorizedRedirect: true
    });
  }
};
