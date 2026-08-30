import type { CsvExportFile, StockPlanningParquetFile, StockPlanningParquetFilters } from "../types/exportsTypes";

export type ExportsActions = {
  clearInventoryMovementsExport: () => void;
  clearSalesExport: () => void;
  clearStockPlanningObservationsExport: () => void;
  clearStockPlanningResultsExport: () => void;
  downloadInventoryMovementsCsv: (signal?: AbortSignal) => Promise<CsvExportFile | null>;
  downloadSalesCsv: (signal?: AbortSignal) => Promise<CsvExportFile | null>;
  downloadStockPlanningObservationsParquet: (signal?: AbortSignal) => Promise<StockPlanningParquetFile | null>;
  downloadStockPlanningResultsParquet: (signal?: AbortSignal) => Promise<StockPlanningParquetFile | null>;
  reset: () => void;
  setInventoryMovementsFromDate: (fromDate: string) => void;
  setInventoryMovementsToDate: (toDate: string) => void;
  setSalesFromDate: (fromDate: string) => void;
  setSalesToDate: (toDate: string) => void;
  setStockPlanningFilters: (filters: Partial<StockPlanningParquetFilters>) => void;
};
