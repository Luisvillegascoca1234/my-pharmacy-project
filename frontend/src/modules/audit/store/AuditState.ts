import type { AuditLog, AuditLogsQuery, AuditDataError, AuditRequestStatus } from "../types/auditTypes";
import { emptyAuditPagination } from "../types/auditTypes";

export const AUDIT_DEFAULT_PAGE_SIZE = 20;

export type AuditState = {
  action: string;
  actorUserId: string;
  auditLogs: AuditLog[];
  auditLogsStatus: AuditRequestStatus;
  entityId: string;
  entityType: string;
  error: AuditDataError | null;
  fromDate: string;
  pagination: typeof emptyAuditPagination;
  selectedAuditLog: AuditLog | null;
  selectedAuditLogId: string | null;
  toDate: string;
};

export const initialAuditState: AuditState = {
  action: "",
  actorUserId: "",
  auditLogs: [],
  auditLogsStatus: "idle",
  entityId: "",
  entityType: "",
  error: null,
  fromDate: "",
  pagination: emptyAuditPagination,
  selectedAuditLog: null,
  selectedAuditLogId: null,
  toDate: ""
};

export function buildAuditLogsQueryFromState(state: AuditState): AuditLogsQuery {
  return {
    action: state.action || undefined,
    actorUserId: state.actorUserId || undefined,
    entityId: state.entityId || undefined,
    entityType: state.entityType || undefined,
    fromDate: state.fromDate || undefined,
    page: state.pagination.page,
    pageSize: state.pagination.pageSize,
    toDate: state.toDate || undefined
  };
}
