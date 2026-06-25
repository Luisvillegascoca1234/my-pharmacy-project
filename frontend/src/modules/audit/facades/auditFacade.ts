import { auditApi } from "../api/audit-api";
import type { AuditLogsListResponse, AuditLogsQuery } from "../types/auditTypes";
import { buildAuditLogsQuery } from "../utils/auditPayloads";

export const auditFacade = {
  listAuditLogs(query: AuditLogsQuery, signal?: AbortSignal): Promise<AuditLogsListResponse> {
    return auditApi.listAuditLogs(buildAuditLogsQuery(query), signal);
  }
};
