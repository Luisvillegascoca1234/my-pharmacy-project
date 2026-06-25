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
  salesToDate: state.salesToDate
});

export const selectExportsActions = (state: ExportsStore) => ({
  clearInventoryMovementsExport: state.clearInventoryMovementsExport,
  clearSalesExport: state.clearSalesExport,
  downloadInventoryMovementsCsv: state.downloadInventoryMovementsCsv,
  downloadSalesCsv: state.downloadSalesCsv,
  reset: state.reset,
  setInventoryMovementsFromDate: state.setInventoryMovementsFromDate,
  setInventoryMovementsToDate: state.setInventoryMovementsToDate,
  setSalesFromDate: state.setSalesFromDate,
  setSalesToDate: state.setSalesToDate
});
