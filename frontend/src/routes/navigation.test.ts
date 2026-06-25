import { describe, expect, it } from "vitest";
import { getRouteTitle } from "./app-routes";
import {
  AUDIT_PATH,
  EXPORTS_PATH,
  REPORTS_PATH,
  isRouteAllowedForRole,
  navigationItems
} from "./navigation";

const analysisRoutes = [
  {
    label: "Reportes operativos",
    path: REPORTS_PATH,
    roles: {
      admin: true,
      seller: false,
      superadmin: true
    }
  },
  {
    label: "Exportaciones CSV",
    path: EXPORTS_PATH,
    roles: {
      admin: true,
      seller: false,
      superadmin: true
    }
  },
  {
    label: "Registro de auditoria",
    path: AUDIT_PATH,
    roles: {
      admin: false,
      seller: false,
      superadmin: true
    }
  }
] as const;

describe("analysis route guardrails", () => {
  it.each(analysisRoutes)("keeps $label route permissions aligned with the PRD", ({ path, roles }) => {
    const item = navigationItems.find((candidate) => candidate.path === path);

    expect(item).toBeDefined();
    expect(isRouteAllowedForRole(item!, "admin")).toBe(roles.admin);
    expect(isRouteAllowedForRole(item!, "seller")).toBe(roles.seller);
    expect(isRouteAllowedForRole(item!, "superadmin")).toBe(roles.superadmin);
  });

  it.each(analysisRoutes)("uses $label as the route title", ({ label, path }) => {
    expect(getRouteTitle(path)).toBe(label);
  });
});
