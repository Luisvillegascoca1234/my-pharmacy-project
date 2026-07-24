import { BASE_ROLES, isFeatureAllowed } from "@pharmacy-pos/shared";
import { describe, expect, it } from "vitest";
import { getRouteTitle } from "./app-routes";
import {
  AUDIT_PATH,
  EXPORTS_PATH,
  REPORTS_PATH,
  STOCK_PLANNING_PATH,
  getVisibleNavigationItems,
  isRouteAllowedForRole,
  navigationItems
} from "./navigation";

const analysisRoutes = [
  {
    label: "Planificación de stock",
    path: STOCK_PLANNING_PATH,
    roles: {
      admin: true,
      seller: false,
      superadmin: true
    }
  },
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
  it.each(analysisRoutes)("keeps $label role access aligned with the PRD", ({ path, roles }) => {
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

const expectedNavigationByRole = {
  superadmin: navigationItems.map((item) => item.key),
  admin: [
    "dashboard",
    "pos",
    "pendingCarts",
    "cash",
    "supervision",
    "sales",
    "alerts",
    "products",
    "units",
    "batches",
    "movements",
    "adjustments",
    "suppliers",
    "purchases",
    "invoices",
    "returns",
    "stockPlanning",
    "reports",
    "exports"
  ],
  seller: ["dashboard", "pos", "pendingCarts", "cash", "sales", "alerts", "products", "units", "batches"]
} as const;

describe("role-based navigation", () => {
  it.each(BASE_ROLES)("shows the exact declared navigation for %s", (role) => {
    expect(getVisibleNavigationItems(role).map((item) => item.key)).toEqual(expectedNavigationByRole[role]);
  });

  it("keeps Roles y facultades exclusive to superadmin", () => {
    const rolesItem = navigationItems.find((item) => item.key === "roles");

    expect(rolesItem).toBeDefined();
    expect(BASE_ROLES.filter((role) => isRouteAllowedForRole(rolesItem!, role))).toEqual(["superadmin"]);
  });

  it("derives every navigation decision from the shared feature policy", () => {
    for (const role of BASE_ROLES) {
      for (const item of navigationItems) {
        expect(isRouteAllowedForRole(item, role)).toBe(isFeatureAllowed(role, item.key));
      }
    }
  });

  it("denies a feature without an explicit policy", () => {
    const undeclaredItem = {
      ...navigationItems[0]!,
      key: "futurePharmacyFeature"
    };

    expect(BASE_ROLES.every((role) => !isRouteAllowedForRole(undeclaredItem, role))).toBe(true);
  });
});
