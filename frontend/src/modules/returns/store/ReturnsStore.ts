import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { returnsFacade } from "../facades/returnsFacade";
import type { ReturnableSaleSummary, ReturnsDataError, SaleReturn, SaleReturnSummary } from "../types/returnsTypes";
import { createReturnsDataError, getReturnsStatusFromError } from "../utils/returnsErrors";
import type { ReturnsActions } from "./ReturnsActions";
import {
  buildReturnableSalesQueryFromState,
  buildSaleReturnsQueryFromState,
  initialReturnsPagination,
  initialReturnsState,
  type ReturnsState
} from "./ReturnsState";

export type ReturnsStore = ReturnsState & ReturnsActions;

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

function createLocalError(code: ReturnsDataError["code"]): ReturnsDataError {
  return {
    code,
    statusCode: null
  };
}

function toSaleReturnSummary(saleReturn: SaleReturn): SaleReturnSummary {
  return {
    actorUser: saleReturn.actorUser,
    actorUserId: saleReturn.actorUserId,
    createdAt: saleReturn.createdAt,
    id: saleReturn.id,
    paymentId: saleReturn.paymentId,
    reason: saleReturn.reason,
    refundAmount: saleReturn.refundAmount,
    returnedAt: saleReturn.returnedAt,
    saleCorrelativeCode: saleReturn.saleCorrelativeCode,
    saleId: saleReturn.saleId,
    updatedAt: saleReturn.updatedAt
  };
}

function updateSaleReturnSummary(items: SaleReturnSummary[], saleReturn: SaleReturn): SaleReturnSummary[] {
  const summary = toSaleReturnSummary(saleReturn);
  const exists = items.some((item) => item.id === saleReturn.id);

  return exists ? items.map((item) => (item.id === saleReturn.id ? summary : item)) : [summary, ...items];
}

function updateReturnableSaleAfterReturn(items: ReturnableSaleSummary[], saleReturn: SaleReturn): ReturnableSaleSummary[] {
  return items.map((item) =>
    item.id === saleReturn.saleId
      ? {
          ...item,
          canReturn: false,
          returnBlockedReason: "already-returned",
          status: "returned"
        }
      : item
  );
}

export const useReturnsStore = create<ReturnsStore>()(
  devtools(
    (set, get) => ({
      ...initialReturnsState,

      clearCreation() {
        set({ createReason: "", createStatus: "idle", error: null, lastSaleReturn: null }, false, "clearCreation");
      },

      async createTotalSaleReturn(input) {
        const reason = input.reason || get().createReason;

        if (reason.trim().length < 5) {
          set({ createStatus: "error", error: createLocalError("validation") }, false, "createTotalSaleReturn:invalidReason");
          return null;
        }

        set({ createStatus: "loading", error: null }, false, "createTotalSaleReturn:start");

        try {
          const saleReturn = await returnsFacade.createTotalSaleReturn({ ...input, reason });

          set(
            (state) => ({
              createReason: "",
              createStatus: "success",
              detailStatus: "success",
              error: null,
              lastSaleReturn: saleReturn,
              returnableSales: updateReturnableSaleAfterReturn(state.returnableSales, saleReturn),
              saleReturns: updateSaleReturnSummary(state.saleReturns, saleReturn),
              selectedSaleReturn: saleReturn,
              selectedSaleReturnId: saleReturn.id
            }),
            false,
            "createTotalSaleReturn:success"
          );

          return saleReturn;
        } catch (error) {
          const dataError = createReturnsDataError(error);

          set({ createStatus: getReturnsStatusFromError(dataError), error: dataError }, false, "createTotalSaleReturn:error");

          return null;
        }
      },

      async loadReturnableSales(signal) {
        set({ error: null, returnableSalesStatus: "loading" }, false, "loadReturnableSales:start");

        try {
          const response = await returnsFacade.listReturnableSales(buildReturnableSalesQueryFromState(get()), signal);

          set(
            {
              error: null,
              returnablePagination: response.pagination,
              returnableSales: response.data,
              returnableSalesStatus: response.data.length > 0 ? "success" : "empty"
            },
            false,
            "loadReturnableSales:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          const dataError = createReturnsDataError(error);

          set(
            { error: dataError, returnableSalesStatus: getReturnsStatusFromError(dataError) },
            false,
            "loadReturnableSales:error"
          );
        }
      },

      async loadSaleReturn(saleReturnId, signal) {
        set({ detailStatus: "loading", error: null, selectedSaleReturnId: saleReturnId }, false, "loadSaleReturn:start");

        try {
          const saleReturn = await returnsFacade.getSaleReturnById(saleReturnId, signal);

          set(
            (state) => ({
              detailStatus: "success",
              error: null,
              saleReturns: updateSaleReturnSummary(state.saleReturns, saleReturn),
              selectedSaleReturn: saleReturn,
              selectedSaleReturnId: saleReturn.id
            }),
            false,
            "loadSaleReturn:success"
          );

          return saleReturn;
        } catch (error) {
          if (isAbortError(error)) {
            return null;
          }

          const dataError = createReturnsDataError(error);

          set(
            { detailStatus: getReturnsStatusFromError(dataError), error: dataError, selectedSaleReturn: null },
            false,
            "loadSaleReturn:error"
          );

          return null;
        }
      },

      async loadSaleReturns(signal) {
        set({ error: null, saleReturnsStatus: "loading" }, false, "loadSaleReturns:start");

        try {
          const response = await returnsFacade.listSaleReturns(buildSaleReturnsQueryFromState(get()), signal);

          set(
            {
              error: null,
              saleReturnPagination: response.pagination,
              saleReturns: response.data,
              saleReturnsStatus: response.data.length > 0 ? "success" : "empty"
            },
            false,
            "loadSaleReturns:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          const dataError = createReturnsDataError(error);

          set({ error: dataError, saleReturnsStatus: getReturnsStatusFromError(dataError) }, false, "loadSaleReturns:error");
        }
      },

      reset() {
        set(initialReturnsState, false, "reset");
      },

      selectSaleReturn(saleReturnId) {
        const selectedSaleReturn = saleReturnId && get().selectedSaleReturn?.id === saleReturnId ? get().selectedSaleReturn : null;

        set({ selectedSaleReturn, selectedSaleReturnId: saleReturnId }, false, "selectSaleReturn");
      },

      setCreateReason(createReason) {
        set({ createReason, createStatus: "idle" }, false, "setCreateReason");
      },

      setReturnableFromDate(returnableFromDate) {
        set(
          (state) => ({
            returnableFromDate,
            returnablePagination: {
              ...state.returnablePagination,
              page: 1
            }
          }),
          false,
          "setReturnableFromDate"
        );
      },

      setReturnablePage(page) {
        set(
          (state) => ({
            returnablePagination: {
              ...state.returnablePagination,
              page
            }
          }),
          false,
          "setReturnablePage"
        );
      },

      setReturnablePageSize(pageSize) {
        set(
          {
            returnablePagination: {
              ...initialReturnsPagination,
              pageSize
            }
          },
          false,
          "setReturnablePageSize"
        );
      },

      setReturnableSearch(returnableSearch) {
        set(
          (state) => ({
            returnablePagination: {
              ...state.returnablePagination,
              page: 1
            },
            returnableSearch
          }),
          false,
          "setReturnableSearch"
        );
      },

      setReturnableSellerUserId(returnableSellerUserId) {
        set(
          (state) => ({
            returnablePagination: {
              ...state.returnablePagination,
              page: 1
            },
            returnableSellerUserId
          }),
          false,
          "setReturnableSellerUserId"
        );
      },

      setReturnableToDate(returnableToDate) {
        set(
          (state) => ({
            returnablePagination: {
              ...state.returnablePagination,
              page: 1
            },
            returnableToDate
          }),
          false,
          "setReturnableToDate"
        );
      },

      setSaleReturnActorUserId(saleReturnActorUserId) {
        set(
          (state) => ({
            saleReturnActorUserId,
            saleReturnPagination: {
              ...state.saleReturnPagination,
              page: 1
            }
          }),
          false,
          "setSaleReturnActorUserId"
        );
      },

      setSaleReturnFromDate(saleReturnFromDate) {
        set(
          (state) => ({
            saleReturnFromDate,
            saleReturnPagination: {
              ...state.saleReturnPagination,
              page: 1
            }
          }),
          false,
          "setSaleReturnFromDate"
        );
      },

      setSaleReturnPage(page) {
        set(
          (state) => ({
            saleReturnPagination: {
              ...state.saleReturnPagination,
              page
            }
          }),
          false,
          "setSaleReturnPage"
        );
      },

      setSaleReturnPageSize(pageSize) {
        set(
          {
            saleReturnPagination: {
              ...initialReturnsPagination,
              pageSize
            }
          },
          false,
          "setSaleReturnPageSize"
        );
      },

      setSaleReturnSaleId(saleReturnSaleId) {
        set(
          (state) => ({
            saleReturnPagination: {
              ...state.saleReturnPagination,
              page: 1
            },
            saleReturnSaleId
          }),
          false,
          "setSaleReturnSaleId"
        );
      },

      setSaleReturnSearch(saleReturnSearch) {
        set(
          (state) => ({
            saleReturnPagination: {
              ...state.saleReturnPagination,
              page: 1
            },
            saleReturnSearch
          }),
          false,
          "setSaleReturnSearch"
        );
      },

      setSaleReturnToDate(saleReturnToDate) {
        set(
          (state) => ({
            saleReturnPagination: {
              ...state.saleReturnPagination,
              page: 1
            },
            saleReturnToDate
          }),
          false,
          "setSaleReturnToDate"
        );
      }
    }),
    { name: "ReturnsStore" }
  )
);

export function resetReturnsStore() {
  useReturnsStore.getState().reset();
}
