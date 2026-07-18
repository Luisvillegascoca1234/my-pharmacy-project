import { BASE_ROLES, isFeatureAllowed, type AuthenticatedUser, type BaseRole } from "@pharmacy-pos/shared";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AppRoutes } from "./app-routes";
import { navigationItems } from "./navigation";

let container: HTMLDivElement | null = null;

afterEach(() => {
  container?.remove();
  container = null;
});

describe("direct route access", () => {
  const deniedNavigationRoutes = BASE_ROLES.flatMap((role) =>
    navigationItems
      .filter((item) => !isFeatureAllowed(role, item.key))
      .map((item) => [role, item.path, item.label] as const)
  );

  it.each(deniedNavigationRoutes)("shows a Spanish denial for %s at %s", async (role, path, featureLabel) => {
    await renderRoute(role, path);

    expect(container?.textContent).toContain("Acceso no autorizado");
    expect(container?.textContent).toContain("Tu rol actual no permite abrir esta ruta operativa.");
    expect(container?.textContent).toContain(featureLabel);
  });

  it.each([
    ["seller", "/suppliers/new", "Proveedores"],
    ["seller", "/suppliers/supplier-1", "Proveedores"],
    ["seller", "/purchases/new", "Compras"],
    ["seller", "/purchases/purchase-1", "Compras"]
  ] as const)("also denies protected child route %s at %s", async (role, path, featureLabel) => {
    await renderRoute(role, path);

    expect(container?.textContent).toContain("Acceso no autorizado");
    expect(container?.textContent).toContain(featureLabel);
  });
});

async function renderRoute(role: BaseRole, path: string) {
  container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes user={buildUser(role)} />
      </MemoryRouter>
    );
  });
}

function buildUser(role: BaseRole): AuthenticatedUser {
  return {
    email: `${role}@farmacia.test`,
    fullName: `Usuario ${role}`,
    id: `${role}-user`,
    role: {
      displayName: role,
      id: `${role}-role`,
      name: role
    },
    status: "active"
  };
}
