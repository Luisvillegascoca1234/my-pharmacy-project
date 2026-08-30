import { CSV_EXPORT_SEPARATOR } from "../constants/exportsConstants";
import type {
  CsvExportDataError,
  CsvExportFile,
  CsvExportRequestStatus,
  InventoryMovementsCsvExportQuery,
  SalesCsvExportQuery,
  StockPlanningParquetExportError,
  StockPlanningParquetFile,
  StockPlanningParquetFilters,
  StockPlanningParquetExportStatus
} from "../types/exportsTypes";

export type ExportsState = {
  error: CsvExportDataError | null;
  inventoryMovementsExportFile: CsvExportFile | null;
  inventoryMovementsExportStatus: CsvExportRequestStatus;
  inventoryMovementsFromDate: string;
  inventoryMovementsToDate: string;
  salesExportFile: CsvExportFile | null;
  salesExportStatus: CsvExportRequestStatus;
  salesFromDate: string;
  salesToDate: string;
  stockPlanningFilters: StockPlanningParquetFilters;
  stockPlanningObservationsError: StockPlanningParquetExportError | null;
  stockPlanningObservationsFile: StockPlanningParquetFile | null;
  stockPlanningObservationsStatus: StockPlanningParquetExportStatus;
  stockPlanningResultsError: StockPlanningParquetExportError | null;
  stockPlanningResultsFile: StockPlanningParquetFile | null;
  stockPlanningResultsStatus: StockPlanningParquetExportStatus;
};

export const initialExportsState: ExportsState = {
  error: null,
  inventoryMovementsExportFile: null,
  inventoryMovementsExportStatus: "idle",
  inventoryMovementsFromDate: "",
  inventoryMovementsToDate: "",
  salesExportFile: null,
  salesExportStatus: "idle",
  salesFromDate: "",
  salesToDate: "",
  stockPlanningFilters: {
    categoryId: "",
    executionId: "",
    fromDate: "",
    productId: "",
    supplierId: "",
    toDate: ""
  },
  stockPlanningObservationsError: null,
  stockPlanningObservationsFile: null,
  stockPlanningObservationsStatus: "idle",
  stockPlanningResultsError: null,
  stockPlanningResultsFile: null,
  stockPlanningResultsStatus: "idle"
};

export function buildSalesCsvExportQueryFromState(state: ExportsState): SalesCsvExportQuery {
  return {
    fromDate: state.salesFromDate || undefined,
    separator: CSV_EXPORT_SEPARATOR,
    toDate: state.salesToDate || undefined
  };
}

export function buildInventoryMovementsCsvExportQueryFromState(state: ExportsState): InventoryMovementsCsvExportQuery {
  return {
    fromDate: state.inventoryMovementsFromDate || undefined,
    separator: CSV_EXPORT_SEPARATOR,
    toDate: state.inventoryMovementsToDate || undefined
  };
}
