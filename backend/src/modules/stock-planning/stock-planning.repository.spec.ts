import { describe, expect, it, vi } from "vitest";
import { StockPlanningRepository } from "./stock-planning.repository.js";

const { prismaMock, txMock } = vi.hoisted(() => {
  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    $queryRaw: vi.fn().mockResolvedValue([{ acquired: true }]),
    product: {
      update: vi.fn()
    },
    stockPlanningConfiguration: {
      findFirst: vi.fn(),
      create: vi.fn()
    },
    inventorySnapshot: {
      create: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    }
  };

  return {
    txMock: tx,
    prismaMock: {
      product: {
        findMany: vi.fn()
      },
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx))
    }
  };
});

vi.mock("../../infrastructure/prisma/prisma.client.js", () => ({
  prisma: prismaMock
}));

describe("StockPlanningRepository", () => {
  it("loads every positive batch so the service can separate usable, expiry-risk and unusable stock", async () => {
    prismaMock.product.findMany.mockResolvedValue([]);
    const repository = new StockPlanningRepository();
    const businessDate = new Date("2026-07-23T00:00:00.000Z");

    await repository.listActiveProducts({ criticality: "high" }, businessDate);

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "active",
          stockCriticality: "high"
        }),
        include: expect.objectContaining({
          inventoryBatches: expect.objectContaining({
            where: {
              availableQuantity: { gt: 0 }
            },
            select: expect.objectContaining({
              expirationDate: true,
              status: true
            })
          })
        })
      })
    );
  });

  it("updates configuration and writes audit in one transaction without inventory movements", async () => {
    const repository = new StockPlanningRepository();

    await repository.updateProductConfiguration(
      "product-1",
      { stockCriticality: "critical", stockCoverageDays: 60 },
      { stockCriticality: "normal", stockCoverageDays: null, preferredRestockUnitId: null },
      {
        actorUserId: "admin-1",
        ipAddress: "127.0.0.1",
        userAgent: "vitest"
      }
    );

    expect(txMock.product.update).toHaveBeenCalledWith({
      where: { id: "product-1" },
      data: {
        stockCriticality: "critical",
        stockCoverageDays: 60
      }
    });
    expect(txMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "PRODUCT_STOCK_PLANNING_CONFIGURATION_UPDATED",
        actorUserId: "admin-1",
        entityType: "product",
        entityId: "product-1"
      })
    });
    expect("inventoryMovement" in txMock).toBe(false);
  });

  it("uses a PostgreSQL advisory lock while creating a versioned global configuration", async () => {
    txMock.stockPlanningConfiguration.findFirst.mockResolvedValue({
      id: "configuration-1",
      version: 1
    });
    txMock.stockPlanningConfiguration.create.mockResolvedValue({
      id: "configuration-2",
      version: 2,
      engineEnabled: true,
      frequency: "weekly",
      weekday: 1,
      localTime: "03:00",
      timezone: "America/La_Paz",
      coverageDays: 45,
      normalServiceLevel: { toNumber: () => 0.9 },
      highServiceLevel: { toNumber: () => 0.95 },
      criticalServiceLevel: { toNumber: () => 0.99 },
      minimumHistoryWeeks: 12,
      minimumDemandDays: 4,
      operationalDemandDays: 12,
      createdByUserId: "superadmin-1",
      createdAt: new Date()
    });
    const { StockPlanningExecutionRepository } = await import("./stock-planning-execution.repository.js");
    const repository = new StockPlanningExecutionRepository();

    await repository.createConfigurationVersion({
      engineEnabled: true,
      frequency: "weekly",
      weekday: 1,
      localTime: "03:00",
      timezone: "America/La_Paz",
      coverageDays: 45,
      normalServiceLevel: { toNumber: () => 0.9 } as never,
      highServiceLevel: { toNumber: () => 0.95 } as never,
      criticalServiceLevel: { toNumber: () => 0.99 } as never,
      minimumHistoryWeeks: 12,
      minimumDemandDays: 4,
      operationalDemandDays: 12
    }, { actorUserId: "superadmin-1" });

    expect(txMock.$executeRaw).toHaveBeenCalledOnce();
    expect(txMock.stockPlanningConfiguration.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ version: 2, frequency: "weekly", createdByUserId: "superadmin-1" })
    }));
    expect(txMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "STOCK_PLANNING_GLOBAL_CONFIGURATION_UPDATED",
        actorUserId: "superadmin-1",
        entityType: "stock_planning_configuration"
      })
    });
  });

  it("runs execution work only after acquiring the PostgreSQL transaction lock", async () => {
    const { StockPlanningExecutionRepository } = await import("./stock-planning-execution.repository.js");
    const repository = new StockPlanningExecutionRepository();
    const work = vi.fn().mockResolvedValue("completed");

    const result = await repository.runWithExecutionLock(work);

    expect(txMock.$queryRaw).toHaveBeenCalled();
    expect(work).toHaveBeenCalledWith(txMock);
    expect(result).toEqual({ acquired: true, value: "completed" });

    txMock.$queryRaw.mockResolvedValueOnce([{ acquired: false }]);
    const blockedWork = vi.fn();
    expect(await repository.runWithExecutionLock(blockedWork)).toEqual({ acquired: false });
    expect(blockedWork).not.toHaveBeenCalled();
  });
});
