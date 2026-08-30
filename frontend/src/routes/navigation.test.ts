import { BASE_ROLES, isFeatureAllowed } from "@pharmacy-pos/shared";
import { describe, expect, it } from "vitest";
import { getRouteTitle } from "./app-routes";
import {
  AUDIT_PATH,
  EXPORTS_PATH,
  REPORTS_PATH,
  STOCK_PLANNING_PATH,
  getVisibleNavigationGroups,
  getVisibleNavigationItems,
  isRouteAllowedForRole,
  navigationItems
} from "./navigation";

const analysisRoutes = [
  {
    label: "Qué comprar",
    path: STOCK_PLANNING_PATH,
    roles: {
      admin: true,
      seller: false,
      superadmin: true
    }
  },
  {
    label: "Reportes",
    path: REPORTS_PATH,
    roles: {
      admin: true,
      seller: false,
      superadmin: true
    }
  },
  {
    label: "Exportar datos",
    path: EXPORTS_PATH,
    roles: {
      admin: true,
      seller: false,
      superadmin: true
    }
  },
  {
    label: "Auditoría",
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
    "cash",
    "pos",
    "pendingCarts",
    "supervision",
    "sales",
    "invoices",
    "returns",
    "alerts",
    "products",
    "units",
    "batches",
    "movements",
    "adjustments",
    "stockPlanning",
    "purchases",
    "suppliers",
    "reports",
    "exports"
  ],
  seller: ["dashboard", "cash", "pos", "pendingCarts", "sales", "alerts", "products", "units", "batches"]
} as const;

describe("role-based navigation", () => {
  it.each(BASE_ROLES)("shows the exact declared navigation for %s", (role) => {
    expect(getVisibleNavigationItems(role).map((item) => item.key)).toEqual(expectedNavigationByRole[role]);
  });

  it("keeps Roles y permisos exclusive to superadmin", () => {
    const rolesItem = navigationItems.find((item) => item.key === "roles");

    expect(rolesItem).toBeDefined();
    expect(BASE_ROLES.filter((role) => isRouteAllowedForRole(rolesItem!, role))).toEqual(["superadmin"]);
  });

  it.each([
    ["seller", ["dashboard", "cash", "pos", "sales", "alerts", "products", "batches"]],
    ["admin", ["dashboard", "cash", "pos", "supervision", "sales", "alerts", "products", "batches", "stockPlanning", "purchases", "reports"]],
    ["superadmin", ["dashboard", "cash", "pos", "supervision", "sales", "alerts", "products", "batches", "stockPlanning", "purchases", "reports", "users"]]
  ] as const)("keeps the %s sidebar focused on primary tasks", (role, expectedKeys) => {
    const primaryItems = getVisibleNavigationGroups(role).flatMap((group) => group.items);

    expect(primaryItems.map((item) => item.key)).toEqual(expectedKeys);
  });

  it("hides unfinished SIAT and global settings entries", () => {
    expect(navigationItems.some((item) => item.key === "siatSettings")).toBe(false);
    expect(navigationItems.some((item) => item.key === "settings")).toBe(false);
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
