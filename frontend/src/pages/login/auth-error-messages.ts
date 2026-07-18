import type { AuthErrorCode } from "@/modules/auth";

const authErrorMessages: Record<AuthErrorCode, string> = {
  inactive_account: "La cuenta de usuario está inactiva.",
  invalid_credentials: "Correo electrónico o contraseña incorrectos.",
  login_failed: "No se pudo iniciar sesión.",
  session_restore_failed: "No se pudo restaurar la sesión. Vuelve a iniciar sesión."
};

export function getAuthErrorMessage(errorCode: AuthErrorCode | null): string | null {
  return errorCode ? authErrorMessages[errorCode] : null;
}
