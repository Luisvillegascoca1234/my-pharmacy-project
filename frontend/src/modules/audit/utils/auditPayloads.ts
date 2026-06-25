import type { AuditLogsQuery } from "../types/auditTypes";

function normalizeText(value?: string): string | undefined {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

export function buildAuditLogsQuery(query: AuditLogsQuery): AuditLogsQuery {
  return {
    action: normalizeText(query.action),
    actorUserId: normalizeText(query.actorUserId),
    entityId: normalizeText(query.entityId),
    entityType: normalizeText(query.entityType),
    fromDate: normalizeText(query.fromDate),
    page: query.page,
    pageSize: query.pageSize,
    toDate: normalizeText(query.toDate)
  };
}
