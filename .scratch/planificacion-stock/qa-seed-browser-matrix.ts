import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dayMs = 86_400_000;
const today = new Date("2026-07-23T00:00:00.000Z");

const patterns = [
  { key: "stable", code: "QA-STABLE", name: "QA Patrón estable", model: "moving_average", maturity: "operational", confidence: "high", demand: 4, criticality: "normal" },
  { key: "weekly", code: "QA-WEEKLY", name: "QA Patrón semanal", model: "seasonal_naive_weekly", maturity: "operational", confidence: "high", demand: 7, criticality: "high" },
  { key: "intermittent", code: "QA-INTERMITTENT", name: "QA Patrón intermitente", model: "croston_sba", maturity: "operational", confidence: "medium", demand: 2, criticality: "normal" },
  { key: "growing", code: "QA-GROWING", name: "QA Tendencia creciente", model: "holt", maturity: "operational", confidence: "high", demand: 9, criticality: "critical" },
  { key: "no-sales", code: "QA-NO-SALES", name: "QA Sin ventas observadas", model: null, maturity: "no_observed_demand", confidence: "none", demand: 0, criticality: "normal" },
  { key: "censored", code: "QA-CENSORED", name: "QA Demanda censurada", model: "tsb", maturity: "low_confidence", confidence: "low", demand: 3, criticality: "high" },
  { key: "isolated", code: "QA-ISOLATED", name: "QA Fallo aislado", model: "recent_naive", maturity: "low_confidence", confidence: "low", demand: 3, criticality: "normal" },
  { key: "inactive", code: "QA-INACTIVE", name: "QA Producto para inactivar", model: "simple_exponential_smoothing", maturity: "operational", confidence: "medium", demand: 5, criticality: "normal" }
] as const;

function date(offset: number) {
  return new Date(today.getTime() + offset * dayMs);
}

async function main() {
  const category = await prisma.productCategory.findFirstOrThrow({ where: { status: "active" } });
  const supplier = await prisma.supplier.findFirstOrThrow({ where: { status: "active" } });
  const baseUnit = await prisma.unit.findFirstOrThrow({ where: { status: "active" } });
  const boxUnit = await prisma.unit.upsert({
    where: { abbreviation: "CAJ" },
    update: { status: "active" },
    create: { id: "qa-unit-box", name: "Caja QA", abbreviation: "CAJ", status: "active" }
  });
  const actor = await prisma.user.findFirstOrThrow({ where: { email: "admin@admin.com" } });
  const latestSuccessful = await prisma.stockPlanningExecution.findFirstOrThrow({
    where: { status: { in: ["succeeded", "succeeded_with_warnings"] } },
    orderBy: [{ startedAt: "desc" }, { id: "desc" }]
  });
  if (!await prisma.stockPlanningExecution.findUnique({
    where: { idempotencyKey: "qa-isolated-warning-execution" }
  })) {
    await prisma.stockPlanningExecution.create({
      data: {
      id: "qa-execution-isolated-warning",
      idempotencyKey: "qa-isolated-warning-execution",
      configurationId: latestSuccessful.configurationId,
      configurationSnapshot: latestSuccessful.configurationSnapshot,
      trigger: "manual",
      status: "succeeded_with_warnings",
      demandCutoffDate: today,
      stockCapturedAt: new Date("2026-07-23T23:50:00.000Z"),
      engineVersion: "qa-engine-1",
      fingerprint: "qa-isolated-warning-execution",
      requestedByUserId: actor.id,
      startedAt: new Date("2026-07-23T23:50:00.000Z"),
      completedAt: new Date("2026-07-23T23:50:02.000Z"),
      durationMs: 2000,
      warnings: ["product:qa-product-isolated:qa_forced_isolated_failure"]
      }
    });
  }
  const executions = await prisma.stockPlanningExecution.findMany({
    where: { status: { in: ["succeeded", "succeeded_with_warnings"] } },
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
    take: 2
  });
  if (executions.length < 2) throw new Error("QA needs two successful executions.");
  const [currentExecution, previousExecution] = executions;

  const receivedPurchase = await prisma.purchase.upsert({
    where: { id: "qa-stock-planning-received" },
    update: {},
    create: {
      id: "qa-stock-planning-received",
      supplierId: supplier.id,
      purchaseDate: date(-60),
      status: "received",
      totalAmount: 800,
      createdByUserId: actor.id,
      receivedByUserId: actor.id,
      receivedAt: date(-59),
      notes: "Matriz QA de planificación"
    }
  });
  const draftPurchase = await prisma.purchase.upsert({
    where: { id: "qa-stock-planning-draft" },
    update: {},
    create: {
      id: "qa-stock-planning-draft",
      supplierId: supplier.id,
      purchaseDate: today,
      status: "draft",
      totalAmount: 120,
      createdByUserId: actor.id,
      notes: "Compra en borrador QA; solo contexto consultivo"
    }
  });

  for (const pattern of patterns) {
    const product = await prisma.product.upsert({
      where: { internalCode: pattern.code },
      update: {
        commercialName: pattern.name,
        status: "active",
        stockCriticality: pattern.criticality,
        stockCoverageDays: pattern.key === "growing" ? 45 : null,
        minimumStock: pattern.key === "growing" ? 30 : 5
      },
      create: {
        id: `qa-product-${pattern.key}`,
        internalCode: pattern.code,
        commercialName: pattern.name,
        genericName: pattern.name,
        type: "medicine",
        categoryId: category.id,
        baseUnitId: baseUnit.id,
        supplierId: supplier.id,
        isMedicine: true,
        isInventoryTracked: true,
        requiresBatch: true,
        requiresExpiration: true,
        minimumStock: pattern.key === "growing" ? 30 : 5,
        stockCriticality: pattern.criticality,
        stockCoverageDays: pattern.key === "growing" ? 45 : null,
        salePrice: 12,
        status: "active"
      }
    });
    const presentation = await prisma.productUnit.upsert({
      where: { productId_unitId: { productId: product.id, unitId: boxUnit.id } },
      update: { conversionFactor: 10 },
      create: {
        id: `qa-presentation-${pattern.key}`,
        productId: product.id,
        unitId: boxUnit.id,
        conversionFactor: 10
      }
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { preferredRestockUnitId: presentation.id }
    });

    const receivedItem = await prisma.purchaseItem.upsert({
      where: { id: `qa-received-item-${pattern.key}` },
      update: {},
      create: {
        id: `qa-received-item-${pattern.key}`,
        purchaseId: receivedPurchase.id,
        productId: product.id,
        unitId: baseUnit.id,
        quantity: 20,
        unitCost: 2,
        conversionFactor: 1,
        baseQuantity: 20,
        baseUnitCost: 2,
        lineTotal: 40,
        isInventoryTracked: true,
        batchNumber: `QA-${pattern.key.toUpperCase()}`,
        expirationDate: pattern.key === "growing" ? date(10) : date(180)
      }
    });
    const availableQuantity = pattern.key === "growing" ? 4 : pattern.key === "no-sales" ? 50 : 12;
    const batch = await prisma.inventoryBatch.upsert({
      where: { purchaseItemId: receivedItem.id },
      update: {
        availableQuantity,
        expirationDate: pattern.key === "growing" ? date(10) : date(180),
        status: "active"
      },
      create: {
        id: `qa-batch-${pattern.key}`,
        purchaseItemId: receivedItem.id,
        productId: product.id,
        originalQuantity: 20,
        availableQuantity,
        baseUnitCost: 2,
        batchNumber: `QA-${pattern.key.toUpperCase()}`,
        expirationDate: pattern.key === "growing" ? date(10) : date(180),
        status: "active"
      }
    });

    if (pattern.key === "growing") {
      await prisma.purchaseItem.upsert({
        where: { id: "qa-draft-item-growing" },
        update: {},
        create: {
          id: "qa-draft-item-growing",
          purchaseId: draftPurchase.id,
          productId: product.id,
          unitId: boxUnit.id,
          quantity: 4,
          unitCost: 20,
          conversionFactor: 10,
          baseQuantity: 40,
          baseUnitCost: 2,
          lineTotal: 80,
          isInventoryTracked: true
        }
      });
    }

    for (const offset of [-2, -1, 0]) {
      const snapshot = await prisma.inventorySnapshot.upsert({
        where: { localDate: date(offset) },
        update: {},
        create: {
          id: `qa-snapshot-${offset + 2}`,
          localDate: date(offset),
          source: offset === -2 ? "reconstructed" : "captured",
          capturedAt: new Date(date(offset).getTime() + 6 * 60 * 60 * 1000)
        }
      });
      if (!await prisma.inventorySnapshotLine.findUnique({
        where: { snapshotId_batchId: { snapshotId: snapshot.id, batchId: batch.id } }
      })) {
        await prisma.inventorySnapshotLine.create({
          data: {
          snapshotId: snapshot.id,
          productId: product.id,
          batchId: batch.id,
          batchNumber: `QA-${pattern.key.toUpperCase()}`,
          expirationDate: pattern.key === "growing" ? date(10) : date(180),
          batchStatus: "active",
          availableQuantity: availableQuantity + Math.abs(offset) * 2
          }
        });
      }
    }

    const targetExecutions = pattern.key === "isolated"
      ? [previousExecution]
      : [previousExecution, currentExecution];
    for (const [index, execution] of targetExecutions.entries()) {
      const central = pattern.demand * (index === targetExecutions.length - 1 ? 1 : 0.8);
      const horizon = pattern.key === "growing" ? 45 : 35;
      const centralDemand = central * horizon;
      const suggestedQuantity = Math.max(0, Math.ceil((centralDemand + 10 - availableQuantity) / 10) * 10);
      let forecast = await prisma.stockPlanningForecast.findUnique({
        where: { executionId_productId: { executionId: execution.id, productId: product.id } }
      });
      forecast ??= await prisma.stockPlanningForecast.create({
        data: {
          id: `qa-forecast-${pattern.key}-${execution.id}`,
          executionId: execution.id,
          productId: product.id,
          maturity: pattern.maturity,
          confidence: pattern.confidence,
          model: pattern.model,
          historyStartDate: date(-83),
          historyEndDate: today,
          historyDays: 84,
          demandDays: pattern.key === "no-sales" ? 0 : pattern.key === "censored" ? 8 : 40,
          censoredDays: pattern.key === "censored" ? 20 : 0,
          forecastDays: horizon,
          parameters: { qaPattern: pattern.key, alpha: 0.3 },
          metrics: { scaledError: 0.7, meanAbsoluteError: 1.1, bias: pattern.key === "growing" ? 0.4 : 0, evaluatedPoints: 28 },
          bias: pattern.key === "growing" ? 0.4 : 0,
          fingerprint: `qa-${pattern.key}-${execution.id}`,
          engineVersion: "qa-engine-1",
          rulesVersion: "qa-rules-1",
          warnings: pattern.key === "censored" ? ["censored_history"] : [],
          recommendation: pattern.maturity === "no_history" ? undefined : {
            centralDemand,
            demandQuantile: centralDemand + 10,
            safetyStock: 10,
            targetStock: centralDemand + 10,
            usableStock: availableQuantity,
            expiryRiskStock: pattern.key === "growing" ? availableQuantity : 0,
            unusableStock: 0,
            unroundedSuggestion: Math.max(0, centralDemand + 10 - availableQuantity),
            suggestedQuantity,
            wasRounded: suggestedQuantity % 10 === 0,
            serviceLevel: pattern.criticality === "critical" ? 0.99 : pattern.criticality === "high" ? 0.95 : 0.9,
            criticality: pattern.criticality,
            preferredPresentation: {
              id: presentation.id,
              unitId: boxUnit.id,
              name: boxUnit.name,
              abbreviation: boxUnit.abbreviation,
              conversionFactor: 10
            },
            draftPurchaseQuantity: pattern.key === "growing" ? 40 : 0,
            draftPurchaseCount: pattern.key === "growing" ? 1 : 0,
            estimatedBaseUnitCost: 2,
            estimatedCost: suggestedQuantity * 2
          }
        }
      });
      if (await prisma.stockPlanningDemandPoint.count({ where: { forecastId: forecast.id } }) === 0) {
        await prisma.stockPlanningDemandPoint.createMany({
        data: Array.from({ length: 84 }, (_, pointIndex) => {
          const offset = pointIndex - 83;
          const weekdaySpike = pattern.key === "weekly" && pointIndex % 7 === 1 ? 8 : 0;
          const intermittent = pattern.key === "intermittent" && pointIndex % 9 !== 0 ? 0 : pattern.demand * 4;
          const growth = pattern.key === "growing" ? pointIndex / 14 : 0;
          const grossDemand = pattern.key === "no-sales" ? 0
            : pattern.key === "intermittent" ? intermittent
            : Math.max(0, pattern.demand + weekdaySpike + growth);
          return {
            forecastId: forecast.id,
            localDate: date(offset),
            grossDemand,
            returnedQuantity: 0,
            netDemand: grossDemand,
            censored: pattern.key === "censored" && pointIndex % 4 === 0
          };
        })
        });
      }
      if (await prisma.stockPlanningForecastPoint.count({ where: { forecastId: forecast.id } }) === 0) {
        await prisma.stockPlanningForecastPoint.createMany({
        data: Array.from({ length: horizon }, (_, pointIndex) => ({
          forecastId: forecast.id,
          localDate: date(pointIndex + 1),
          central: central + (pattern.key === "growing" ? pointIndex * 0.15 : 0),
          lower80: Math.max(0, central * 0.65),
          upper80: central * 1.4 + (pattern.key === "growing" ? pointIndex * 0.2 : 0)
        }))
        });
      }
    }
  }

  if (!await prisma.stockPlanningExecution.findUnique({
    where: { idempotencyKey: "qa-later-global-failure" }
  })) {
    await prisma.stockPlanningExecution.create({
      data: {
      id: "qa-execution-later-failure",
      idempotencyKey: "qa-later-global-failure",
      configurationId: currentExecution.configurationId,
      configurationSnapshot: currentExecution.configurationSnapshot,
      trigger: "scheduled",
      status: "failed",
      scheduledFor: new Date("2026-07-23T23:55:00.000Z"),
      demandCutoffDate: today,
      stockCapturedAt: new Date("2026-07-23T23:55:00.000Z"),
      engineVersion: "qa-engine-1",
      fingerprint: "qa-later-global-failure",
      startedAt: new Date("2026-07-23T23:55:00.000Z"),
      completedAt: new Date("2026-07-23T23:55:01.000Z"),
      durationMs: 1000,
      globalError: "Fallo QA posterior: el último resultado exitoso se conserva.",
      warnings: []
      }
    });
  }

  console.log(JSON.stringify({
    currentExecutionId: currentExecution.id,
    previousExecutionId: previousExecution.id,
    products: patterns.map((pattern) => `qa-product-${pattern.key}`)
  }, null, 2));
}

main()
  .finally(async () => prisma.$disconnect());
