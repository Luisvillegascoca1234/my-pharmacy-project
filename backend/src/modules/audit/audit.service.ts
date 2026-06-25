import type { AuditLog, AuditLogsListResponse, AuditLogsQuery } from "@pharmacy-pos/shared";
import { AuditRepository } from "./audit.repository.js";
import type { AuditLogListFilters, AuditLogListResult, AuditLogWithActor, AuditUserRecord } from "./audit.types.js";

export type AuditRepositoryPort = {
  listAuditLogs(filters: AuditLogListFilters): Promise<AuditLogListResult>;
};

export class AuditService {
  constructor(private readonly auditRepository: AuditRepositoryPort = new AuditRepository()) {}

  async listAuditLogs(query: AuditLogsQuery): Promise<AuditLogsListResponse> {
    const result = await this.auditRepository.listAuditLogs(query);

    return {
      data: result.data.map(toAuditLog),
      pagination: buildPagination(query.page, query.pageSize, result.total)
    };
  }
}

function toAuditLog(auditLog: AuditLogWithActor): AuditLog {
  return {
    id: auditLog.id,
    action: auditLog.action,
    actorUserId: auditLog.actorUserId ?? undefined,
    actorUser: auditLog.actorUser ? toUserSummary(auditLog.actorUser) : undefined,
    createdAt: auditLog.createdAt.toISOString(),
    entityId: auditLog.entityId ?? undefined,
    entityType: auditLog.entityType ?? undefined,
    ipAddress: auditLog.ipAddress ?? undefined,
    metadata: auditLog.metadata ?? undefined,
    userAgent: auditLog.userAgent ?? undefined
  };
}

function toUserSummary(user: AuditUserRecord) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName
  };
}

function buildPagination(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize)
  };
}
