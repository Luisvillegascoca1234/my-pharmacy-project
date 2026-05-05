export const BASE_ROLES = ["superadmin", "admin", "seller"] as const;

export type BaseRole = (typeof BASE_ROLES)[number];
