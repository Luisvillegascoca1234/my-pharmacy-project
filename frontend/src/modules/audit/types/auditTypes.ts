import type { AuditLog, AuditLogsListResponse, AuditLogsQuery, PaginationMeta } from "@pharmacy-pos/shared";

export type AuditRequestStatus = "idle" | "loading" | "success" | "empty" | "error" | "forbidden";

export type AuditDataErrorCode = "validation" | "forbidden" | "session-invalid" | "unknown";

export type AuditDataError = {
  code: AuditDataErrorCode;
  statusCode: number | null;
};

export const emptyAuditPagination: PaginationMeta = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
};

export type { AuditLog, AuditLogsListResponse, AuditLogsQuery };
