import { z } from "zod";
import { nonNegativeMoneySchema } from "./shared-schema.helpers.js";

const optionalFilterText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional()
);

export const StockCriticalitySchema = z.enum(["normal", "high", "critical"]);
export type StockCriticality = z.infer<typeof StockCriticalitySchema>;

export const StockPlanningMaturitySchema = z.enum([
  "no_history",
  "low_confidence",
  "operational",
  "no_observed_demand"
]);
export type StockPlanningMaturity = z.infer<typeof StockPlanningMaturitySchema>;

export const StockPlanningResultKindSchema = z.enum(["configured_reference", "demand_forecast"]);
export type StockPlanningResultKind = z.infer<typeof StockPlanningResultKindSchema>;

export const StockPlanningWarningSchema = z.string();
export type StockPlanningWarning = z.infer<typeof StockPlanningWarningSchema>;

export const StockPlanningForecastModelSchema = z.enum([
  "recent_naive",
  "seasonal_naive_weekly",
  "moving_average",
  "simple_exponential_smoothing",
  "holt",
  "croston_sba",
  "tsb"
]);
export type StockPlanningForecastModel = z.infer<typeof StockPlanningForecastModelSchema>;

export const StockPlanningConfidenceSchema = z.enum(["none", "low", "medium", "high"]);
export type StockPlanningConfidence = z.infer<typeof StockPlanningConfidenceSchema>;

export const StockPlanningRiskSchema = z.enum([
  "replenishment",
  "critical_stockout",
  "expiry",
  "stale"
]);
export type StockPlanningRisk = z.infer<typeof StockPlanningRiskSchema>;

export const StockPlanningAlertTypeSchema = z.enum([
  "replenishment",
  "critical_stockout",
  "expiry_risk",
  "stale_calculation",
  "low_confidence",
  "insufficient_history"
]);
export type StockPlanningAlertType = z.infer<typeof StockPlanningAlertTypeSchema>;

export const StockPlanningAlertPrioritySchema = z.enum(["critical", "high", "medium", "informational"]);
export type StockPlanningAlertPriority = z.infer<typeof StockPlanningAlertPrioritySchema>;

export const StockPlanningForecastPointSchema = z.object({
  date: z.string().date(),
  central: z.number().min(0),
  lower80: z.number().min(0),
  upper80: z.number().min(0)
}).refine((point) => point.lower80 <= point.upper80, {
  message: "The lower forecast bound cannot exceed the upper bound."
});
export type StockPlanningForecastPoint = z.infer<typeof StockPlanningForecastPointSchema>;

export const StockPlanningForecastSchema = z.object({
  executionId: z.string(),
  model: StockPlanningForecastModelSchema.nullable(),
  historyDays: z.number().int().nonnegative(),
  demandDays: z.number().int().nonnegative(),
  censoredDays: z.number().int().nonnegative(),
  centralDemand: z.number().min(0),
  lower80: z.number().min(0),
  upper80: z.number().min(0),
  metrics: z.object({
    scaledError: z.number().nonnegative(),
    meanAbsoluteError: z.number().nonnegative(),
    bias: z.number(),
    evaluatedPoints: z.number().int().nonnegative()
  }),
  parameters: z.record(z.union([z.string(), z.number(), z.boolean()])),
  fingerprint: z.string(),
  engineVersion: z.string(),
  rulesVersion: z.string(),
  points: z.array(StockPlanningForecastPointSchema)
}).refine((forecast) => forecast.lower80 <= forecast.upper80, {
  message: "The accumulated lower forecast bound cannot exceed the upper bound."
});
export type StockPlanningForecast = z.infer<typeof StockPlanningForecastSchema>;

export const StockPlanningGlobalConfigurationSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  engineEnabled: z.boolean(),
  frequency: z.enum(["daily", "weekly"]),
  weekday: z.number().int().min(0).max(6).nullable(),
  localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  coverageDays: z.number().int().positive(),
  timezone: z.literal("America/La_Paz"),
  serviceLevels: z.object({
    normal: z.number().gt(0).lt(1),
    high: z.number().gt(0).lt(1),
    critical: z.number().gt(0).lt(1)
  }),
  maturityThresholds: z.object({
    minimumHistoryWeeks: z.number().int().positive(),
    minimumDemandDays: z.number().int().positive(),
    operationalDemandDays: z.number().int().positive()
  }),
  createdAt: z.string().datetime(),
  createdByUserId: z.string().nullable()
}).superRefine((value, context) => {
  if ((value.frequency === "daily" && value.weekday !== null) ||
      (value.frequency === "weekly" && value.weekday === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["weekday"], message: "Weekday must only be set for weekly frequency." });
  }
  if (!(value.serviceLevels.normal < value.serviceLevels.high &&
        value.serviceLevels.high < value.serviceLevels.critical)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["serviceLevels"], message: "Service levels must increase with criticality." });
  }
  if (value.maturityThresholds.operationalDemandDays <= value.maturityThresholds.minimumDemandDays) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["maturityThresholds"], message: "Operational demand days must exceed the minimum." });
  }
});
export type StockPlanningGlobalConfiguration = z.infer<typeof StockPlanningGlobalConfigurationSchema>;

export const StockPlanningConfigurationSummarySchema = z.object({
  coverageDays: z.number().int().positive(),
  timezone: z.literal("America/La_Paz")
});
export type StockPlanningConfigurationSummary = z.infer<typeof StockPlanningConfigurationSummarySchema>;

export const UpdateStockPlanningGlobalConfigurationSchema = z.object({
  engineEnabled: z.boolean(),
  frequency: z.enum(["daily", "weekly"]),
  weekday: z.number().int().min(0).max(6).nullable(),
  localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  coverageDays: z.number().int().min(1).max(365),
  serviceLevels: z.object({
    normal: z.number().min(0.5).max(0.999),
    high: z.number().min(0.5).max(0.999),
    critical: z.number().min(0.5).max(0.999)
  }),
  maturityThresholds: z.object({
    minimumHistoryWeeks: z.number().int().min(1).max(520),
    minimumDemandDays: z.number().int().min(1).max(3650),
    operationalDemandDays: z.number().int().min(2).max(3650)
  })
}).superRefine((value, context) => {
  if ((value.frequency === "daily" && value.weekday !== null) ||
      (value.frequency === "weekly" && value.weekday === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["weekday"], message: "Weekday must only be set for weekly frequency." });
  }
  if (!(value.serviceLevels.normal < value.serviceLevels.high &&
        value.serviceLevels.high < value.serviceLevels.critical)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["serviceLevels"], message: "Service levels must increase with criticality." });
  }
  if (value.maturityThresholds.operationalDemandDays <= value.maturityThresholds.minimumDemandDays) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["maturityThresholds"], message: "Operational demand days must exceed the minimum." });
  }
});
export type UpdateStockPlanningGlobalConfiguration = z.infer<typeof UpdateStockPlanningGlobalConfigurationSchema>;

export const StockPlanningExecutionSchema = z.object({
  id: z.string(),
  configurationVersion: z.number().int().positive(),
  configuration: StockPlanningGlobalConfigurationSchema,
  trigger: z.enum(["scheduled", "manual", "recovery"]),
  status: z.enum(["running", "succeeded", "succeeded_with_warnings", "failed"]),
  scheduledFor: z.string().datetime().nullable(),
  demandCutoffDate: z.string().date(),
  stockCapturedAt: z.string().datetime(),
  engineVersion: z.string(),
  fingerprint: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  durationMs: z.number().int().nonnegative().nullable(),
  globalError: z.string().nullable(),
  warnings: z.array(z.string())
});
export type StockPlanningExecution = z.infer<typeof StockPlanningExecutionSchema>;

export const StockPlanningEngineStateSchema = z.object({
  configuration: StockPlanningGlobalConfigurationSchema,
  latestExecution: StockPlanningExecutionSchema.nullable(),
  nextExpectedAt: z.string().datetime(),
  stale: z.boolean(),
  staleReasons: z.array(z.enum(["configuration_changed", "schedule_overdue"])),
  executionInProgress: z.boolean()
});
export type StockPlanningEngineState = z.infer<typeof StockPlanningEngineStateSchema>;

export const StockPlanningExecutionsResponseSchema = z.object({
  data: z.array(StockPlanningExecutionSchema)
});

export const StockPlanningProductsQuerySchema = z.object({
  search: optionalFilterText,
  categoryId: optionalFilterText,
  supplierId: optionalFilterText,
  criticality: StockCriticalitySchema.optional(),
  maturity: StockPlanningMaturitySchema.optional(),
  confidence: StockPlanningConfidenceSchema.optional(),
  risk: StockPlanningRiskSchema.optional(),
  groupBy: z.literal("supplier").optional()
});
export type StockPlanningProductsQuery = z.infer<typeof StockPlanningProductsQuerySchema>;

export const StockPlanningParquetExportQuerySchema = z.object({
  fromDate: z.string().date(),
  toDate: z.string().date(),
  productId: optionalFilterText,
  categoryId: optionalFilterText,
  supplierId: optionalFilterText
});
export type StockPlanningParquetExportQuery = z.infer<typeof StockPlanningParquetExportQuerySchema>;

export const StockPlanningPredictionParquetExportQuerySchema =
  StockPlanningParquetExportQuerySchema.extend({
    executionId: z.string().trim().min(1)
  });
export type StockPlanningPredictionParquetExportQuery = z.infer<
  typeof StockPlanningPredictionParquetExportQuerySchema
>;

export const UpdateProductStockConfigurationSchema = z.object({
  criticality: StockCriticalitySchema.optional(),
  coverageDays: z.number().int().min(1).max(365).nullable().optional(),
  preferredPresentationId: z.string().min(1).nullable().optional()
}).refine(
  (value) =>
    value.criticality !== undefined ||
    value.coverageDays !== undefined ||
    value.preferredPresentationId !== undefined,
  { message: "At least one stock planning parameter is required." }
);
export type UpdateProductStockConfiguration = z.infer<typeof UpdateProductStockConfigurationSchema>;

export const StockPlanningPresentationSchema = z.object({
  id: z.string(),
  unitId: z.string(),
  name: z.string(),
  abbreviation: z.string(),
  conversionFactor: z.number().positive()
});
export type StockPlanningPresentation = z.infer<typeof StockPlanningPresentationSchema>;

const StockPlanningResultBaseSchema = z.object({
  quantityBase: z.number().min(0),
  wasRounded: z.boolean(),
  preferredPresentation: StockPlanningPresentationSchema.optional()
});

export const StockPlanningConfiguredReferenceSchema = StockPlanningResultBaseSchema.extend({
  kind: z.literal("configured_reference")
});

export const StockPlanningRecommendationSchema = StockPlanningResultBaseSchema.extend({
  kind: z.literal("demand_forecast"),
  serviceLevel: z.number().gt(0).lt(1),
  centralDemand: z.number().min(0),
  demandQuantile: z.number().min(0),
  safetyStock: z.number().min(0),
  targetStock: z.number().min(0),
  estimatedCost: nonNegativeMoneySchema.optional()
});
export type StockPlanningRecommendation = z.infer<typeof StockPlanningRecommendationSchema>;

export const StockPlanningAlertSchema = z.object({
  id: z.string(),
  executionId: z.string(),
  productId: z.string(),
  type: StockPlanningAlertTypeSchema,
  priority: StockPlanningAlertPrioritySchema,
  message: z.string()
});
export type StockPlanningAlert = z.infer<typeof StockPlanningAlertSchema>;

export const StockPlanningProductSchema = z.object({
  productId: z.string(),
  internalCode: z.string(),
  commercialName: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  baseUnitAbbreviation: z.string(),
  criticality: StockCriticalitySchema,
  coverage: z.object({
    days: z.number().int().positive(),
    source: z.enum(["global", "product"])
  }),
  usableStock: z.number().min(0),
  expiryRiskStock: z.number().min(0).optional(),
  unusableStock: z.number().min(0).optional(),
  draftPurchaseQuantity: z.number().min(0).optional(),
  draftPurchaseCount: z.number().int().nonnegative().optional(),
  minimumStock: z.number().min(0),
  maturity: StockPlanningMaturitySchema,
  confidence: StockPlanningConfidenceSchema.optional(),
  result: z.discriminatedUnion("kind", [
    StockPlanningConfiguredReferenceSchema,
    StockPlanningRecommendationSchema
  ]),
  forecast: StockPlanningForecastSchema.optional(),
  risks: z.array(StockPlanningRiskSchema).optional(),
  alerts: z.array(StockPlanningAlertSchema).optional(),
  warnings: z.array(StockPlanningWarningSchema)
});
export type StockPlanningProduct = z.infer<typeof StockPlanningProductSchema>;

export const StockPlanningSummarySchema = z.object({
  productCount: z.number().int().nonnegative(),
  replenishmentCount: z.number().int().nonnegative(),
  criticalRiskCount: z.number().int().nonnegative(),
  expiryRiskCount: z.number().int().nonnegative(),
  staleCount: z.number().int().nonnegative()
});
export type StockPlanningSummary = z.infer<typeof StockPlanningSummarySchema>;

export const StockPlanningSupplierGroupSchema = z.object({
  supplierId: z.string(),
  supplierName: z.string(),
  summary: StockPlanningSummarySchema,
  productIds: z.array(z.string())
});
export type StockPlanningSupplierGroup = z.infer<typeof StockPlanningSupplierGroupSchema>;

export const StockPlanningProductsResponseSchema = z.object({
  configuration: StockPlanningConfigurationSummarySchema,
  data: z.array(StockPlanningProductSchema),
  summary: StockPlanningSummarySchema,
  groups: z.array(StockPlanningSupplierGroupSchema).optional(),
  alerts: z.array(StockPlanningAlertSchema)
});
export type StockPlanningProductsResponse = z.infer<typeof StockPlanningProductsResponseSchema>;

export const StockPlanningDetailQuerySchema = z.object({
  executionId: optionalFilterText
});
export type StockPlanningDetailQuery = z.infer<typeof StockPlanningDetailQuerySchema>;

export const StockPlanningObservedPointSchema = z.object({
  date: z.string().date(),
  grossDemand: z.number().min(0),
  returnedQuantity: z.number().min(0),
  netDemand: z.number().min(0),
  censored: z.boolean()
});

export const StockPlanningSnapshotLotSchema = z.object({
  batchId: z.string(),
  batchNumber: z.string().nullable(),
  expirationDate: z.string().date().nullable(),
  status: z.enum(["active", "depleted", "blocked", "cancelled"]),
  availableQuantity: z.number().min(0)
});

export const StockPlanningSnapshotSchema = z.object({
  date: z.string().date(),
  source: z.enum(["captured", "reconstructed"]),
  capturedAt: z.string().datetime(),
  stock: z.number().min(0),
  lots: z.array(StockPlanningSnapshotLotSchema)
});

export const StockPlanningDetailExecutionSchema = z.object({
  id: z.string(),
  status: z.enum(["succeeded", "succeeded_with_warnings"]),
  trigger: z.enum(["scheduled", "manual", "recovery"]),
  demandCutoffDate: z.string().date(),
  stockCapturedAt: z.string().datetime(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  configurationVersion: z.number().int().positive(),
  configuration: StockPlanningGlobalConfigurationSchema,
  engineVersion: z.string(),
  fingerprint: z.string()
});

export const StockPlanningDetailResultSchema = z.object({
  maturity: StockPlanningMaturitySchema,
  confidence: StockPlanningConfidenceSchema,
  model: StockPlanningForecastModelSchema.nullable(),
  historyStartDate: z.string().date(),
  historyEndDate: z.string().date(),
  historyDays: z.number().int().nonnegative(),
  demandDays: z.number().int().nonnegative(),
  censoredDays: z.number().int().nonnegative(),
  formula: z.string(),
  parameters: z.record(z.union([z.string(), z.number(), z.boolean()])),
  metrics: z.object({
    scaledError: z.number().nonnegative(),
    meanAbsoluteError: z.number().nonnegative(),
    bias: z.number(),
    evaluatedPoints: z.number().int().nonnegative()
  }),
  recommendation: z.object({
    centralDemand: z.number().min(0),
    demandQuantile: z.number().min(0),
    safetyStock: z.number().min(0),
    targetStock: z.number().min(0),
    usableStock: z.number().min(0),
    expiryRiskStock: z.number().min(0),
    unusableStock: z.number().min(0),
    suggestedQuantity: z.number().min(0),
    serviceLevel: z.number().gt(0).lt(1),
    criticality: StockCriticalitySchema
  }).nullable(),
  observations: z.array(StockPlanningObservedPointSchema),
  forecast: z.array(StockPlanningForecastPointSchema),
  warnings: z.array(StockPlanningWarningSchema)
});

const StockPlanningNumericChangeSchema = z.object({
  previous: z.number(),
  current: z.number(),
  delta: z.number()
});

export const StockPlanningExecutionComparisonSchema = z.object({
  previousExecutionId: z.string(),
  demand: StockPlanningNumericChangeSchema,
  targetStock: StockPlanningNumericChangeSchema.nullable(),
  suggestedQuantity: StockPlanningNumericChangeSchema.nullable(),
  confidence: z.object({
    previous: StockPlanningConfidenceSchema,
    current: StockPlanningConfidenceSchema,
    changed: z.boolean()
  }),
  model: z.object({
    previous: StockPlanningForecastModelSchema.nullable(),
    current: StockPlanningForecastModelSchema.nullable(),
    changed: z.boolean()
  })
});

export const StockPlanningProductDetailResponseSchema = z.object({
  product: z.object({
    id: z.string(),
    internalCode: z.string(),
    commercialName: z.string(),
    status: z.enum(["active", "inactive"]),
    baseUnitAbbreviation: z.string()
  }),
  execution: StockPlanningDetailExecutionSchema,
  result: StockPlanningDetailResultSchema,
  snapshots: z.array(StockPlanningSnapshotSchema),
  history: z.array(z.object({
    executionId: z.string(),
    status: z.enum(["succeeded", "succeeded_with_warnings"]),
    startedAt: z.string().datetime(),
    demandCutoffDate: z.string().date(),
    model: StockPlanningForecastModelSchema.nullable(),
    maturity: StockPlanningMaturitySchema,
    confidence: StockPlanningConfidenceSchema,
    centralDemand: z.number().min(0),
    targetStock: z.number().min(0).nullable(),
    suggestedQuantity: z.number().min(0).nullable(),
    scaledError: z.number().min(0),
    bias: z.number(),
    evaluatedPoints: z.number().int().nonnegative()
  })),
  comparison: StockPlanningExecutionComparisonSchema.nullable(),
  latestSuccessfulExecutionId: z.string(),
  laterFailedExecutions: z.array(z.object({
    executionId: z.string(),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime().nullable(),
    globalError: z.string().nullable()
  })),
  recommendationAvailable: z.boolean(),
  retention: z.object({
    snapshots: z.literal("indefinite"),
    operationalMovements: z.literal("indefinite"),
    predictionMonthsMinimum: z.literal(24)
  }),
  timezone: z.literal("America/La_Paz")
});
export type StockPlanningProductDetailResponse = z.infer<typeof StockPlanningProductDetailResponseSchema>;
