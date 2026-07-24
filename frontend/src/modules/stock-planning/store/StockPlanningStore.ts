import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { stockPlanningFacade } from "../facades/stockPlanningFacade";
import { createStockPlanningDataError, getStockPlanningStatusFromError } from "../utils/stockPlanningErrors";
import { createStockPlanningExecutionKey } from "../utils/stockPlanningIdempotency";
import type { StockPlanningActions } from "./StockPlanningActions";
import { initialStockPlanningState, type StockPlanningState } from "./StockPlanningState";

export type StockPlanningStore = StockPlanningState & StockPlanningActions;

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

export const useStockPlanningStore = create<StockPlanningStore>()(
  devtools(
    (set, get) => ({
      ...initialStockPlanningState,

      clearUpdateError() {
        set({ updateError: null }, false, "updateProduct:clearError");
      },

      clearDetail() {
        set({
          detailData: null,
          detailError: null,
          detailStatus: "idle"
        }, false, "detail:clear");
      },

      async loadDetail(productId, executionId, signal) {
        set({ detailError: null, detailStatus: "loading" }, false, "detail:load:start");
        try {
          const detailData = await stockPlanningFacade.getProductDetail(productId, executionId, signal);
          set({ detailData, detailError: null, detailStatus: "success" }, false, "detail:load:success");
        } catch (error) {
          if (isAbortError(error)) return;
          set({
            detailError: createStockPlanningDataError(error),
            detailStatus: "error"
          }, false, "detail:load:error");
        }
      },

      clearGovernanceError() {
        set({ governanceError: null }, false, "governance:clearError");
      },

      async load(query = {}, signal) {
        set({ error: null, status: "loading" }, false, "load:start");

        try {
          const data = await stockPlanningFacade.list(query, signal);

          set(
            {
              activeQuery: query,
              alerts: data.alerts,
              analyticsByProductId: data.analyticsByProductId,
              configuration: data.configuration,
              engineState: data.engineState,
              executions: data.executions,
              groups: data.groups,
              error: null,
              presentationOptionsByProductId: data.presentationOptionsByProductId,
              products: data.products,
              summary: data.summary,
              status: data.products.length > 0 ? "success" : "empty"
            },
            false,
            "load:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          const dataError = createStockPlanningDataError(error);

          set(
            { error: dataError, status: getStockPlanningStatusFromError(dataError) },
            false,
            "load:error"
          );
        }
      },

      reset() {
        set(initialStockPlanningState, false, "reset");
      },

      async updateProduct(productId, input) {
        set({ updateError: null, updatingProductId: productId }, false, "updateProduct:start");

        try {
          await stockPlanningFacade.updateProduct(productId, input);
          const data = await stockPlanningFacade.list(get().activeQuery);

          set(
            {
              ...data,
              updateError: null,
              updatingProductId: null,
              status: data.products.length > 0 ? "success" : "empty"
            },
            false,
            "updateProduct:success"
          );
          return true;
        } catch (error) {
          const updateError = createStockPlanningDataError(error);

          set({ updateError, updatingProductId: null }, false, "updateProduct:error");
          return false;
        }
      },

      async updateConfiguration(input) {
        set({ governanceError: null, governanceStatus: "saving" }, false, "configuration:start");
        try {
          await stockPlanningFacade.updateConfiguration(input);
          const data = await stockPlanningFacade.list(get().activeQuery);
          set({
            ...data,
            governanceError: null,
            governanceStatus: "idle",
            status: data.products.length > 0 ? "success" : "empty"
          }, false, "configuration:success");
          return true;
        } catch (error) {
          set({
            governanceError: createStockPlanningDataError(error),
            governanceStatus: "idle"
          }, false, "configuration:error");
          return false;
        }
      },

      async runManualExecution() {
        const idempotencyKey = get().manualExecutionAttemptKey ?? createStockPlanningExecutionKey();
        set({
          governanceError: null,
          governanceStatus: "running",
          manualExecutionAttemptKey: idempotencyKey
        }, false, "execution:start");
        try {
          await stockPlanningFacade.runManualExecution(idempotencyKey);
          const data = await stockPlanningFacade.list(get().activeQuery);
          set({
            ...data,
            governanceError: null,
            governanceStatus: "idle",
            manualExecutionAttemptKey: null,
            status: data.products.length > 0 ? "success" : "empty"
          }, false, "execution:success");
          return true;
        } catch (error) {
          set({
            governanceError: createStockPlanningDataError(error),
            governanceStatus: "idle"
          }, false, "execution:error");
          return false;
        }
      }
    }),
    { name: "StockPlanningStore" }
  )
);

export function resetStockPlanningStore() {
  useStockPlanningStore.getState().reset();
}
