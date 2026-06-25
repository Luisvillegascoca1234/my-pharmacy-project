import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExportsRepository } from "./exports.repository.js";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    auditLog: {
      create: vi.fn()
    },
    inventoryMovement: {
      findMany: vi.fn()
    },
    sale: {
      findMany: vi.fn()
    }
  }
}));

vi.mock("../../infrastructure/prisma/prisma.client.js", () => ({
  prisma: prismaMock
}));

describe("ExportsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.auditLog.create.mockResolvedValue({ id: "audit-1" });
    prismaMock.inventoryMovement.findMany.mockResolvedValue([]);
    prismaMock.sale.findMany.mockResolvedValue([]);
  });

  it("filters sales CSV by confirmedAt date range", async () => {
    const repository = new ExportsRepository();

    await repository.listSalesForCsv({ fromDate: "2026-06-01", toDate: "2026-06-30" });

    const findManyInput = prismaMock.sale.findMany.mock.calls[0][0] as Prisma.SaleFindManyArgs;

    expect(findManyInput.where).toEqual({
      confirmedAt: {
        gte: new Date("2026-06-01T00:00:00.000Z"),
        lt: new Date("2026-07-01T00:00:00.000Z")
      }
    });
    expect(findManyInput.orderBy).toEqual([{ confirmedAt: "asc" }, { correlativeNumber: "asc" }, { id: "asc" }]);
  });

  it("filters inventory movements CSV by createdAt date range", async () => {
    const repository = new ExportsRepository();

    await repository.listInventoryMovementsForCsv({ fromDate: "2026-06-01", toDate: "2026-06-30" });

    const findManyInput = prismaMock.inventoryMovement.findMany.mock.calls[0][0] as Prisma.InventoryMovementFindManyArgs;

    expect(findManyInput.where).toEqual({
      createdAt: {
        gte: new Date("2026-06-01T00:00:00.000Z"),
        lt: new Date("2026-07-01T00:00:00.000Z")
      }
    });
    expect(findManyInput.orderBy).toEqual([{ createdAt: "asc" }, { id: "asc" }]);
  });

  it("writes audited CSV download metadata", async () => {
    const repository = new ExportsRepository();

    await repository.createCsvDownloadAuditLog({
      fileName: "sales.csv",
      filters: { fromDate: "2026-06-01", toDate: "2026-06-30" },
      rowCount: 2,
      context: {
        actorUserId: "admin-1",
        ipAddress: "127.0.0.1",
        userAgent: "vitest"
      }
    });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "CSV_EXPORT_DOWNLOADED",
        actorUserId: "admin-1",
        entityType: "export",
        entityId: "sales.csv",
        metadata: {
          fileName: "sales.csv",
          filters: { fromDate: "2026-06-01", toDate: "2026-06-30" },
          rowCount: 2
        },
        ipAddress: "127.0.0.1",
        userAgent: "vitest"
      }
    });
  });
});
