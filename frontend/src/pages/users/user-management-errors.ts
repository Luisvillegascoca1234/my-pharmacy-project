import { ApiError } from "@/api";

const userManagementErrorMessages: Record<string, string> = {
  LAST_ACTIVE_SUPERADMIN: "Debe permanecer al menos una cuenta Superadministrador activa.",
  ROLE_NOT_FOUND: "El rol seleccionado ya no está disponible.",
  USER_EMAIL_IN_USE: "El correo electrónico ya está asignado a otro usuario.",
  USER_NOT_FOUND: "La cuenta de usuario ya no está disponible. Actualiza la lista e inténtalo nuevamente.",
  VALIDATION_ERROR: "Revisa los datos ingresados antes de continuar."
};

export function getUserManagementErrorMessage(error: unknown, fallback: string): string {
  if (ApiError.isApiError(error)) {
    if (error.code && userManagementErrorMessages[error.code]) {
      return userManagementErrorMessages[error.code];
    }

    if (error.code === "NETWORK_ERROR") {
      return "No hay conexión. Verifica tu red e inténtalo nuevamente.";
    }
  }

  return fallback;
}

export function getUsersLoadErrorMessage(errorCode: "load_failed" | null): string | null {
  return errorCode === "load_failed" ? "No se pudieron cargar los usuarios y roles." : null;
}
