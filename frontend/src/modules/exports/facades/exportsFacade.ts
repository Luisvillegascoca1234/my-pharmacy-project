import {
  CSV_EXPORT_CONTENT_TYPE,
  INVENTORY_MOVEMENTS_CSV_FILE_NAME,
  SALES_CSV_FILE_NAME
} from "../constants/exportsConstants";
import { exportsApi } from "../api/exports-api";
import type { CsvExportFile, InventoryMovementsCsvExportQuery, SalesCsvExportQuery } from "../types/exportsTypes";
import { buildInventoryMovementsCsvExportQuery, buildSalesCsvExportQuery } from "../utils/exportsPayloads";

export const exportsFacade = {
  async downloadSalesCsv(query: SalesCsvExportQuery, signal?: AbortSignal): Promise<CsvExportFile> {
    const content = await exportsApi.downloadSalesCsv(buildSalesCsvExportQuery(query), signal);

    return {
      content,
      contentType: CSV_EXPORT_CONTENT_TYPE,
      fileName: SALES_CSV_FILE_NAME,
      kind: "sales"
    };
  },

  async downloadInventoryMovementsCsv(
    query: InventoryMovementsCsvExportQuery,
    signal?: AbortSignal
  ): Promise<CsvExportFile> {
    const content = await exportsApi.downloadInventoryMovementsCsv(buildInventoryMovementsCsvExportQuery(query), signal);

    return {
      content,
      contentType: CSV_EXPORT_CONTENT_TYPE,
      fileName: INVENTORY_MOVEMENTS_CSV_FILE_NAME,
      kind: "inventory-movements"
    };
  }
};
