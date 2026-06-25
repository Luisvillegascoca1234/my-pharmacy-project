import { CSV_EXPORT_SEPARATOR } from "../constants/exportsConstants";
import type {
  CsvExportDataError,
  CsvExportFile,
  CsvExportRequestStatus,
  InventoryMovementsCsvExportQuery,
  SalesCsvExportQuery
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
  salesToDate: ""
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
