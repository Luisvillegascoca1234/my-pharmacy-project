import { describe, expect, it } from "vitest";
import { FEATURE_ACCESS_POLICY, getAllowedRoles, isFeatureAllowed, type BaseRole } from "@pharmacy-pos/shared";

const allRoles = ["superadmin", "admin", "seller"] satisfies BaseRole[];
const administrativeRoles = ["superadmin", "admin"] satisfies BaseRole[];
const superadminOnly = ["superadmin"] satisfies BaseRole[];

const expectedPolicy = {
  dashboard: allRoles,
  pos: allRoles,
  pendingCarts: allRoles,
  cash: allRoles,
  supervision: administrativeRoles,
  sales: allRoles,
  alerts: allRoles,
  products: allRoles,
  productManagement: administrativeRoles,
  units: allRoles,
  unitManagement: administrativeRoles,
  batches: allRoles,
  inventoryCosts: administrativeRoles,
  movements: administrativeRoles,
  adjustments: administrativeRoles,
  suppliers: administrativeRoles,
  purchases: administrativeRoles,
  invoices: administrativeRoles,
  returns: administrativeRoles,
  siatSettings: superadminOnly,
  reports: administrativeRoles,
  exports: administrativeRoles,
  audit: superadminOnly,
  users: superadminOnly,
  roles: superadminOnly,
  settings: superadminOnly,
  authenticatedSession: allRoles
};

describe("shared feature access policy", () => {
  it("declares the complete known feature matrix", () => {
    expect(FEATURE_ACCESS_POLICY).toEqual(expectedPolicy);
  });

  it.each(Object.entries(expectedPolicy))("makes the same decision for every role on %s", (feature, allowedRoles) => {
    expect(getAllowedRoles(feature)).toEqual(allowedRoles);

    for (const role of allRoles) {
      expect(isFeatureAllowed(role, feature)).toBe((allowedRoles as readonly BaseRole[]).includes(role));
    }
  });

  it("denies an omitted feature to every institutional role", () => {
    expect(getAllowedRoles("notDeclared")).toEqual([]);

    for (const role of allRoles) {
      expect(isFeatureAllowed(role, "notDeclared")).toBe(false);
    }
  });
});
