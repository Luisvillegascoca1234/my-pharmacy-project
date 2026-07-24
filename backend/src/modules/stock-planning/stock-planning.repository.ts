import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type {
  ProductStockConfigurationUpdate,
  StockPlanningAuditContext,
  StockPlanningFilters,
  StockPlanningProductRecord
} from "./stock-planning.types.js";

const stockPlanningProductInclude = {
  category: {
    select: {
      id: true,
      name: true
    }
  },
  supplier: {
    select: {
      id: true,
      businessName: true
    }
  },
  baseUnit: {
    select: {
      id: true,
      abbreviation: true
    }
  },
  preferredRestockUnit: {
    include: {
      unit: {
        select: {
          id: true,
          name: true,
          abbreviation: true
        }
      }
    }
  },
  inventoryBatches: {
    where: {
      availableQuantity: {
        gt: 0
      }
    },
    select: {
      id: true,
      availableQuantity: true,
      expirationDate: true,
      status: true
    }
  },
  stockPlanningForecasts: {
    where: {
      execution: {
        status: {
          in: ["succeeded", "succeeded_with_warnings"]
        }
      }
    },
    select: {
      executionId: true,
      maturity: true,
      confidence: true,
      model: true,
      historyDays: true,
      demandDays: true,
      censoredDays: true,
      parameters: true,
      metrics: true,
      fingerprint: true,
      engineVersion: true,
      rulesVersion: true,
      warnings: true,
      recommendation: true,
      forecastPoints: {
        select: {
          localDate: true,
          central: true,
          lower80: true,
          upper80: true
        },
        orderBy: { localDate: "asc" }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 1
  }
} satisfies Prisma.ProductInclude;

export class StockPlanningRepository {
  async listActiveProducts(filters: StockPlanningFilters, _businessDate: Date): Promise<StockPlanningProductRecord[]> {
    const normalizedSearch = filters.search?.trim();

    const products = await prisma.product.findMany({
      where: {
        status: "active",
        categoryId: filters.categoryId,
        supplierId: filters.supplierId,
        stockCriticality: filters.criticality,
        OR: normalizedSearch
          ? [
              { commercialName: { contains: normalizedSearch, mode: "insensitive" } },
              { genericName: { contains: normalizedSearch, mode: "insensitive" } },
              { internalCode: { contains: normalizedSearch, mode: "insensitive" } },
              { barcode: { contains: normalizedSearch, mode: "insensitive" } }
            ]
          : undefined
      },
      include: stockPlanningProductInclude,
      orderBy: [{ commercialName: "asc" }, { id: "asc" }]
    });
    if (products.length === 0) return [];

    const productIds = products.map((product) => product.id);
    const [drafts, reliableCosts] = await Promise.all([
      prisma.purchaseItem.groupBy({
        by: ["productId", "purchaseId"],
        where: {
          productId: { in: productIds },
          purchase: { status: "draft" }
        },
        _sum: { baseQuantity: true }
      }),
      prisma.purchaseItem.findMany({
        where: {
          productId: { in: productIds },
          isInventoryTracked: true,
          baseUnitCost: { gt: 0 },
          purchase: { status: "received", receivedAt: { not: null } }
        },
        select: {
          productId: true,
          baseUnitCost: true,
          purchase: { select: { receivedAt: true } }
        },
        orderBy: [
          { purchase: { receivedAt: "desc" } },
          { createdAt: "desc" },
          { id: "desc" }
        ],
        distinct: ["productId"]
      })
    ]);
    const draftsByProduct = new Map<string, { quantity: Prisma.Decimal; purchaseCount: number }>();
    for (const draft of drafts) {
      const current = draftsByProduct.get(draft.productId) ?? {
        quantity: new Prisma.Decimal(0),
        purchaseCount: 0
      };
      draftsByProduct.set(draft.productId, {
        quantity: current.quantity.plus(draft._sum.baseQuantity ?? 0),
        purchaseCount: current.purchaseCount + 1
      });
    }
    const costByProduct = new Map<string, Prisma.Decimal>();
    for (const cost of reliableCosts) {
      if (!costByProduct.has(cost.productId)) costByProduct.set(cost.productId, cost.baseUnitCost);
    }

    return products.map((product) => {
      const draft = draftsByProduct.get(product.id);
      return {
        ...product,
        purchaseContext: {
          draftQuantity: draft?.quantity ?? new Prisma.Decimal(0),
          draftCount: draft?.purchaseCount ?? 0,
          latestReliableBaseUnitCost: costByProduct.get(product.id) ?? null
        }
      };
    });
  }

  findProductById(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        stockCriticality: true,
        stockCoverageDays: true,
        preferredRestockUnitId: true
      }
    });
  }

  findProductUnit(productId: string, productUnitId: string) {
    return prisma.productUnit.findFirst({
      where: {
        id: productUnitId,
        productId
      },
      select: {
        id: true
      }
    });
  }

  updateProductConfiguration(
    productId: string,
    update: ProductStockConfigurationUpdate,
    previousConfiguration: ProductStockConfigurationUpdate,
    context: StockPlanningAuditContext
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: update
      });

      await tx.auditLog.create({
        data: {
          action: "PRODUCT_STOCK_PLANNING_CONFIGURATION_UPDATED",
          actorUserId: context.actorUserId,
          entityType: "product",
          entityId: productId,
          metadata: {
            before: previousConfiguration,
            after: {
              ...previousConfiguration,
              ...update
            }
          } as Prisma.InputJsonValue,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent
        }
      });
    });
  }
}
