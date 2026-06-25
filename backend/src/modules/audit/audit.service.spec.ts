import { describe, expect, it } from "vitest";
import { expectHttpError } from "../../tests/utils/http-error.js";
import { canReadAuditLogs } from "./audit.routes.js";
import { AuditService, type AuditRepositoryPort } from "./audit.service.js";
import type { AuditLogListFilters, AuditLogWithActor } from "./audit.types.js";

describe("AuditService", () => {
  it("lists audit logs with filters, metadata and pagination", async () => {
    const repository = new FakeAuditRepository();
    repository.result = {
      data: [
        makeAuditLog({
          action: "CSV_EXPORT_DOWNLOADED",
          actorUserId: "superadmin-1",
          actorUser: {
            id: "superadmin-1",
            email: "superadmin@example.com",
            fullName: "Super Administrador",
            status: "active"
          },
          entityType: "export",
          entityId: "sales.csv",
          metadata: {
            fileName: "sales.csv",
            rowCount: 2
          }
        })
      ],
      total: 21
    };
    const service = new AuditService(repository);
    const query = {
      page: 2,
      pageSize: 10,
      action: "csv",
      actorUserId: "superadmin-1",
      entityType: "export",
      entityId: "sales.csv",
      fromDate: "2026-06-01",
      toDate: "2026-06-30"
    };

    const result = await service.listAuditLogs(query);

    expect(repository.lastFilters).toEqual(query);
    expect(result).toEqual({
      data: [
        {
          id: "audit-1",
          action: "CSV_EXPORT_DOWNLOADED",
          actorUserId: "superadmin-1",
          actorUser: {
            id: "superadmin-1",
            email: "superadmin@example.com",
            fullName: "Super Administrador"
          },
          createdAt: "2026-06-25T10:30:00.000Z",
          entityId: "sales.csv",
          entityType: "export",
          ipAddress: "127.0.0.1",
          metadata: {
            fileName: "sales.csv",
            rowCount: 2
          },
          userAgent: "vitest"
        }
      ],
      pagination: {
        page: 2,
        pageSize: 10,
        total: 21,
        totalPages: 3
      }
    });
  });
});

describe("Audit routes permissions", () => {
  it("allows superadmin to read audit logs", () => {
    const request = makeRoleRequest("superadmin");
    const next = createNextSpy();

    canReadAuditLogs(request, {} as never, next);

    expect(next.calls).toEqual([undefined]);
  });

  it.each(["admin", "seller"])("blocks %s from audit logs before controller execution", (roleName) => {
    const request = makeRoleRequest(roleName);
    const next = createNextSpy();

    canReadAuditLogs(request, {} as never, next);

    expect(next.calls).toHaveLength(1);
    expectHttpError(next.calls[0], {
      code: "FORBIDDEN",
      statusCode: 403
    });
  });
});

class FakeAuditRepository implements AuditRepositoryPort {
  result = {
    data: [] as AuditLogWithActor[],
    total: 0
  };
  lastFilters?: AuditLogListFilters;

  listAuditLogs(filters: AuditLogListFilters) {
    this.lastFilters = filters;

    return Promise.resolve(this.result);
  }
}

function makeAuditLog(overrides: Partial<AuditLogWithActor> = {}): AuditLogWithActor {
  return {
    id: overrides.id ?? "audit-1",
    action: overrides.action ?? "USER_LOGIN_SUCCEEDED",
    actorUserId: overrides.actorUserId ?? null,
    actorUser: overrides.actorUser ?? null,
    entityType: overrides.entityType ?? null,
    entityId: overrides.entityId ?? null,
    metadata: overrides.metadata ?? null,
    ipAddress: overrides.ipAddress ?? "127.0.0.1",
    userAgent: overrides.userAgent ?? "vitest",
    createdAt: overrides.createdAt ?? new Date("2026-06-25T10:30:00.000Z")
  };
}

function makeRoleRequest(roleName: string) {
  return {
    authenticatedUser: {
      id: `${roleName}-1`,
      fullName: roleName,
      email: `${roleName}@example.com`,
      status: "active",
      role: {
        id: `${roleName}-role`,
        name: roleName
      }
    }
  } as never;
}

function createNextSpy() {
  const next = ((error?: unknown) => {
    next.calls.push(error);
  }) as ((error?: unknown) => void) & { calls: unknown[] };

  next.calls = [];

  return next;
}
