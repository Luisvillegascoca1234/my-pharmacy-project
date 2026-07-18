import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "./auth-error-messages";

describe("authentication error messages", () => {
  it("communicates login and restoration failures in Spanish", () => {
    expect(getAuthErrorMessage("invalid_credentials")).toBe("Correo electrónico o contraseña incorrectos.");
    expect(getAuthErrorMessage("session_restore_failed")).toBe("No se pudo restaurar la sesión. Vuelve a iniciar sesión.");
  });
});
