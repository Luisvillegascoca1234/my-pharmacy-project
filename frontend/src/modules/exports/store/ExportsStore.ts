import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { exportsFacade } from "../facades/exportsFacade";
import { createCsvExportDataError, getCsvExportStatusFromError } from "../utils/exportsErrors";
import type { ExportsActions } from "./ExportsActions";
import {
  buildInventoryMovementsCsvExportQueryFromState,
  buildSalesCsvExportQueryFromState,
  initialExportsState,
  type ExportsState
} from "./ExportsState";

export type ExportsStore = ExportsState & ExportsActions;

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

function isEmptyCsv(content: string): boolean {
  return content.trim().split(/\r?\n/).filter(Boolean).length <= 1;
}

export const useExportsStore = create<ExportsStore>()(
  devtools(
    (set, get) => ({
      ...initialExportsState,

      clearInventoryMovementsExport() {
        set({ error: null, inventoryMovementsExportFile: null, inventoryMovementsExportStatus: "idle" }, false, "clearInventoryMovementsExport");
      },

      clearSalesExport() {
        set({ error: null, salesExportFile: null, salesExportStatus: "idle" }, false, "clearSalesExport");
      },

      async downloadInventoryMovementsCsv(signal) {
        set({ error: null, inventoryMovementsExportStatus: "loading" }, false, "downloadInventoryMovementsCsv:start");

        try {
          const file = await exportsFacade.downloadInventoryMovementsCsv(buildInventoryMovementsCsvExportQueryFromState(get()), signal);

          set(
            {
              error: null,
              inventoryMovementsExportFile: file,
              inventoryMovementsExportStatus: isEmptyCsv(file.content) ? "empty" : "success"
            },
            false,
            "downloadInventoryMovementsCsv:success"
          );

          return file;
        } catch (error) {
          if (isAbortError(error)) {
            return null;
          }

          const dataError = createCsvExportDataError(error);

          set(
            { error: dataError, inventoryMovementsExportStatus: getCsvExportStatusFromError(dataError) },
            false,
            "downloadInventoryMovementsCsv:error"
          );

          return null;
        }
      },

      async downloadSalesCsv(signal) {
        set({ error: null, salesExportStatus: "loading" }, false, "downloadSalesCsv:start");

        try {
          const file = await exportsFacade.downloadSalesCsv(buildSalesCsvExportQueryFromState(get()), signal);

          set(
            {
              error: null,
              salesExportFile: file,
              salesExportStatus: isEmptyCsv(file.content) ? "empty" : "success"
            },
            false,
            "downloadSalesCsv:success"
          );

          return file;
        } catch (error) {
          if (isAbortError(error)) {
            return null;
          }

          const dataError = createCsvExportDataError(error);

          set({ error: dataError, salesExportStatus: getCsvExportStatusFromError(dataError) }, false, "downloadSalesCsv:error");

          return null;
        }
      },

      reset() {
        set(initialExportsState, false, "reset");
      },

      setInventoryMovementsFromDate(inventoryMovementsFromDate) {
        set({ inventoryMovementsFromDate }, false, "setInventoryMovementsFromDate");
      },

      setInventoryMovementsToDate(inventoryMovementsToDate) {
        set({ inventoryMovementsToDate }, false, "setInventoryMovementsToDate");
      },

      setSalesFromDate(salesFromDate) {
        set({ salesFromDate }, false, "setSalesFromDate");
      },

      setSalesToDate(salesToDate) {
        set({ salesToDate }, false, "setSalesToDate");
      }
    }),
    { name: "ExportsStore" }
  )
);

export function resetExportsStore() {
  useExportsStore.getState().reset();
}
