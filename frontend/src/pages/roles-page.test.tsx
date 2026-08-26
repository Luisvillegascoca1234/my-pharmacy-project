import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoleFacultyArea, RoleScopeLevel, RolesCatalogResponse } from "@pharmacy-pos/shared";
import { RolesPageView } from "./roles-page";

const areas: Array<{ area: RoleFacultyArea; areaLabel: string }> = [
  { area: "counter_operations", areaLabel: "Operación de mostrador" },
  { area: "pharmaceutical_catalog", areaLabel: "Catálogo farmacéutico" },
  { area: "inventory_traceability", areaLabel: "Inventario y trazabilidad" },
  { area: "supply", areaLabel: "Abastecimiento" },
  { area: "administrative_closure_analysis", areaLabel: "Cierre administrativo y análisis" },
  { area: "system_governance", areaLabel: "Gobierno del sistema" }
];

const roles: RolesCatalogResponse = [
  buildRole("role-superadmin", "superadmin", "Superadministrador", "Gobierna y supervisa la operación farmacéutica.", "full_access"),
  buildRole("role-admin", "admin", "Administrador", "Dirige la operación cotidiana de la farmacia.", "operational_access"),
  buildRole("role-seller", "seller", "Vendedor", "Atiende la dispensación y opera sus registros.", "own_records_only")
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("RolesPageView", () => {
  it("renders the three institutional summaries, six areas and scope legend after a successful load", () => {
    renderView("success");

    expect(container.textContent).toContain("Superadministrador");
    expect(container.textContent).toContain("Administrador");
    expect(container.textContent).toContain("Vendedor");
    ["Ventas y caja", "Productos", "Inventario", "Compras y proveedores", "Cierres y reportes", "Usuarios y auditoría"]
      .forEach((areaLabel) => expect(container.textContent).toContain(areaLabel));
    expect(container.textContent).toContain("Acceso total");
    expect(container.textContent).toContain("Puede trabajar");
    expect(container.textContent).toContain("Solo registros propios");
    expect(container.textContent).toContain("Sin acceso");
    expect(container.textContent).toContain("El Vendedor trabaja con su propia caja y sus ventas.");
  });

  it("offers a working retry action after a recoverable request error", () => {
    const onRetry = vi.fn();
    renderView("error", onRetry);

    const button = findButton("Reintentar");
    act(() => button.click());

    expect(onRetry).toHaveBeenCalledOnce();
    expect(container.textContent).toContain("sin abandonar esta pantalla");
  });

  it("distinguishes an invalid institutional configuration from a request error", () => {
    renderView("invalid-configuration");

    expect(container.textContent).toContain("No se pueden mostrar los permisos");
    expect(container.textContent).toContain("La información de roles está incompleta");
    expect(container.textContent).not.toContain("Tipos de usuario");
  });

  it("does not render search, filters, forms or editing controls", () => {
    renderView("success");

    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector("input")).toBeNull();
    expect(container.querySelector("select")).toBeNull();
    expect(container.querySelector("textarea")).toBeNull();
    expect(container.querySelector("button")).toBeNull();
    expect(container.textContent).not.toMatch(/Crear|Editar|Eliminar|Guardar/);
  });
});

function renderView(status: Parameters<typeof RolesPageView>[0]["status"], onRetry = vi.fn()) {
  act(() => {
    root.render(<RolesPageView roles={status === "success" ? roles : []} status={status} onRetry={onRetry} />);
  });
}

function findButton(label: string) {
  const button = [...container.querySelectorAll("button")].find((candidate) => candidate.textContent?.includes(label));

  if (!button) {
    throw new Error(`Button ${label} was not rendered.`);
  }

  return button;
}

function buildRole(
  id: string,
  name: "superadmin" | "admin" | "seller",
  displayName: string,
  responsibility: string,
  defaultLevel: RoleScopeLevel
): RolesCatalogResponse[number] {
  return {
    displayName,
    faculties: areas.map(({ area, areaLabel }, index) => ({
      area,
      areaLabel,
      description: `${displayName}: alcance institucional para ${areaLabel.toLowerCase()}.`,
      level: index === areas.length - 1 && name !== "superadmin" ? "no_access" : defaultLevel
    })),
    id,
    name,
    responsibility
  };
}
