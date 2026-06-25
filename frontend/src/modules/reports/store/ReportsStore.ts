import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { reportsFacade } from "../facades/reportsFacade";
import type { ReportsDataError } from "../types/reportsTypes";
import { createReportsDataError, getReportsStatusFromError } from "../utils/reportsErrors";
import type { ReportsActions } from "./ReportsActions";
import {
  buildDailySalesReportQueryFromState,
  buildExpiringProductsReportQueryFromState,
  buildInventoryValuationReportQueryFromState,
  initialReportsState,
  type ReportsState
} from "./ReportsState";

export type ReportsStore = ReportsState & ReportsActions;

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

function createLocalError(code: ReportsDataError["code"]): ReportsDataError {
  return {
    code,
    statusCode: null
  };
}

export const useReportsStore = create<ReportsStore>()(
  devtools(
    (set, get) => ({
      ...initialReportsState,

      async loadDailySalesReport(signal) {
        const query = buildDailySalesReportQueryFromState(get());

        if (!query.fromDate || !query.toDate) {
          set({ dailySalesStatus: "error", error: createLocalError("validation") }, false, "loadDailySalesReport:invalidRange");
          return;
        }

        set({ dailySalesStatus: "loading", error: null }, false, "loadDailySalesReport:start");

        try {
          const report = await reportsFacade.getDailySalesReport(query, signal);

          set(
            {
              dailySalesReport: report,
              dailySalesStatus: report.data.length > 0 ? "success" : "empty",
              error: null
            },
            false,
            "loadDailySalesReport:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          const dataError = createReportsDataError(error);

          set(
            { dailySalesStatus: getReportsStatusFromError(dataError), error: dataError },
            false,
            "loadDailySalesReport:error"
          );
        }
      },

      async loadExpiringProductsReport(signal) {
        set({ expiringProductsStatus: "loading", error: null }, false, "loadExpiringProductsReport:start");

        try {
          const report = await reportsFacade.getExpiringProductsReport(buildExpiringProductsReportQueryFromState(get()), signal);

          set(
            {
              error: null,
              expiringProductsReport: report,
              expiringProductsStatus: report.data.length > 0 ? "success" : "empty"
            },
            false,
            "loadExpiringProductsReport:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          const dataError = createReportsDataError(error);

          set(
            { error: dataError, expiringProductsStatus: getReportsStatusFromError(dataError) },
            false,
            "loadExpiringProductsReport:error"
          );
        }
      },

      async loadInventoryValuationReport(signal) {
        set({ error: null, inventoryValuationStatus: "loading" }, false, "loadInventoryValuationReport:start");

        try {
          const report = await reportsFacade.getInventoryValuationReport(buildInventoryValuationReportQueryFromState(get()), signal);

          set(
            {
              error: null,
              inventoryValuationReport: report,
              inventoryValuationStatus: report.data.length > 0 ? "success" : "empty"
            },
            false,
            "loadInventoryValuationReport:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          const dataError = createReportsDataError(error);

          set(
            { error: dataError, inventoryValuationStatus: getReportsStatusFromError(dataError) },
            false,
            "loadInventoryValuationReport:error"
          );
        }
      },

      reset() {
        set(initialReportsState, false, "reset");
      },

      setDailySalesFromDate(dailySalesFromDate) {
        set({ dailySalesFromDate }, false, "setDailySalesFromDate");
      },

      setDailySalesToDate(dailySalesToDate) {
        set({ dailySalesToDate }, false, "setDailySalesToDate");
      },

      setExpiringDays(expiringDays) {
        set({ expiringDays }, false, "setExpiringDays");
      },

      setExpiringProductId(expiringProductId) {
        set({ expiringProductId }, false, "setExpiringProductId");
      },

      setExpiringSearch(expiringSearch) {
        set({ expiringSearch }, false, "setExpiringSearch");
      },

      setInventoryValuationProductId(inventoryValuationProductId) {
        set({ inventoryValuationProductId }, false, "setInventoryValuationProductId");
      },

      setInventoryValuationSearch(inventoryValuationSearch) {
        set({ inventoryValuationSearch }, false, "setInventoryValuationSearch");
      }
    }),
    { name: "ReportsStore" }
  )
);

export function resetReportsStore() {
  useReportsStore.getState().reset();
}
