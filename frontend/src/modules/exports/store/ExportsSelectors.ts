import type { ExportsStore } from "./ExportsStore";

export const selectExportsState = (state: ExportsStore) => ({
  error: state.error,
  inventoryMovementsExportFile: state.inventoryMovementsExportFile,
  inventoryMovementsExportStatus: state.inventoryMovementsExportStatus,
  inventoryMovementsFromDate: state.inventoryMovementsFromDate,
  inventoryMovementsToDate: state.inventoryMovementsToDate,
  salesExportFile: state.salesExportFile,
  salesExportStatus: state.salesExportStatus,
  salesFromDate: state.salesFromDate,
  salesToDate: state.salesToDate,
  stockPlanningFilters: state.stockPlanningFilters,
  stockPlanningObservationsError: state.stockPlanningObservationsError,
  stockPlanningObservationsFile: state.stockPlanningObservationsFile,
  stockPlanningObservationsStatus: state.stockPlanningObservationsStatus,
  stockPlanningResultsError: state.stockPlanningResultsError,
  stockPlanningResultsFile: state.stockPlanningResultsFile,
  stockPlanningResultsStatus: state.stockPlanningResultsStatus
});

export const selectExportsActions = (state: ExportsStore) => ({
  clearInventoryMovementsExport: state.clearInventoryMovementsExport,
  clearSalesExport: state.clearSalesExport,
  clearStockPlanningObservationsExport: state.clearStockPlanningObservationsExport,
  clearStockPlanningResultsExport: state.clearStockPlanningResultsExport,
  downloadInventoryMovementsCsv: state.downloadInventoryMovementsCsv,
  downloadSalesCsv: state.downloadSalesCsv,
  downloadStockPlanningObservationsParquet: state.downloadStockPlanningObservationsParquet,
  downloadStockPlanningResultsParquet: state.downloadStockPlanningResultsParquet,
  reset: state.reset,
  setInventoryMovementsFromDate: state.setInventoryMovementsFromDate,
  setInventoryMovementsToDate: state.setInventoryMovementsToDate,
  setSalesFromDate: state.setSalesFromDate,
  setSalesToDate: state.setSalesToDate,
  setStockPlanningFilters: state.setStockPlanningFilters
});
