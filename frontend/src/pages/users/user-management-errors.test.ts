import { describe, expect, it } from "vitest";
import { ApiError } from "@/api";
import { getUserManagementErrorMessage, getUsersLoadErrorMessage } from "./user-management-errors";

describe("user management error messages", () => {
  it("explains the last active superadministrator protection in Spanish", () => {
    const error = new ApiError({
      code: "LAST_ACTIVE_SUPERADMIN",
      message: "The last active superadmin cannot be disabled.",
      statusCode: 400
    });

    expect(getUserManagementErrorMessage(error, "No se pudo guardar el usuario.")).toBe(
      "Debe permanecer al menos una cuenta Superadministrador activa."
    );
  });

  it("does not expose an unknown server message", () => {
    const error = new ApiError({ message: "Internal server details.", statusCode: 500 });

    expect(getUserManagementErrorMessage(error, "No se pudo guardar el usuario.")).toBe("No se pudo guardar el usuario.");
  });

  it("communicates catalog loading failures in Spanish", () => {
    expect(getUsersLoadErrorMessage("load_failed")).toBe("No se pudieron cargar los usuarios y roles.");
  });
});
