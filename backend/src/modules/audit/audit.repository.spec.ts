import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditRepository } from "./audit.repository.js";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    auditLog: {
      count: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

vi.mock("../../infrastructure/prisma/prisma.client.js", () => ({
  prisma: prismaMock
}));

describe("AuditRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.auditLog.count.mockResolvedValue(0);
    prismaMock.auditLog.findMany.mockResolvedValue([]);
  });

  it("applies pagination, filters and actor metadata include when listing audit logs", async () => {
    const repository = new AuditRepository();

    await repository.listAuditLogs({
      page: 3,
      pageSize: 25,
      action: "csv",
      actorUserId: "superadmin-1",
      entityType: "export",
      entityId: "sales.csv",
      fromDate: "2026-06-01",
      toDate: "2026-06-30"
    });

    const findManyInput = prismaMock.auditLog.findMany.mock.calls[0][0] as Prisma.AuditLogFindManyArgs;
    const countInput = prismaMock.auditLog.count.mock.calls[0][0] as Prisma.AuditLogCountArgs;

    expect(findManyInput.skip).toBe(50);
    expect(findManyInput.take).toBe(25);
    expect(findManyInput.include).toEqual({
      actorUser: {
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true
        }
      }
    });
    expect(findManyInput.where).toEqual({
      action: {
        contains: "csv",
        mode: "insensitive"
      },
      actorUserId: "superadmin-1",
      entityType: {
        contains: "export",
        mode: "insensitive"
      },
      entityId: "sales.csv",
      createdAt: {
        gte: new Date("2026-06-01T00:00:00.000Z"),
        lt: new Date("2026-07-01T00:00:00.000Z")
      }
    });
    expect(countInput.where).toEqual(findManyInput.where);
  });
});
