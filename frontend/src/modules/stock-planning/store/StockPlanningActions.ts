import type { StockPlanningFilters, StockPlanningProductUpdate } from "../types/stockPlanningTypes";
import type { UpdateStockPlanningGlobalConfiguration } from "@pharmacy-pos/shared";

export type StockPlanningActions = {
  clearDetail: () => void;
  clearUpdateError: () => void;
  clearGovernanceError: () => void;
  load: (query?: StockPlanningFilters, signal?: AbortSignal) => Promise<void>;
  reset: () => void;
  updateProduct: (productId: string, input: StockPlanningProductUpdate) => Promise<boolean>;
  updateConfiguration: (input: UpdateStockPlanningGlobalConfiguration) => Promise<boolean>;
  runManualExecution: () => Promise<boolean>;
  loadDetail: (productId: string, executionId?: string, signal?: AbortSignal) => Promise<void>;
};
