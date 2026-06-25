export type AuditActions = {
  loadAuditLogs: (signal?: AbortSignal) => Promise<void>;
  reset: () => void;
  selectAuditLog: (auditLogId: string | null) => void;
  setAction: (action: string) => void;
  setActorUserId: (actorUserId: string) => void;
  setEntityId: (entityId: string) => void;
  setEntityType: (entityType: string) => void;
  setFromDate: (fromDate: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setToDate: (toDate: string) => void;
};
