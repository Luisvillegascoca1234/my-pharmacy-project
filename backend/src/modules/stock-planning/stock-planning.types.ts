import type {
  ForecastConfidence,
  ForecastMaturity,
  ForecastModel,
  Prisma,
  Product,
  ProductCategory,
  ProductUnit,
  StockCriticality,
  Supplier,
  Unit
} from "@prisma/client";

export type StockPlanningProductRecord = Product & {
  category: Pick<ProductCategory, "id" | "name">;
  supplier: Pick<Supplier, "id" | "businessName">;
  baseUnit: Pick<Unit, "id" | "abbreviation">;
  preferredRestockUnit:
    | (ProductUnit & {
        unit: Pick<Unit, "id" | "name" | "abbreviation">;
      })
    | null;
  inventoryBatches: Array<{
    id: string;
    availableQuantity: Prisma.Decimal;
    expirationDate: Date | null;
    status: "active" | "depleted" | "blocked" | "cancelled";
  }>;
  purchaseContext: {
    draftQuantity: Prisma.Decimal;
    draftCount: number;
    latestReliableBaseUnitCost: Prisma.Decimal | null;
  };
  stockPlanningForecasts: Array<{
    executionId: string;
    maturity: ForecastMaturity;
    confidence: ForecastConfidence;
    model: ForecastModel | null;
    historyDays: number;
    demandDays: number;
    censoredDays: number;
    parameters: Prisma.JsonValue;
    metrics: Prisma.JsonValue;
    fingerprint: string;
    engineVersion: string;
    rulesVersion: string;
    warnings: Prisma.JsonValue;
    recommendation: Prisma.JsonValue | null;
    forecastPoints: Array<{
      localDate: Date;
      central: Prisma.Decimal;
      lower80: Prisma.Decimal;
      upper80: Prisma.Decimal;
    }>;
  }>;
};

export type StockPlanningFilters = {
  search?: string;
  categoryId?: string;
  supplierId?: string;
  criticality?: StockCriticality;
};

export type StockPlanningAuditContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ProductStockConfigurationUpdate = {
  stockCriticality?: StockCriticality;
  stockCoverageDays?: number | null;
  preferredRestockUnitId?: string | null;
};
