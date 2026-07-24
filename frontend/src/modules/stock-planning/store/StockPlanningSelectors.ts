import type { StockPlanningStore } from "./StockPlanningStore";

export const selectStockPlanningState = (state: StockPlanningStore) => ({
  alerts: state.alerts,
  analyticsByProductId: state.analyticsByProductId,
  configuration: state.configuration,
  error: state.error,
  engineState: state.engineState,
  executions: state.executions,
  groups: state.groups,
  governanceError: state.governanceError,
  governanceStatus: state.governanceStatus,
  presentationOptionsByProductId: state.presentationOptionsByProductId,
  products: state.products,
  summary: state.summary,
  status: state.status,
  updateError: state.updateError,
  updatingProductId: state.updatingProductId,
  detailData: state.detailData,
  detailError: state.detailError,
  detailStatus: state.detailStatus
});

export const selectStockPlanningActions = (state: StockPlanningStore) => ({
  clearDetail: state.clearDetail,
  clearUpdateError: state.clearUpdateError,
  clearGovernanceError: state.clearGovernanceError,
  load: state.load,
  reset: state.reset,
  updateProduct: state.updateProduct,
  updateConfiguration: state.updateConfiguration,
  runManualExecution: state.runManualExecution,
  loadDetail: state.loadDetail
});
