import type { BaseRole } from "./roles.js";

const ALL_ROLES = ["superadmin", "admin", "seller"] as const satisfies readonly BaseRole[];
const ADMINISTRATIVE_ROLES = ["superadmin", "admin"] as const satisfies readonly BaseRole[];
const SUPERADMIN_ONLY = ["superadmin"] as const satisfies readonly BaseRole[];

export const FEATURE_ACCESS_POLICY = {
  dashboard: ALL_ROLES,
  pos: ALL_ROLES,
  pendingCarts: ALL_ROLES,
  cash: ALL_ROLES,
  supervision: ADMINISTRATIVE_ROLES,
  sales: ALL_ROLES,
  alerts: ALL_ROLES,
  products: ALL_ROLES,
  productManagement: ADMINISTRATIVE_ROLES,
  units: ALL_ROLES,
  unitManagement: ADMINISTRATIVE_ROLES,
  batches: ALL_ROLES,
  inventoryCosts: ADMINISTRATIVE_ROLES,
  movements: ADMINISTRATIVE_ROLES,
  adjustments: ADMINISTRATIVE_ROLES,
  suppliers: ADMINISTRATIVE_ROLES,
  purchases: ADMINISTRATIVE_ROLES,
  invoices: ADMINISTRATIVE_ROLES,
  returns: ADMINISTRATIVE_ROLES,
  siatSettings: SUPERADMIN_ONLY,
  reports: ADMINISTRATIVE_ROLES,
  stockPlanning: ADMINISTRATIVE_ROLES,
  stockPlanningGovernance: SUPERADMIN_ONLY,
  exports: ADMINISTRATIVE_ROLES,
  audit: SUPERADMIN_ONLY,
  users: SUPERADMIN_ONLY,
  roles: SUPERADMIN_ONLY,
  settings: SUPERADMIN_ONLY,
  authenticatedSession: ALL_ROLES
} as const satisfies Record<string, readonly BaseRole[]>;

export type FeatureKey = keyof typeof FEATURE_ACCESS_POLICY;

export function getAllowedRoles(feature: string): readonly BaseRole[] {
  return Object.prototype.hasOwnProperty.call(FEATURE_ACCESS_POLICY, feature)
    ? FEATURE_ACCESS_POLICY[feature as FeatureKey]
    : [];
}

export function isFeatureAllowed(role: string | undefined, feature: string): role is BaseRole {
  return role !== undefined && getAllowedRoles(feature).some((allowedRole) => allowedRole === role);
}
