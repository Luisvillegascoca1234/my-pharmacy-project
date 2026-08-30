import type { Prisma, PrismaClient } from "@prisma/client";
import {
  generateSyntheticForecastScenarios,
  type SyntheticScenario,
  type SyntheticScenarioKind
} from "../modules/stock-planning/forecasting/synthetic-scenarios.js";

const PREDICTION_PREFIX = "PRED-";
const SCENARIO_KINDS: SyntheticScenarioKind[] = [
  "stable",
  "weekly",
  "intermittent",
  "growing",
  "no_demand",
  "stockout",
  "outbreak"
];

type PlannedBatch = {
  id: string;
  batchNumber: string;
  receivedDate: string;
  originalQuantity: number;
  availableQuantity: number;
  expirationDate: Date;
  status: "active" | "depleted";
};

type PlannedConsumption = {
  batchId: string;
  quantity: number;
};

type PlannedDay = {
  date: string;
  observedDemand: number;
  censored: boolean;
  consumptions: PlannedConsumption[];
  snapshots: Array<{
    batchId: string;
    batchNumber: string;
    availableQuantity: number;
    status: "active" | "depleted";
    expirationDate: Date;
  }>;
};

export type PredictionSeedScenarioPlan = {
  kind: SyntheticScenarioKind;
  productId: string;
  productUnitId: string;
  internalCode: string;
  commercialName: string;
  minimumStock: number;
  coverageDays: number;
  criticality: "normal" | "high" | "critical";
  batches: PlannedBatch[];
  days: PlannedDay[];
};

export type PredictionSeedPlan = {
  asOf: string;
  seed: number;
  historyStart: string;
  historyEnd: string;
  scenarios: PredictionSeedScenarioPlan[];
};

export type PredictionSeedOptions = {
  asOf: string;
  seed: number;
};

export function parsePredictionSeedArguments(argumentsList: string[]): PredictionSeedOptions {
  const asOf = readArgument(argumentsList, "--as-of");
  const seedText = readArgument(argumentsList, "--seed");
  if (!asOf) {
    throw new Error("The required --as-of=YYYY-MM-DD argument is missing.");
  }
  assertCalendarDate(asOf, "--as-of");
  if (!seedText) {
    throw new Error("The required --seed=<integer> argument is missing.");
  }
  const seed = Number(seedText);
  if (!Number.isSafeInteger(seed)) {
    throw new Error("--seed must be a safe integer.");
  }
  return { asOf, seed };
}

export function buildPredictionSeedPlan(options: PredictionSeedOptions): PredictionSeedPlan {
  assertCalendarDate(options.asOf, "--as-of");
  if (!Number.isSafeInteger(options.seed)) {
    throw new Error("Prediction seed must be a safe integer.");
  }
  const historyEnd = addCalendarDays(options.asOf, -1);
  const generated = generateSyntheticForecastScenarios({
    profile: "small",
    seed: options.seed,
    endDate: historyEnd
  });
  const scenarios = SCENARIO_KINDS.map((kind) => {
    const source = generated.find((scenario) => scenario.kind === kind);
    if (!source) {
      throw new Error(`Synthetic scenario ${kind} was not generated.`);
    }
    return buildScenarioPlan(source, options.asOf);
  });
  return {
    asOf: options.asOf,
    seed: options.seed,
    historyStart: scenarios[0]!.days[0]!.date,
    historyEnd,
    scenarios
  };
}

export async function seedStockPlanningPrediction(
  client: PrismaClient,
  options: PredictionSeedOptions
) {
  const plan = buildPredictionSeedPlan(options);
  const summary = await client.$transaction(
    async (tx) => persistPredictionSeed(tx, plan),
    { maxWait: 10_000, timeout: 120_000 }
  );
  return { plan, summary };
}

async function persistPredictionSeed(tx: Prisma.TransactionClient, plan: PredictionSeedPlan) {
  const [baseUnit, category, supplier, superadmin, seller] = await Promise.all([
    tx.unit.findUnique({ where: { abbreviation: "UND" } }),
    tx.productCategory.findFirst({ orderBy: { createdAt: "asc" } }),
    tx.supplier.findFirst({ orderBy: { createdAt: "asc" } }),
    tx.user.findUnique({ where: { email: "admin@admin.com" } }),
    tx.user.findUnique({ where: { email: "vendedor@farmacia.local" } })
  ]);
  if (!baseUnit || !category || !supplier || !superadmin || !seller) {
    throw new Error("The base seed must run before the stock-planning prediction seed.");
  }

  const existingPredictionProducts = await tx.product.count({
    where: { internalCode: { startsWith: PREDICTION_PREFIX } }
  });
  if (existingPredictionProducts > 0) {
    throw new Error("Prediction products already exist. Run the destructive reset command first.");
  }

  await tx.product.createMany({
    data: plan.scenarios.map((scenario) => ({
      id: scenario.productId,
      internalCode: scenario.internalCode,
      commercialName: scenario.commercialName,
      genericName: `Patrón sintético ${scenario.kind}`,
      description: "Producto farmacéutico ficticio para validación manual del motor predictivo.",
      type: "medicine",
      categoryId: category.id,
      baseUnitId: baseUnit.id,
      supplierId: supplier.id,
      laboratoryName: "Laboratorio Predictivo Demo",
      sanitaryRegistration: `PRED-${scenario.kind.toUpperCase()}`,
      isMedicine: true,
      isOverTheCounter: true,
      isInventoryTracked: true,
      requiresBatch: true,
      requiresExpiration: true,
      minimumStock: scenario.minimumStock,
      stockCriticality: scenario.criticality,
      stockCoverageDays: scenario.coverageDays,
      salePrice: 10,
      status: "active",
      createdAt: atUtc(scenario.days[0]!.date, 6),
      updatedAt: atUtc(plan.asOf, 12)
    }))
  });
  await tx.productUnit.createMany({
    data: plan.scenarios.map((scenario) => ({
      id: scenario.productUnitId,
      productId: scenario.productId,
      unitId: baseUnit.id,
      conversionFactor: 1,
      createdAt: atUtc(scenario.days[0]!.date, 6),
      updatedAt: atUtc(plan.asOf, 12)
    }))
  });
  for (const scenario of plan.scenarios) {
    await tx.product.update({
      where: { id: scenario.productId },
      data: { preferredRestockUnitId: scenario.productUnitId }
    });
  }

  for (const scenario of plan.scenarios) {
    for (const [batchIndex, batch] of scenario.batches.entries()) {
      const purchaseId = `prediction-purchase-${scenario.kind}-${batchIndex + 1}`;
      const purchaseItemId = `prediction-purchase-item-${scenario.kind}-${batchIndex + 1}`;
      const receivedAt = atUtc(batch.receivedDate, 8);
      await tx.purchase.create({
        data: {
          id: purchaseId,
          supplierId: supplier.id,
          purchaseDate: dateOnly(batch.receivedDate),
          status: "received",
          totalAmount: money(batch.originalQuantity * 4),
          createdByUserId: superadmin.id,
          receivedByUserId: superadmin.id,
          receivedAt,
          notes: "Recepción sintética para el escenario predictivo.",
          receiveNotes: "Lote disponible para ventas históricas deterministas.",
          createdAt: receivedAt,
          updatedAt: receivedAt,
          items: {
            create: {
              id: purchaseItemId,
              productId: scenario.productId,
              unitId: baseUnit.id,
              quantity: batch.originalQuantity,
              unitCost: 4,
              conversionFactor: 1,
              baseQuantity: batch.originalQuantity,
              baseUnitCost: 4,
              lineTotal: money(batch.originalQuantity * 4),
              isInventoryTracked: true,
              batchNumber: batch.batchNumber,
              expirationDate: batch.expirationDate,
              createdAt: receivedAt,
              updatedAt: receivedAt
            }
          }
        }
      });
      await tx.inventoryBatch.create({
        data: {
          id: batch.id,
          purchaseItemId,
          productId: scenario.productId,
          originalQuantity: batch.originalQuantity,
          availableQuantity: batch.availableQuantity,
          baseUnitCost: 4,
          batchNumber: batch.batchNumber,
          expirationDate: batch.expirationDate,
          status: batch.status,
          createdAt: receivedAt,
          updatedAt: atUtc(plan.asOf, 12)
        }
      });
      await tx.inventoryMovement.create({
        data: {
          id: `prediction-movement-receipt-${scenario.kind}-${batchIndex + 1}`,
          batchId: batch.id,
          productId: scenario.productId,
          type: "purchase_received",
          quantityBase: batch.originalQuantity,
          unitCostBase: 4,
          referenceType: "purchase",
          referenceId: purchaseId,
          referenceItemId: purchaseItemId,
          actorUserId: superadmin.id,
          reason: "Recepción determinista del seed predictivo.",
          createdAt: receivedAt
        }
      });
    }
  }

  const saleDays = plan.scenarios[0]!.days.map((day) => day.date).filter((date) =>
    plan.scenarios.some((scenario) =>
      scenario.days.find((day) => day.date === date)!.observedDemand > 0
    )
  );
  const [cashSessionCorrelative, saleCorrelative] = await Promise.all([
    tx.cashSession.aggregate({ _max: { correlativeNumber: true } }),
    tx.sale.aggregate({ _max: { correlativeNumber: true } })
  ]);
  const cashSessionCorrelativeNumber = (cashSessionCorrelative._max.correlativeNumber ?? 0) + 1;
  const firstSaleCorrelativeNumber = (saleCorrelative._max.correlativeNumber ?? 0) + 1;
  const cashSessionId = "prediction-cash-session";
  const totalSalesAmount = saleDays.reduce((total, date) =>
    total + plan.scenarios.reduce((dayTotal, scenario) =>
      dayTotal + scenario.days.find((day) => day.date === date)!.observedDemand * 10, 0), 0
  );
  await tx.cashSession.create({
    data: {
      id: cashSessionId,
      correlativeNumber: cashSessionCorrelativeNumber,
      correlativeCode: `CAJ-PRED-${String(cashSessionCorrelativeNumber).padStart(6, "0")}`,
      openedByUserId: seller.id,
      closedByUserId: seller.id,
      initialAmount: 0,
      countedAmount: money(totalSalesAmount),
      expectedAmount: money(totalSalesAmount),
      differenceAmount: 0,
      status: "closed",
      openingNote: "Caja histórica del seed predictivo.",
      closingNote: "Cierre automático del historial sintético.",
      openedAt: atUtc(plan.historyStart, 7),
      closedAt: atUtc(plan.historyEnd, 22),
      createdAt: atUtc(plan.historyStart, 7),
      updatedAt: atUtc(plan.historyEnd, 22)
    }
  });

  for (const [saleIndex, date] of saleDays.entries()) {
    const saleCorrelativeNumber = firstSaleCorrelativeNumber + saleIndex;
    const saleId = `prediction-sale-${date}`;
    const dayEntries = plan.scenarios
      .map((scenario) => ({ scenario, day: scenario.days.find((day) => day.date === date)! }))
      .filter(({ day }) => day.observedDemand > 0);
    const totalAmount = dayEntries.reduce((sum, entry) => sum + entry.day.observedDemand * 10, 0);
    const totalCost = dayEntries.reduce((sum, entry) => sum + entry.day.observedDemand * 4, 0);
    const confirmedAt = atUtc(date, 16);
    await tx.sale.create({
      data: {
        id: saleId,
        idempotencyKey: `prediction-${date}`,
        correlativeNumber: saleCorrelativeNumber,
        correlativeCode: `VTA-PRED-${String(saleCorrelativeNumber).padStart(6, "0")}`,
        sellerUserId: seller.id,
        cashSessionId,
        status: "confirmed",
        totalAmount: money(totalAmount),
        totalCost: money(totalCost),
        totalMargin: money(totalAmount - totalCost),
        confirmedAt,
        createdAt: confirmedAt,
        updatedAt: confirmedAt
      }
    });
    for (const { scenario, day } of dayEntries) {
      const saleItemId = `prediction-sale-item-${date}-${scenario.kind}`;
      await tx.saleItem.create({
        data: {
          id: saleItemId,
          saleId,
          productId: scenario.productId,
          internalCode: scenario.internalCode,
          commercialName: scenario.commercialName,
          genericName: `Patrón sintético ${scenario.kind}`,
          baseUnitId: baseUnit.id,
          baseUnitName: baseUnit.name,
          baseUnitAbbreviation: baseUnit.abbreviation,
          unitPrice: 10,
          quantity: day.observedDemand,
          subtotal: money(day.observedDemand * 10),
          totalCost: money(day.observedDemand * 4),
          margin: money(day.observedDemand * 6),
          createdAt: confirmedAt,
          updatedAt: confirmedAt
        }
      });
      for (const [consumptionIndex, consumption] of day.consumptions.entries()) {
        const movementId = `prediction-movement-sale-${date}-${scenario.kind}-${consumptionIndex + 1}`;
        await tx.inventoryMovement.create({
          data: {
            id: movementId,
            batchId: consumption.batchId,
            productId: scenario.productId,
            type: "sale_confirmed",
            quantityBase: -consumption.quantity,
            unitCostBase: 4,
            referenceType: "sale",
            referenceId: saleId,
            referenceItemId: saleItemId,
            actorUserId: seller.id,
            reason: "Consumo FEFO del seed predictivo.",
            createdAt: confirmedAt
          }
        });
        await tx.saleItemBatch.create({
          data: {
            id: `prediction-consumption-${date}-${scenario.kind}-${consumptionIndex + 1}`,
            saleItemId,
            batchId: consumption.batchId,
            quantity: consumption.quantity,
            unitCostBase: 4,
            totalCost: money(consumption.quantity * 4),
            inventoryMovementId: movementId,
            createdAt: confirmedAt,
            updatedAt: confirmedAt
          }
        });
      }
    }
    await tx.payment.create({
      data: {
        id: `prediction-payment-${date}`,
        saleId,
        cashSessionId,
        method: "cash",
        saleTotal: money(totalAmount),
        receivedAmount: money(totalAmount),
        changeAmount: 0,
        status: "paid",
        paidAt: confirmedAt,
        createdAt: confirmedAt,
        updatedAt: confirmedAt
      }
    });
  }

  for (const date of plan.scenarios[0]!.days.map((day) => day.date)) {
    const snapshotId = `prediction-snapshot-${date}`;
    await tx.inventorySnapshot.create({
      data: {
        id: snapshotId,
        localDate: dateOnly(date),
        source: "captured",
        capturedAt: atUtc(date, 23),
        createdAt: atUtc(date, 23)
      }
    });
    const lines = plan.scenarios.flatMap((scenario) => {
      const day = scenario.days.find((candidate) => candidate.date === date)!;
      return day.snapshots.map((snapshot) => ({
        id: `prediction-snapshot-line-${date}-${snapshot.batchId}`,
        snapshotId,
        productId: scenario.productId,
        batchId: snapshot.batchId,
        batchNumber: snapshot.batchNumber,
        expirationDate: snapshot.expirationDate,
        batchStatus: snapshot.status,
        availableQuantity: snapshot.availableQuantity
      }));
    });
    if (lines.length > 0) {
      await tx.inventorySnapshotLine.createMany({ data: lines });
    }
  }

  const latestConfiguration = await tx.stockPlanningConfiguration.findFirst({
    orderBy: { version: "desc" }
  });
  await tx.stockPlanningConfiguration.create({
    data: {
      version: (latestConfiguration?.version ?? 0) + 1,
      engineEnabled: false,
      frequency: "daily",
      weekday: null,
      localTime: "02:00",
      timezone: "America/La_Paz",
      coverageDays: 30,
      normalServiceLevel: 0.9,
      highServiceLevel: 0.95,
      criticalServiceLevel: 0.99,
      minimumHistoryWeeks: 12,
      minimumDemandDays: 4,
      operationalDemandDays: 12,
      createdByUserId: superadmin.id,
      createdAt: atUtc(plan.asOf, 1)
    }
  });

  return validatePersistedPredictionSeed(tx, plan);
}

async function validatePersistedPredictionSeed(
  tx: Prisma.TransactionClient,
  plan: PredictionSeedPlan
) {
  const [products, executions, forecasts, snapshots, latestConfiguration] = await Promise.all([
    tx.product.findMany({
      where: { internalCode: { startsWith: PREDICTION_PREFIX } },
      select: {
        id: true,
        internalCode: true,
        inventoryBatches: {
          select: {
            originalQuantity: true,
            availableQuantity: true,
            movements: { select: { quantityBase: true } }
          }
        },
        saleItems: {
          select: { consumptions: { select: { quantity: true, inventoryMovementId: true } } }
        }
      },
      orderBy: { internalCode: "asc" }
    }),
    tx.stockPlanningExecution.count(),
    tx.stockPlanningForecast.count(),
    tx.inventorySnapshot.count({
      where: {
        localDate: {
          gte: dateOnly(plan.historyStart),
          lte: dateOnly(plan.historyEnd)
        }
      }
    }),
    tx.stockPlanningConfiguration.findFirst({ orderBy: { version: "desc" } })
  ]);
  if (products.length !== SCENARIO_KINDS.length) {
    throw new Error(`Prediction seed expected 7 products and persisted ${products.length}.`);
  }
  if (executions !== 0 || forecasts !== 0) {
    throw new Error("Prediction seed must not persist executions or forecasts.");
  }
  if (snapshots !== plan.scenarios[0]!.days.length) {
    throw new Error(`Prediction seed expected ${plan.scenarios[0]!.days.length} snapshots and persisted ${snapshots}.`);
  }
  if (latestConfiguration?.engineEnabled !== false) {
    throw new Error("Prediction seed must leave the automatic engine disabled.");
  }
  for (const product of products) {
    const expected = plan.scenarios.find((scenario) => scenario.productId === product.id)!;
    const observedDemand = product.saleItems.reduce(
      (total, item) => total + item.consumptions.reduce((sum, value) => sum + value.quantity.toNumber(), 0),
      0
    );
    const expectedDemand = expected.days.reduce((total, day) => total + day.observedDemand, 0);
    if (observedDemand !== expectedDemand) {
      throw new Error(`${product.internalCode} demand does not match its deterministic scenario.`);
    }
    if (product.saleItems.some((item) =>
      item.consumptions.some((consumption) => !consumption.inventoryMovementId)
    )) {
      throw new Error(`${product.internalCode} has a consumption without an inventory movement.`);
    }
    for (const batch of product.inventoryBatches) {
      const ledgerQuantity = batch.movements.reduce(
        (sum, movement) => sum + movement.quantityBase.toNumber(),
        0
      );
      if (ledgerQuantity !== batch.availableQuantity.toNumber() ||
        batch.originalQuantity.toNumber() < batch.availableQuantity.toNumber()) {
        throw new Error(`${product.internalCode} inventory ledger is inconsistent.`);
      }
    }
  }
  return {
    asOf: plan.asOf,
    seed: plan.seed,
    historyStart: plan.historyStart,
    historyEnd: plan.historyEnd,
    predictionProducts: products.length,
    historyDays: plan.scenarios[0]!.days.length,
    snapshots,
    executions,
    forecasts,
    engineEnabled: latestConfiguration.engineEnabled,
    scenarios: plan.scenarios.map((scenario) => ({
      code: scenario.internalCode,
      kind: scenario.kind,
      observedDemand: scenario.days.reduce((sum, day) => sum + day.observedDemand, 0),
      censoredDays: scenario.days.filter((day) => day.censored).length,
      batches: scenario.batches.length,
      availableQuantity: scenario.batches.reduce((sum, batch) => sum + batch.availableQuantity, 0)
    }))
  };
}

function buildScenarioPlan(source: SyntheticScenario, asOf: string): PredictionSeedScenarioPlan {
  const kind = source.kind;
  const productId = `prediction-product-${kind}`;
  const expirationDate = dateOnly(addCalendarDays(asOf, 730));
  const totalDemand = source.knownTruth.reduce((sum, day) => sum + day.observedDemand, 0);
  const buffer = Math.max(30, Math.ceil(totalDemand / source.knownTruth.length * 30));
  const receiptPlans = kind === "stockout"
    ? buildStockoutReceipts(source, buffer)
    : [{
        receivedDate: source.knownTruth[0]!.date,
        quantity: totalDemand + buffer
      }];
  const batches: PlannedBatch[] = receiptPlans.map((receipt, index) => ({
    id: `prediction-batch-${kind}-${index + 1}`,
    batchNumber: `PRED-${kind.toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
    receivedDate: receipt.receivedDate,
    originalQuantity: receipt.quantity,
    availableQuantity: receipt.quantity,
    expirationDate,
    status: "active"
  }));
  const balances = new Map(batches.map((batch) => [batch.id, 0]));
  const days = source.knownTruth.map((truth) => {
    for (const batch of batches.filter((candidate) => candidate.receivedDate === truth.date)) {
      balances.set(batch.id, batch.originalQuantity);
    }
    let remaining = truth.observedDemand;
    const consumptions: PlannedConsumption[] = [];
    for (const batch of batches
      .filter((candidate) => candidate.receivedDate <= truth.date)
      .sort((left, right) =>
        left.expirationDate.getTime() - right.expirationDate.getTime() ||
        left.receivedDate.localeCompare(right.receivedDate)
      )) {
      if (remaining === 0) break;
      const available = balances.get(batch.id) ?? 0;
      const quantity = Math.min(available, remaining);
      if (quantity > 0) {
        balances.set(batch.id, available - quantity);
        consumptions.push({ batchId: batch.id, quantity });
        remaining -= quantity;
      }
    }
    if (remaining > 0) {
      throw new Error(`${kind} cannot satisfy demand on ${truth.date} using FEFO.`);
    }
    return {
      date: truth.date,
      observedDemand: truth.observedDemand,
      censored: truth.censored,
      consumptions,
      snapshots: batches
        .filter((batch) => batch.receivedDate <= truth.date)
        .map((batch) => {
          const availableQuantity = balances.get(batch.id) ?? 0;
          return {
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            availableQuantity,
            status: availableQuantity > 0 ? "active" as const : "depleted" as const,
            expirationDate: batch.expirationDate
          };
        })
    };
  });
  for (const batch of batches) {
    batch.availableQuantity = balances.get(batch.id) ?? 0;
    batch.status = batch.availableQuantity > 0 ? "active" : "depleted";
  }
  return {
    kind,
    productId,
    productUnitId: `prediction-product-unit-${kind}`,
    internalCode: `${PREDICTION_PREFIX}${kind.toUpperCase().replace("_", "-")}`,
    commercialName: `Producto predictivo ${displayKind(kind)}`,
    minimumStock: kind === "no_demand" ? 0 : kind === "stockout" ? 80 : 40,
    coverageDays: kind === "growing" || kind === "outbreak" ? 45 : 30,
    criticality: kind === "stockout" ? "critical" : kind === "growing" || kind === "outbreak" ? "high" : "normal",
    batches,
    days
  };
}

function buildStockoutReceipts(source: SyntheticScenario, finalBuffer: number) {
  const receipts: Array<{ receivedDate: string; quantity: number }> = [];
  let index = 0;
  while (index < source.knownTruth.length) {
    while (index < source.knownTruth.length && source.knownTruth[index]!.censored) index += 1;
    if (index >= source.knownTruth.length) break;
    const start = index;
    let quantity = 0;
    while (index < source.knownTruth.length && !source.knownTruth[index]!.censored) {
      quantity += source.knownTruth[index]!.observedDemand;
      index += 1;
    }
    if (index === source.knownTruth.length) quantity += finalBuffer;
    receipts.push({
      receivedDate: source.knownTruth[start]!.date,
      quantity
    });
  }
  return receipts;
}

function displayKind(kind: SyntheticScenarioKind) {
  return {
    stable: "estable",
    weekly: "semanal",
    intermittent: "intermitente",
    growing: "creciente",
    no_demand: "sin demanda",
    stockout: "con quiebres",
    outbreak: "con brote"
  }[kind];
}

function readArgument(argumentsList: string[], name: string) {
  const inline = argumentsList.find((value) => value.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = argumentsList.indexOf(name);
  return index >= 0 ? argumentsList[index + 1] : undefined;
}

function assertCalendarDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    dateOnly(value).toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} must be a valid YYYY-MM-DD calendar date.`);
  }
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function atUtc(value: string, hour: number) {
  return new Date(`${value}T${String(hour).padStart(2, "0")}:00:00.000Z`);
}

function addCalendarDays(value: string, days: number) {
  const date = dateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
