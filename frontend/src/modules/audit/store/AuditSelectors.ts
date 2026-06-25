import type { AuditStore } from "./AuditStore";

export const selectAuditState = (state: AuditStore) => ({
  action: state.action,
  actorUserId: state.actorUserId,
  auditLogs: state.auditLogs,
  auditLogsStatus: state.auditLogsStatus,
  entityId: state.entityId,
  entityType: state.entityType,
  error: state.error,
  fromDate: state.fromDate,
  pagination: state.pagination,
  selectedAuditLog: state.selectedAuditLog,
  selectedAuditLogId: state.selectedAuditLogId,
  toDate: state.toDate
});

export const selectAuditActions = (state: AuditStore) => ({
  loadAuditLogs: state.loadAuditLogs,
  reset: state.reset,
  selectAuditLog: state.selectAuditLog,
  setAction: state.setAction,
  setActorUserId: state.setActorUserId,
  setEntityId: state.setEntityId,
  setEntityType: state.setEntityType,
  setFromDate: state.setFromDate,
  setPage: state.setPage,
  setPageSize: state.setPageSize,
  setToDate: state.setToDate
});
