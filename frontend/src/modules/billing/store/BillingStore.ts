import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { billingFacade } from "../facades/billingFacade";
import type { BillingDataError, PreparedInvoice, PreparedInvoiceSummary } from "../types/billingTypes";
import { createBillingDataError, getBillingStatusFromError } from "../utils/billingErrors";
import type { BillingActions } from "./BillingActions";
import {
  buildInvoiceableSalesQueryFromState,
  buildPreparedInvoicesQueryFromState,
  initialBillingPagination,
  initialBillingState,
  type BillingState
} from "./BillingState";

export type BillingStore = BillingState & BillingActions;

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

function createLocalError(code: BillingDataError["code"]): BillingDataError {
  return {
    code,
    statusCode: null
  };
}

function toPreparedInvoiceSummary(preparedInvoice: PreparedInvoice): PreparedInvoiceSummary {
  return {
    cancelReason: preparedInvoice.cancelReason,
    cancelledAt: preparedInvoice.cancelledAt,
    cancelledByUser: preparedInvoice.cancelledByUser,
    cancelledByUserId: preparedInvoice.cancelledByUserId,
    cashSessionCode: preparedInvoice.cashSessionCode,
    cashSessionId: preparedInvoice.cashSessionId,
    correlativeCode: preparedInvoice.correlativeCode,
    createdAt: preparedInvoice.createdAt,
    customerBusinessName: preparedInvoice.customerBusinessName,
    customerNit: preparedInvoice.customerNit,
    fiscalNotes: preparedInvoice.fiscalNotes,
    id: preparedInvoice.id,
    preparedAt: preparedInvoice.preparedAt,
    saleCorrelativeCode: preparedInvoice.saleCorrelativeCode,
    saleId: preparedInvoice.saleId,
    sellerEmail: preparedInvoice.sellerEmail,
    sellerName: preparedInvoice.sellerName,
    sellerUserId: preparedInvoice.sellerUserId,
    status: preparedInvoice.status,
    totalAmount: preparedInvoice.totalAmount,
    updatedAt: preparedInvoice.updatedAt
  };
}

function updatePreparedInvoiceSummary(
  items: PreparedInvoiceSummary[],
  preparedInvoice: PreparedInvoice
): PreparedInvoiceSummary[] {
  const summary = toPreparedInvoiceSummary(preparedInvoice);
  const exists = items.some((item) => item.id === preparedInvoice.id);

  return exists ? items.map((item) => (item.id === preparedInvoice.id ? summary : item)) : [summary, ...items];
}

export const useBillingStore = create<BillingStore>()(
  devtools(
    (set, get) => ({
      ...initialBillingState,

      async cancelSelectedPreparedInvoice(input) {
        const state = get();
        const selectedPreparedInvoiceId = state.selectedPreparedInvoiceId;
        const cancelReason = input?.cancelReason ?? state.cancelReason;

        if (!selectedPreparedInvoiceId) {
          return null;
        }

        if (cancelReason.trim().length < 5) {
          set({ cancelStatus: "error", error: createLocalError("validation") }, false, "cancelSelectedPreparedInvoice:invalidReason");
          return null;
        }

        set({ cancelStatus: "loading", error: null }, false, "cancelSelectedPreparedInvoice:start");

        try {
          const preparedInvoice = await billingFacade.cancelPreparedInvoice(selectedPreparedInvoiceId, { cancelReason });

          set(
            (currentState) => ({
              cancelReason: "",
              cancelStatus: "success",
              detailStatus: "success",
              error: null,
              lastPreparedInvoice: preparedInvoice,
              preparedInvoices: updatePreparedInvoiceSummary(currentState.preparedInvoices, preparedInvoice),
              selectedPreparedInvoice: preparedInvoice,
              selectedPreparedInvoiceId: preparedInvoice.id
            }),
            false,
            "cancelSelectedPreparedInvoice:success"
          );

          return preparedInvoice;
        } catch (error) {
          const dataError = createBillingDataError(error);

          set({ cancelStatus: getBillingStatusFromError(dataError), error: dataError }, false, "cancelSelectedPreparedInvoice:error");

          return null;
        }
      },

      clearCancellation() {
        set({ cancelReason: "", cancelStatus: "idle", error: null }, false, "clearCancellation");
      },

      clearPreparation() {
        set({ error: null, lastPreparedInvoice: null, prepareStatus: "idle" }, false, "clearPreparation");
      },

      async loadInvoiceableSales(signal) {
        set({ error: null, invoiceableSalesStatus: "loading" }, false, "loadInvoiceableSales:start");

        try {
          const response = await billingFacade.listInvoiceableSales(buildInvoiceableSalesQueryFromState(get()), signal);

          set(
            {
              error: null,
              invoiceablePagination: response.pagination,
              invoiceableSales: response.data,
              invoiceableSalesStatus: response.data.length > 0 ? "success" : "empty"
            },
            false,
            "loadInvoiceableSales:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          const dataError = createBillingDataError(error);

          set(
            { error: dataError, invoiceableSalesStatus: getBillingStatusFromError(dataError) },
            false,
            "loadInvoiceableSales:error"
          );
        }
      },

      async loadPreparedInvoice(preparedInvoiceId, signal) {
        set(
          { detailStatus: "loading", error: null, selectedPreparedInvoiceId: preparedInvoiceId },
          false,
          "loadPreparedInvoice:start"
        );

        try {
          const preparedInvoice = await billingFacade.getPreparedInvoiceById(preparedInvoiceId, signal);

          set(
            (state) => ({
              detailStatus: "success",
              error: null,
              preparedInvoices: updatePreparedInvoiceSummary(state.preparedInvoices, preparedInvoice),
              selectedPreparedInvoice: preparedInvoice,
              selectedPreparedInvoiceId: preparedInvoice.id
            }),
            false,
            "loadPreparedInvoice:success"
          );

          return preparedInvoice;
        } catch (error) {
          if (isAbortError(error)) {
            return null;
          }

          const dataError = createBillingDataError(error);

          set(
            { detailStatus: getBillingStatusFromError(dataError), error: dataError, selectedPreparedInvoice: null },
            false,
            "loadPreparedInvoice:error"
          );

          return null;
        }
      },

      async loadPreparedInvoices(signal) {
        set({ error: null, preparedInvoicesStatus: "loading" }, false, "loadPreparedInvoices:start");

        try {
          const response = await billingFacade.listPreparedInvoices(buildPreparedInvoicesQueryFromState(get()), signal);

          set(
            {
              error: null,
              preparedInvoicePagination: response.pagination,
              preparedInvoices: response.data,
              preparedInvoicesStatus: response.data.length > 0 ? "success" : "empty"
            },
            false,
            "loadPreparedInvoices:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          const dataError = createBillingDataError(error);

          set(
            { error: dataError, preparedInvoicesStatus: getBillingStatusFromError(dataError) },
            false,
            "loadPreparedInvoices:error"
          );
        }
      },

      async prepareInvoice(input) {
        set({ error: null, prepareStatus: "loading" }, false, "prepareInvoice:start");

        try {
          const preparedInvoice = await billingFacade.prepareInvoice(input);

          set(
            (state) => ({
              error: null,
              lastPreparedInvoice: preparedInvoice,
              prepareStatus: "success",
              preparedInvoices: updatePreparedInvoiceSummary(state.preparedInvoices, preparedInvoice),
              selectedPreparedInvoice: preparedInvoice,
              selectedPreparedInvoiceId: preparedInvoice.id
            }),
            false,
            "prepareInvoice:success"
          );

          return preparedInvoice;
        } catch (error) {
          const dataError = createBillingDataError(error);

          set({ error: dataError, prepareStatus: getBillingStatusFromError(dataError) }, false, "prepareInvoice:error");

          return null;
        }
      },

      reset() {
        set(initialBillingState, false, "reset");
      },

      selectPreparedInvoice(preparedInvoiceId) {
        const selectedPreparedInvoice =
          preparedInvoiceId && get().selectedPreparedInvoice?.id === preparedInvoiceId ? get().selectedPreparedInvoice : null;

        set({ selectedPreparedInvoice, selectedPreparedInvoiceId: preparedInvoiceId }, false, "selectPreparedInvoice");
      },

      setCancelReason(cancelReason) {
        set({ cancelReason, cancelStatus: "idle" }, false, "setCancelReason");
      },

      setInvoiceableFromDate(invoiceableFromDate) {
        set(
          (state) => ({
            invoiceableFromDate,
            invoiceablePagination: {
              ...state.invoiceablePagination,
              page: 1
            }
          }),
          false,
          "setInvoiceableFromDate"
        );
      },

      setInvoiceablePage(page) {
        set(
          (state) => ({
            invoiceablePagination: {
              ...state.invoiceablePagination,
              page
            }
          }),
          false,
          "setInvoiceablePage"
        );
      },

      setInvoiceablePageSize(pageSize) {
        set(
          {
            invoiceablePagination: {
              ...initialBillingPagination,
              pageSize
            }
          },
          false,
          "setInvoiceablePageSize"
        );
      },

      setInvoiceableSearch(invoiceableSearch) {
        set(
          (state) => ({
            invoiceablePagination: {
              ...state.invoiceablePagination,
              page: 1
            },
            invoiceableSearch
          }),
          false,
          "setInvoiceableSearch"
        );
      },

      setInvoiceableSellerUserId(invoiceableSellerUserId) {
        set(
          (state) => ({
            invoiceablePagination: {
              ...state.invoiceablePagination,
              page: 1
            },
            invoiceableSellerUserId
          }),
          false,
          "setInvoiceableSellerUserId"
        );
      },

      setInvoiceableToDate(invoiceableToDate) {
        set(
          (state) => ({
            invoiceablePagination: {
              ...state.invoiceablePagination,
              page: 1
            },
            invoiceableToDate
          }),
          false,
          "setInvoiceableToDate"
        );
      },

      setPreparedInvoiceFromDate(preparedInvoiceFromDate) {
        set(
          (state) => ({
            preparedInvoiceFromDate,
            preparedInvoicePagination: {
              ...state.preparedInvoicePagination,
              page: 1
            }
          }),
          false,
          "setPreparedInvoiceFromDate"
        );
      },

      setPreparedInvoicePage(page) {
        set(
          (state) => ({
            preparedInvoicePagination: {
              ...state.preparedInvoicePagination,
              page
            }
          }),
          false,
          "setPreparedInvoicePage"
        );
      },

      setPreparedInvoicePageSize(pageSize) {
        set(
          {
            preparedInvoicePagination: {
              ...initialBillingPagination,
              pageSize
            }
          },
          false,
          "setPreparedInvoicePageSize"
        );
      },

      setPreparedInvoiceSaleId(preparedInvoiceSaleId) {
        set(
          (state) => ({
            preparedInvoicePagination: {
              ...state.preparedInvoicePagination,
              page: 1
            },
            preparedInvoiceSaleId
          }),
          false,
          "setPreparedInvoiceSaleId"
        );
      },

      setPreparedInvoiceSearch(preparedInvoiceSearch) {
        set(
          (state) => ({
            preparedInvoicePagination: {
              ...state.preparedInvoicePagination,
              page: 1
            },
            preparedInvoiceSearch
          }),
          false,
          "setPreparedInvoiceSearch"
        );
      },

      setPreparedInvoiceStatus(preparedInvoiceStatus) {
        set(
          (state) => ({
            preparedInvoicePagination: {
              ...state.preparedInvoicePagination,
              page: 1
            },
            preparedInvoiceStatus
          }),
          false,
          "setPreparedInvoiceStatus"
        );
      },

      setPreparedInvoiceToDate(preparedInvoiceToDate) {
        set(
          (state) => ({
            preparedInvoicePagination: {
              ...state.preparedInvoicePagination,
              page: 1
            },
            preparedInvoiceToDate
          }),
          false,
          "setPreparedInvoiceToDate"
        );
      }
    }),
    { name: "BillingStore" }
  )
);

export function resetBillingStore() {
  useBillingStore.getState().reset();
}
