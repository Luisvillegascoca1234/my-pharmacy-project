import { AUTH_STORAGE_KEY, useAuthStore } from "@/modules/auth/store/AuthStore";
import { resetSessionScopedState } from "@/modules/auth/utils/resetSessionScopedState";

export function resetAllStores(): void {
  resetSessionScopedState();
  useAuthStore.getState().reset();
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
