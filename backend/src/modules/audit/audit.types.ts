import type { AuditLog, User } from "@prisma/client";

export type AuditUserRecord = Pick<User, "id" | "fullName" | "email" | "status">;

export type AuditLogWithActor = AuditLog & {
  actorUser: AuditUserRecord | null;
};

export type AuditLogListFilters = {
  action?: string;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  fromDate?: string;
  page: number;
  pageSize: number;
  toDate?: string;
};

export type AuditLogListResult = {
  data: AuditLogWithActor[];
  total: number;
};
