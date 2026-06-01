import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { cashSupervisionFacade } from "../facades/cashSupervisionFacade";
import { createCashSupervisionDataError, getCashSupervisionStatusFromError } from "../utils/cashSupervisionErrors";
import type { CashSupervisionActions } from "./CashSupervisionActions";
import {
  buildCashSupervisionQueryFromState,
  initialCashSupervisionPagination,
  initialCashSupervisionState,
  type CashSupervisionState
} from "./CashSupervisionState";

export type CashSupervisionStore = CashSupervisionState & CashSupervisionActions;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export const useCashSupervisionStore = create<CashSupervisionStore>()(
  devtools(
    (set, get) => ({
      ...initialCashSupervisionState,

      async closeCashSession(cashSessionId, input) {
        set({ closeStatus: "loading", error: null }, false, "closeCashSession:start");

        try {
          const cashSession = await cashSupervisionFacade.close(cashSessionId, input);

          set(
            (state) => ({
              closeStatus: "success",
              error: null,
              items: state.items.map((item) => (item.id === cashSession.id ? cashSession : item)),
              lastClosedCashSession: cashSession,
              selectedCashSession: state.selectedCashSessionId === cashSession.id ? cashSession : state.selectedCashSession
            }),
            false,
            "closeCashSession:success"
          );

          return cashSession;
        } catch (error) {
          const dataError = createCashSupervisionDataError(error);

          set({ closeStatus: getCashSupervisionStatusFromError(dataError), error: dataError }, false, "closeCashSession:error");

          return null;
        }
      },

      async loadCashSessions(signal) {
        set({ error: null, listStatus: "loading" }, false, "loadCashSessions:start");

        try {
          const response = await cashSupervisionFacade.list(buildCashSupervisionQueryFromState(get()), signal);

          set(
            {
              error: null,
              items: response.data,
              listStatus: response.data.length > 0 ? "success" : "empty",
              pagination: response.pagination
            },
            false,
            "loadCashSessions:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          const dataError = createCashSupervisionDataError(error);

          set({ error: dataError, listStatus: getCashSupervisionStatusFromError(dataError) }, false, "loadCashSessions:error");
        }
      },

      reset() {
        set(initialCashSupervisionState, false, "reset");
      },

      selectCashSession(cashSessionId) {
        const selectedCashSession = cashSessionId ? get().items.find((item) => item.id === cashSessionId) ?? null : null;

        set({ selectedCashSession, selectedCashSessionId: cashSessionId }, false, "selectCashSession");
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

      setOpenedByUserId(openedByUserId) {
        set(
          (state) => ({
            openedByUserId,
            pagination: {
              ...state.pagination,
              page: 1
            }
          }),
          false,
          "setOpenedByUserId"
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
              ...initialCashSupervisionPagination,
              pageSize
            }
          },
          false,
          "setPageSize"
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
    { name: "CashSupervisionStore" }
  )
);

export function resetCashSupervisionStore() {
  useCashSupervisionStore.getState().reset();
}
