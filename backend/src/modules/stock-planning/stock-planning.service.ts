import type {
  StockPlanningAlert,
  StockPlanningProduct,
  StockPlanningProductsQuery,
  StockPlanningProductsResponse,
  StockPlanningRisk,
  UpdateProductStockConfiguration
} from "@pharmacy-pos/shared";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { HttpError } from "../../common/http/http-error.js";
import { StockPlanningRepository } from "./stock-planning.repository.js";
import type {
  ProductStockConfigurationUpdate,
  StockPlanningAuditContext,
  StockPlanningFilters,
  StockPlanningProductRecord
} from "./stock-planning.types.js";
import { calculateReplenishment } from "./replenishment-engine.js";

export const INITIAL_STOCK_COVERAGE_DAYS = 30;
export const STOCK_PLANNING_TIMEZONE = "America/La_Paz" as const;

const ForecastMetricsSchema = z.object({
  scaledError: z.number().nonnegative(),
  meanAbsoluteError: z.number().nonnegative(),
  bias: z.number(),
  evaluatedPoints: z.number().int().nonnegative()
});

const ForecastParametersSchema = z.record(z.union([z.string(), z.number(), z.boolean()]));

const PersistedRecommendationSchema = z.object({
  centralDemand: z.number().nonnegative(),
  demandQuantile: z.number().nonnegative(),
  safetyStock: z.number().nonnegative(),
  targetStock: z.number().nonnegative(),
  usableStock: z.number().nonnegative(),
  expiryRiskStock: z.number().nonnegative(),
  unusableStock: z.number().nonnegative(),
  unroundedSuggestion: z.number().nonnegative(),
  suggestedQuantity: z.number().nonnegative(),
  wasRounded: z.boolean(),
  serviceLevel: z.number().gt(0).lt(1),
  criticality: z.enum(["normal", "high", "critical"]),
  draftPurchaseQuantity: z.number().nonnegative(),
  draftPurchaseCount: z.number().int().nonnegative(),
  preferredPresentation: z.object({
    id: z.string(),
    unitId: z.string(),
    name: z.string(),
    abbreviation: z.string(),
    conversionFactor: z.number().positive()
  }).nullish(),
  estimatedCost: z.number().nonnegative().nullish()
});

export type StockPlanningRepositoryPort = {
  listActiveProducts(filters: StockPlanningFilters, businessDate: Date): Promise<StockPlanningProductRecord[]>;
  findProductById(productId: string): Promise<{
    id: string;
    stockCriticality: "normal" | "high" | "critical";
    stockCoverageDays: number | null;
    preferredRestockUnitId: string | null;
  } | null>;
  findProductUnit(productId: string, productUnitId: string): Promise<{ id: string } | null>;
  updateProductConfiguration(
    productId: string,
    update: ProductStockConfigurationUpdate,
    previousConfiguration: ProductStockConfigurationUpdate,
    context: StockPlanningAuditContext
  ): Promise<unknown>;
};

export type StockPlanningConfigurationProvider = {
  getCurrentConfiguration(): Promise<{
    coverageDays: number;
    normalServiceLevel?: Prisma.Decimal | number;
    highServiceLevel?: Prisma.Decimal | number;
    criticalServiceLevel?: Prisma.Decimal | number;
  } | null>;
  getEngineState?(): Promise<{ stale: boolean }>;
};

export class StockPlanningService {
  constructor(
    private readonly repository: StockPlanningRepositoryPort = new StockPlanningRepository(),
    private readonly now: () => Date = () => new Date(),
    private readonly configurationProvider?: StockPlanningConfigurationProvider
  ) {}

  getGlobalConfiguration() {
    return {
      coverageDays: INITIAL_STOCK_COVERAGE_DAYS,
      timezone: STOCK_PLANNING_TIMEZONE
    };
  }

  async listProducts(query: StockPlanningProductsQuery): Promise<StockPlanningProductsResponse> {
    const [products, persistedConfiguration, engineState] = await Promise.all([
      this.repository.listActiveProducts(query, getBusinessDate(this.now())),
      this.configurationProvider?.getCurrentConfiguration(),
      this.configurationProvider?.getEngineState?.()
    ]);
    const coverageDays = persistedConfiguration?.coverageDays ?? INITIAL_STOCK_COVERAGE_DAYS;
    const serviceLevels = {
      normal: toNumber(persistedConfiguration?.normalServiceLevel, 0.9),
      high: toNumber(persistedConfiguration?.highServiceLevel, 0.95),
      critical: toNumber(persistedConfiguration?.criticalServiceLevel, 0.99)
    };
    const mappedProducts = products.map((product) =>
      toStockPlanningProduct(product, coverageDays, serviceLevels, engineState?.stale ?? false, getBusinessDateKey(this.now()))
    );
    const filteredProducts = mappedProducts.filter((product) => matchesComputedFilters(product, query));
    const summary = summarizeProducts(filteredProducts);

    return {
      configuration: {
        coverageDays,
        timezone: STOCK_PLANNING_TIMEZONE
      },
      data: filteredProducts,
      summary,
      groups: query.groupBy === "supplier" ? groupProductsBySupplier(filteredProducts) : undefined,
      alerts: deduplicateAlerts(filteredProducts.flatMap((product) => product.alerts ?? []))
    };
  }

  async updateProductConfiguration(
    productId: string,
    input: UpdateProductStockConfiguration,
    context: StockPlanningAuditContext
  ): Promise<StockPlanningProduct> {
    const product = await this.repository.findProductById(productId);

    if (!product) {
      throw new HttpError(404, "Product was not found.", "PRODUCT_NOT_FOUND");
    }

    if (input.preferredPresentationId) {
      const presentation = await this.repository.findProductUnit(productId, input.preferredPresentationId);

      if (!presentation) {
        throw new HttpError(
          400,
          "Preferred presentation must belong to the product.",
          "INVALID_PREFERRED_PRESENTATION"
        );
      }
    }

    const update: ProductStockConfigurationUpdate = {
      stockCriticality: input.criticality,
      stockCoverageDays: input.coverageDays,
      preferredRestockUnitId: input.preferredPresentationId
    };
    const previousConfiguration: ProductStockConfigurationUpdate = {
      stockCriticality: product.stockCriticality,
      stockCoverageDays: product.stockCoverageDays,
      preferredRestockUnitId: product.preferredRestockUnitId
    };

    await this.repository.updateProductConfiguration(productId, removeUndefined(update), previousConfiguration, context);

    const [products, persistedConfiguration] = await Promise.all([
      this.repository.listActiveProducts({}, getBusinessDate(this.now())),
      this.configurationProvider?.getCurrentConfiguration()
    ]);
    const updatedProduct = products.find((item) => item.id === productId);

    if (!updatedProduct) {
      throw new HttpError(404, "Active product was not found after update.", "PRODUCT_NOT_ACTIVE");
    }

    return toStockPlanningProduct(
      updatedProduct,
      persistedConfiguration?.coverageDays ?? INITIAL_STOCK_COVERAGE_DAYS,
      {
        normal: toNumber(persistedConfiguration?.normalServiceLevel, 0.9),
        high: toNumber(persistedConfiguration?.highServiceLevel, 0.95),
        critical: toNumber(persistedConfiguration?.criticalServiceLevel, 0.99)
      },
      false,
      getBusinessDateKey(this.now())
    );
  }
}

function toStockPlanningProduct(
  product: StockPlanningProductRecord,
  globalCoverageDays = INITIAL_STOCK_COVERAGE_DAYS,
  serviceLevels = { normal: 0.9, high: 0.95, critical: 0.99 },
  stale = false,
  businessDate = getBusinessDateKey(new Date())
): StockPlanningProduct {
  const currentUsableStock = product.inventoryBatches.reduce((total, batch) => {
    const eligible = batch.status === "active" &&
      (!batch.expirationDate || batch.expirationDate.toISOString().slice(0, 10) >= businessDate);
    return eligible ? total.plus(batch.availableQuantity) : total;
  }, new Prisma.Decimal(0));
  const unroundedDifference = product.minimumStock.minus(currentUsableStock);
  const unroundedReference = unroundedDifference.greaterThan(0)
    ? unroundedDifference
    : new Prisma.Decimal(0);
  const preferredRestockUnit = product.preferredRestockUnit;
  const preferredPresentation = preferredRestockUnit
    ? {
        id: preferredRestockUnit.id,
        unitId: preferredRestockUnit.unitId,
        name: preferredRestockUnit.unit.name,
        abbreviation: preferredRestockUnit.unit.abbreviation,
        conversionFactor: Number(preferredRestockUnit.conversionFactor)
      }
    : undefined;
  const quantityBase = preferredRestockUnit
    ? roundUpToMultiple(unroundedReference, preferredRestockUnit.conversionFactor)
    : unroundedReference;
  const forecast = product.stockPlanningForecasts?.[0];
  const forecastMetrics = forecast ? parseMetrics(forecast.metrics) : null;
  const publishedForecast = forecast && forecast.maturity !== "no_history" && forecastMetrics
    ? {
        executionId: forecast.executionId,
        model: forecast.model,
        historyDays: forecast.historyDays,
        demandDays: forecast.demandDays,
        censoredDays: forecast.censoredDays,
        centralDemand: forecast.forecastPoints.reduce((sum, point) => sum + point.central.toNumber(), 0),
        lower80: forecast.forecastPoints.reduce((sum, point) => sum + point.lower80.toNumber(), 0),
        upper80: forecast.forecastPoints.reduce((sum, point) => sum + point.upper80.toNumber(), 0),
        metrics: forecastMetrics,
        parameters: parseParameters(forecast.parameters),
        fingerprint: forecast.fingerprint,
        engineVersion: forecast.engineVersion,
        rulesVersion: forecast.rulesVersion,
        points: forecast.forecastPoints.map((point) => ({
          date: point.localDate.toISOString().slice(0, 10),
          central: point.central.toNumber(),
          lower80: point.lower80.toNumber(),
          upper80: point.upper80.toNumber()
        }))
      }
    : undefined;
  const forecastPoints = publishedForecast?.points ?? [];
  const serviceLevel = serviceLevels[product.stockCriticality];
  const persistedRecommendation = parseRecommendation(forecast?.recommendation);
  const forecastRecommendation = publishedForecast
    ? persistedRecommendation ?? calculateReplenishment({
        businessDate,
        minimumStock: forecast.maturity === "no_observed_demand" ? 0 : product.minimumStock.toNumber(),
        serviceLevel,
        forecast: forecastPoints,
        batches: product.inventoryBatches.map((batch) => ({
          id: batch.id,
          expirationDate: batch.expirationDate?.toISOString().slice(0, 10) ?? null,
          status: batch.status,
          availableQuantity: batch.availableQuantity.toNumber()
        })),
        presentationFactor: preferredRestockUnit?.conversionFactor.toNumber()
      })
    : null;
  const recommendationPresentation = persistedRecommendation
    ? persistedRecommendation.preferredPresentation
    : preferredPresentation;
  const estimatedCost = !forecastRecommendation
    ? undefined
    : persistedRecommendation
      ? persistedRecommendation.estimatedCost
      : product.purchaseContext.latestReliableBaseUnitCost
        ? money(
            forecastRecommendation.suggestedQuantity *
            product.purchaseContext.latestReliableBaseUnitCost.toNumber()
          )
        : undefined;
  const recommendationResult = forecastRecommendation
    ? {
        kind: "demand_forecast" as const,
        quantityBase: forecastRecommendation.suggestedQuantity,
        wasRounded: forecastRecommendation.wasRounded,
        ...(recommendationPresentation ? { preferredPresentation: recommendationPresentation } : {}),
        serviceLevel: persistedRecommendation?.serviceLevel ?? serviceLevel,
        centralDemand: forecastRecommendation.centralDemand,
        demandQuantile: forecastRecommendation.demandQuantile,
        safetyStock: forecastRecommendation.safetyStock,
        targetStock: forecastRecommendation.targetStock,
        ...(estimatedCost === undefined ? {} : { estimatedCost })
      }
    : {
        kind: "configured_reference" as const,
        quantityBase: quantityBase.toNumber(),
        wasRounded: quantityBase.greaterThan(unroundedReference),
        preferredPresentation
      };
  const usableStock = forecastRecommendation?.usableStock ?? currentUsableStock.toNumber();
  const expiryRiskStock = forecastRecommendation?.expiryRiskStock ?? 0;
  const unusableStock = forecastRecommendation?.unusableStock ??
    product.inventoryBatches.reduce((total, batch) => total + (
      batch.status !== "active" ||
      Boolean(batch.expirationDate && batch.expirationDate.toISOString().slice(0, 10) < businessDate)
        ? batch.availableQuantity.toNumber()
        : 0
    ), 0);
  const risks = buildRisks({
    criticality: persistedRecommendation?.criticality ?? product.stockCriticality,
    usableStock,
    centralDemand: forecastRecommendation?.centralDemand ?? 0,
    suggestedQuantity: recommendationResult.quantityBase,
    expiryRiskStock,
    stale
  });
  const executionId = forecast?.executionId ?? "cold-start";
  const alerts = buildRecommendationAlerts({
    executionId,
    productId: product.id,
    maturity: forecast?.maturity ?? "no_history",
    confidence: forecast?.confidence ?? "none",
    risks
  });

  return {
    productId: product.id,
    internalCode: product.internalCode,
    commercialName: product.commercialName,
    categoryId: product.category.id,
    categoryName: product.category.name,
    supplierId: product.supplier.id,
    supplierName: product.supplier.businessName,
    baseUnitAbbreviation: product.baseUnit.abbreviation,
    criticality: product.stockCriticality,
    coverage: {
      days: product.stockCoverageDays ?? globalCoverageDays,
      source: product.stockCoverageDays === null ? "global" : "product"
    },
    usableStock,
    expiryRiskStock,
    unusableStock,
    draftPurchaseQuantity: persistedRecommendation?.draftPurchaseQuantity ??
      product.purchaseContext.draftQuantity.toNumber(),
    draftPurchaseCount: persistedRecommendation?.draftPurchaseCount ??
      product.purchaseContext.draftCount,
    minimumStock: product.minimumStock.toNumber(),
    maturity: forecast?.maturity ?? "no_history",
    confidence: forecast?.confidence ?? "none",
    result: recommendationResult,
    forecast: publishedForecast,
    risks,
    alerts,
    warnings: [
      ...(recommendationPresentation ? [] : ["missing_preferred_presentation"]),
      ...((persistedRecommendation?.draftPurchaseCount ?? product.purchaseContext.draftCount) > 0
        ? ["draft_purchases_are_context_only"]
        : []),
      ...(forecastRecommendation &&
        (persistedRecommendation
          ? persistedRecommendation.estimatedCost === undefined
          : !product.purchaseContext.latestReliableBaseUnitCost)
        ? ["missing_reliable_purchase_cost"]
        : []),
      ...parseWarnings(forecast?.warnings)
    ]
  };
}

function parseMetrics(value: Prisma.JsonValue) {
  const parsed = ForecastMetricsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function parseParameters(value: Prisma.JsonValue) {
  const parsed = ForecastParametersSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

function parseWarnings(value: Prisma.JsonValue | undefined) {
  return Array.isArray(value) ? value.filter((warning): warning is string => typeof warning === "string") : [];
}

function parseRecommendation(value: Prisma.JsonValue | null | undefined) {
  const parsed = PersistedRecommendationSchema.safeParse(value);
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    preferredPresentation: parsed.data.preferredPresentation ?? undefined,
    estimatedCost: parsed.data.estimatedCost ?? undefined
  };
}

function buildRisks(input: {
  criticality: "normal" | "high" | "critical";
  usableStock: number;
  centralDemand: number;
  suggestedQuantity: number;
  expiryRiskStock: number;
  stale: boolean;
}): StockPlanningRisk[] {
  const risks: StockPlanningRisk[] = [];
  if (input.suggestedQuantity > 0) risks.push("replenishment");
  if (input.criticality === "critical" && input.centralDemand > input.usableStock) {
    risks.push("critical_stockout");
  }
  if (input.expiryRiskStock > 0) risks.push("expiry");
  if (input.stale) risks.push("stale");
  return risks;
}

function buildRecommendationAlerts(input: {
  executionId: string;
  productId: string;
  maturity: StockPlanningProduct["maturity"];
  confidence: NonNullable<StockPlanningProduct["confidence"]>;
  risks: StockPlanningRisk[];
}): StockPlanningAlert[] {
  const alerts: StockPlanningAlert[] = [];
  const add = (
    type: StockPlanningAlert["type"],
    priority: StockPlanningAlert["priority"],
    message: string
  ) => alerts.push({
    id: `${input.executionId}:${input.productId}:${type}`,
    executionId: input.executionId,
    productId: input.productId,
    type,
    priority,
    message
  });

  if (input.risks.includes("critical_stockout")) {
    add("critical_stockout", "critical", "El producto crítico podría agotarse durante el período de cobertura.");
  }
  if (input.risks.includes("replenishment")) {
    add("replenishment", "high", "El producto requiere reabastecimiento.");
  }
  if (input.risks.includes("stale")) {
    add("stale_calculation", "high", "El último cálculo de planificación de stock está desactualizado.");
  }
  if (input.risks.includes("expiry")) {
    add("expiry_risk", "medium", "Parte del stock podría vencer antes de su consumo proyectado.");
  }
  if (input.confidence === "low") {
    add("low_confidence", "medium", "El pronóstico tiene confianza baja.");
  }
  if (input.maturity === "no_history") {
    add("insufficient_history", "informational", "No existe historial suficiente para pronosticar la demanda.");
  }

  return alerts;
}

function matchesComputedFilters(product: StockPlanningProduct, query: StockPlanningProductsQuery) {
  if (query.maturity && product.maturity !== query.maturity) return false;
  if (query.confidence && product.confidence !== query.confidence) return false;
  if (query.risk && !(product.risks ?? []).includes(query.risk)) return false;
  return true;
}

function summarizeProducts(products: StockPlanningProduct[]) {
  return {
    productCount: products.length,
    replenishmentCount: products.filter((product) => product.result.quantityBase > 0).length,
    criticalRiskCount: products.filter((product) => product.risks?.includes("critical_stockout")).length,
    expiryRiskCount: products.filter((product) => product.risks?.includes("expiry")).length,
    staleCount: products.filter((product) => product.risks?.includes("stale")).length
  };
}

function groupProductsBySupplier(products: StockPlanningProduct[]) {
  const grouped = new Map<string, StockPlanningProduct[]>();
  for (const product of products) {
    const existing = grouped.get(product.supplierId) ?? [];
    existing.push(product);
    grouped.set(product.supplierId, existing);
  }
  return [...grouped.values()].map((supplierProducts) => ({
    supplierId: supplierProducts[0]!.supplierId,
    supplierName: supplierProducts[0]!.supplierName,
    summary: summarizeProducts(supplierProducts),
    productIds: supplierProducts.map((product) => product.productId)
  }));
}

function deduplicateAlerts(alerts: StockPlanningAlert[]) {
  const deduplicated = new Map<string, StockPlanningAlert>();
  for (const alert of alerts) {
    const key = `${alert.productId}:${alert.type}:${alert.executionId}`;
    if (!deduplicated.has(key)) deduplicated.set(key, alert);
  }
  const rank: Record<StockPlanningAlert["priority"], number> = {
    critical: 4,
    high: 3,
    medium: 2,
    informational: 1
  };
  return [...deduplicated.values()].sort((first, second) =>
    rank[second.priority] - rank[first.priority] || first.id.localeCompare(second.id)
  );
}

function toNumber(value: Prisma.Decimal | number | undefined, fallback: number) {
  if (value === undefined) return fallback;
  return typeof value === "number" ? value : value.toNumber();
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundUpToMultiple(quantity: Prisma.Decimal, multiple: Prisma.Decimal) {
  if (quantity.isZero()) {
    return new Prisma.Decimal(0);
  }

  return quantity.dividedBy(multiple).ceil().times(multiple);
}

function getBusinessDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STOCK_PLANNING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}

function getBusinessDateKey(now: Date) {
  return getBusinessDate(now).toISOString().slice(0, 10);
}

function removeUndefined(value: ProductStockConfigurationUpdate): ProductStockConfigurationUpdate {
  return {
    ...(value.stockCriticality === undefined ? {} : { stockCriticality: value.stockCriticality }),
    ...(value.stockCoverageDays === undefined ? {} : { stockCoverageDays: value.stockCoverageDays }),
    ...(value.preferredRestockUnitId === undefined
      ? {}
      : { preferredRestockUnitId: value.preferredRestockUnitId })
  };
}
