import type { CsvExportFile } from "../types/exportsTypes";

export type ExportsActions = {
  clearInventoryMovementsExport: () => void;
  clearSalesExport: () => void;
  downloadInventoryMovementsCsv: (signal?: AbortSignal) => Promise<CsvExportFile | null>;
  downloadSalesCsv: (signal?: AbortSignal) => Promise<CsvExportFile | null>;
  reset: () => void;
  setInventoryMovementsFromDate: (fromDate: string) => void;
  setInventoryMovementsToDate: (toDate: string) => void;
  setSalesFromDate: (fromDate: string) => void;
  setSalesToDate: (toDate: string) => void;
};
