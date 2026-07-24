import type {
  StockPlanningDataError,
  StockPlanningFilters,
  StockPlanningProductAnalytics,
  StockPlanningPresentationOption,
  StockPlanningRequestStatus
} from "../types/stockPlanningTypes";
import type { StockPlanningDetailData, StockPlanningDetailStatus } from "../types/stockPlanningTypes";
import type {
  StockPlanningEngineState,
  StockPlanningExecution,
  StockPlanningGlobalConfiguration,
  StockPlanningAlert,
  StockPlanningSummary,
  StockPlanningSupplierGroup,
  StockPlanningProduct
} from "@pharmacy-pos/shared";

export type StockPlanningState = {
  activeQuery: StockPlanningFilters;
  alerts: StockPlanningAlert[];
  analyticsByProductId: Record<string, StockPlanningProductAnalytics>;
  configuration: StockPlanningGlobalConfiguration | null;
  error: StockPlanningDataError | null;
  engineState: StockPlanningEngineState | null;
  executions: StockPlanningExecution[];
  groups: StockPlanningSupplierGroup[];
  presentationOptionsByProductId: Record<string, StockPlanningPresentationOption[]>;
  products: StockPlanningProduct[];
  summary: StockPlanningSummary;
  status: StockPlanningRequestStatus;
  updateError: StockPlanningDataError | null;
  updatingProductId: string | null;
  governanceError: StockPlanningDataError | null;
  governanceStatus: "idle" | "running" | "saving";
  manualExecutionAttemptKey: string | null;
  detailData: StockPlanningDetailData | null;
  detailError: StockPlanningDataError | null;
  detailStatus: StockPlanningDetailStatus;
};

export const initialStockPlanningState: StockPlanningState = {
  activeQuery: {},
  alerts: [],
  analyticsByProductId: {},
  configuration: null,
  error: null,
  engineState: null,
  executions: [],
  groups: [],
  presentationOptionsByProductId: {},
  products: [],
  summary: {
    criticalRiskCount: 0,
    expiryRiskCount: 0,
    productCount: 0,
    replenishmentCount: 0,
    staleCount: 0
  },
  status: "idle",
  updateError: null,
  updatingProductId: null,
  governanceError: null,
  governanceStatus: "idle",
  manualExecutionAttemptKey: null,
  detailData: null,
  detailError: null,
  detailStatus: "idle"
};
