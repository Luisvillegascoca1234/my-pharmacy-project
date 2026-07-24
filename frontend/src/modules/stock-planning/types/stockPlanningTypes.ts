import type {
  ProductUnit,
  StockPlanningEngineState,
  StockPlanningExecution,
  StockPlanningGlobalConfiguration,
  StockPlanningAlert,
  StockPlanningProduct,
  StockPlanningProductDetailResponse,
  StockPlanningProductsQuery,
  StockPlanningSummary,
  StockPlanningSupplierGroup,
  UpdateProductStockConfiguration
} from "@pharmacy-pos/shared";

export type StockPlanningRequestStatus = "empty" | "error" | "forbidden" | "idle" | "loading" | "success";
export type StockPlanningDetailStatus = "error" | "idle" | "loading" | "success";

export type StockPlanningDataErrorCode =
  | "conflict"
  | "forbidden"
  | "not-found"
  | "session-invalid"
  | "unknown"
  | "validation";

export type StockPlanningDataError = {
  code: StockPlanningDataErrorCode;
  statusCode: number | null;
};

export type StockPlanningPresentationOption = Pick<ProductUnit, "conversionFactor" | "id"> & {
  abbreviation: string;
  name: string;
};

export type StockPlanningForecastFreshness = "current" | "reference" | "stale";

export type StockPlanningProductAnalytics = {
  available: boolean;
  baselineRetained: boolean;
  degraded: boolean;
  evidenceLimited: boolean;
  freshness: StockPlanningForecastFreshness;
  intervalWidth80: number | null;
  latestCompletedExecutionId: string | null;
};

export type StockPlanningData = {
  alerts: StockPlanningAlert[];
  analyticsByProductId: Record<string, StockPlanningProductAnalytics>;
  configuration: StockPlanningGlobalConfiguration;
  engineState: StockPlanningEngineState;
  executions: StockPlanningExecution[];
  groups: StockPlanningSupplierGroup[];
  presentationOptionsByProductId: Record<string, StockPlanningPresentationOption[]>;
  products: StockPlanningProduct[];
  summary: StockPlanningSummary;
};

export type StockPlanningFilters = StockPlanningProductsQuery;
export type StockPlanningProductUpdate = UpdateProductStockConfiguration;

export type StockPlanningTemporalPoint = {
  band80: [number, number] | null;
  censored: boolean;
  censoredMarker: number | null;
  date: string;
  demand: number | null;
  forecast: number | null;
};

export type StockPlanningStockPoint = {
  date: string;
  stock: number;
  target: number | null;
};

export type StockPlanningPerformancePoint = {
  bias: number;
  date: string;
  executionId: string;
  scaledError: number;
};

export type StockPlanningDetailAnalytics = {
  demand: StockPlanningTemporalPoint[];
  performance: StockPlanningPerformancePoint[];
  stock: StockPlanningStockPoint[];
};

export type StockPlanningDetailData = {
  analytics: StockPlanningDetailAnalytics;
  detail: StockPlanningProductDetailResponse;
};
