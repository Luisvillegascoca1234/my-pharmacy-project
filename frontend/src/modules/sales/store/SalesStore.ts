import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CancelableSale, CancelableSaleSummary, SalesDataError } from "../types/salesTypes";
import { salesFacade } from "../facades/salesFacade";
import { createSalesDataError, getSalesStatusFromError } from "../utils/salesErrors";
import { buildCancelSalePayload } from "../utils/salesPayloads";
import type { SalesActions } from "./SalesActions";
import { buildSalesQueryFromState, initialSalesPagination, initialSalesState, type SalesState } from "./SalesState";

export type SalesStore = SalesState & SalesActions;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function createLocalError(code: SalesDataError["code"]): SalesDataError {
  return {
    code,
    statusCode: null
  };
}

function updateSaleSummary(items: CancelableSaleSummary[], sale: CancelableSale): CancelableSaleSummary[] {
  const summary: CancelableSaleSummary = {
    canCancel: sale.canCancel,
    cancellationBlockedReason: sale.cancellationBlockedReason,
    cancelReason: sale.cancelReason,
    cancelledAt: sale.cancelledAt,
    cashSessionCorrelativeCode: sale.cashSessionCorrelativeCode,
    cashSessionId: sale.cashSessionId,
    confirmedAt: sale.confirmedAt,
    correlativeCode: sale.correlativeCode,
    createdAt: sale.createdAt,
    id: sale.id,
    sellerUser: sale.sellerUser,
    sellerUserId: sale.sellerUserId,
    status: sale.status,
    totalAmount: sale.totalAmount,
    totalMargin: sale.totalMargin,
    updatedAt: sale.updatedAt
  };
  const exists = items.some((item) => item.id === sale.id);

  return exists ? items.map((item) => (item.id === sale.id ? summary : item)) : [summary, ...items];
}

export const useSalesStore = create<SalesStore>()(
  devtools(
    (set, get) => ({
      ...initialSalesState,

      async cancelSelectedSale(cancelReason) {
        const state = get();
        const selectedSaleId = state.selectedSaleId;
        const reason = cancelReason ?? state.cancelReason;

        if (!selectedSaleId) {
          return null;
        }

        if (reason.trim().length < 3) {
          set({ cancelStatus: "error", error: createLocalError("validation") }, false, "cancelSelectedSale:invalidReason");
          return null;
        }

        set({ cancelStatus: "loading", error: null }, false, "cancelSelectedSale:start");

        try {
          const sale = await salesFacade.cancel(selectedSaleId, buildCancelSalePayload(reason));

          set(
            (currentState) => ({
              cancelReason: "",
              cancelStatus: "success",
              detailStatus: "success",
              error: null,
              items: updateSaleSummary(currentState.items, sale),
              lastCancelledSale: sale,
              selectedSale: sale,
              selectedSaleId: sale.id
            }),
            false,
            "cancelSelectedSale:success"
          );

          return sale;
        } catch (error) {
          const dataError = createSalesDataError(error);

          set({ cancelStatus: getSalesStatusFromError(dataError), error: dataError }, false, "cancelSelectedSale:error");

          return null;
        }
      },

      clearCancellation() {
        set({ cancelReason: "", cancelStatus: "idle", error: null, lastCancelledSale: null }, false, "clearCancellation");
      },

      async loadSale(saleId, signal) {
        set({ detailStatus: "loading", error: null, selectedSaleId: saleId }, false, "loadSale:start");

        try {
          const sale = await salesFacade.getById(saleId, signal);

          set(
            (state) => ({
              detailStatus: "success",
              error: null,
              items: updateSaleSummary(state.items, sale),
              selectedSale: sale,
              selectedSaleId: sale.id
            }),
            false,
            "loadSale:success"
          );

          return sale;
        } catch (error) {
          if (isAbortError(error)) {
            return null;
          }

          const dataError = createSalesDataError(error);

          set({ detailStatus: getSalesStatusFromError(dataError), error: dataError, selectedSale: null }, false, "loadSale:error");

          return null;
        }
      },

      async loadSales(signal) {
        set({ error: null, listStatus: "loading" }, false, "loadSales:start");

        try {
          const response = await salesFacade.list(buildSalesQueryFromState(get()), signal);

          set(
            {
              error: null,
              items: response.data,
              listStatus: response.data.length > 0 ? "success" : "empty",
              pagination: response.pagination
            },
            false,
            "loadSales:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          const dataError = createSalesDataError(error);

          set({ error: dataError, listStatus: getSalesStatusFromError(dataError) }, false, "loadSales:error");
        }
      },

      reset() {
        set(initialSalesState, false, "reset");
      },

      selectSale(saleId) {
        const selectedSale = saleId && get().selectedSale?.id === saleId ? get().selectedSale : null;

        set({ selectedSale, selectedSaleId: saleId }, false, "selectSale");
      },

      setCancelReason(cancelReason) {
        set({ cancelReason, cancelStatus: "idle" }, false, "setCancelReason");
      },

      setCashSessionId(cashSessionId) {
        set(
          (state) => ({
            cashSessionId,
            pagination: {
              ...state.pagination,
              page: 1
            }
          }),
          false,
          "setCashSessionId"
        );
      },

      setFromDate(fromDate) {
        set(
          (state) => ({
            fromDate,
            pagination: {
              ...state.pagination,
              page: 1
            }
          }),
          false,
          "setFromDate"
        );
      },

      setPage(page) {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              page
            }
          }),
          false,
          "setPage"
        );
      },

      setPageSize(pageSize) {
        set(
          {
            pagination: {
              ...initialSalesPagination,
              pageSize
            }
          },
          false,
          "setPageSize"
        );
      },

      setSearch(search) {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              page: 1
            },
            search
          }),
          false,
          "setSearch"
        );
      },

      setSellerUserId(sellerUserId) {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              page: 1
            },
            sellerUserId
          }),
          false,
          "setSellerUserId"
        );
      },

      setStatus(status) {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              page: 1
            },
            status
          }),
          false,
          "setStatus"
        );
      },

      setToDate(toDate) {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              page: 1
            },
            toDate
          }),
          false,
          "setToDate"
        );
      }
    }),
    { name: "SalesStore" }
  )
);

export function resetSalesStore() {
  useSalesStore.getState().reset();
}
