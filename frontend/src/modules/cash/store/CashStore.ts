import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { cashFacade } from "../facades/cashFacade";
import { createCashDataError } from "../utils/cashErrors";
import type { CashActions } from "./CashActions";
import { initialCashState, type CashState } from "./CashState";

export type CashStore = CashState & CashActions;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export const useCashStore = create<CashStore>()(
  devtools(
    (set, get) => ({
      ...initialCashState,

      async closeOwnCashSession(input) {
        const cashSessionId = get().current.cashSession?.id;

        if (!cashSessionId) {
          set(
            {
              closeStatus: "error",
              error: {
                code: "not-found",
                statusCode: null
              }
            },
            false,
            "closeOwnCashSession:noCurrentSession"
          );

          return null;
        }

        set({ closeStatus: "loading", error: null }, false, "closeOwnCashSession:start");

        try {
          const cashSession = await cashFacade.closeOwn(cashSessionId, input);

          set(
            {
              closeStatus: "success",
              current: {
                cashSession: null,
                isOpen: false
              },
              error: null,
              lastClosedCashSession: cashSession
            },
            false,
            "closeOwnCashSession:success"
          );

          return cashSession;
        } catch (error) {
          set({ closeStatus: "error", error: createCashDataError(error) }, false, "closeOwnCashSession:error");

          return null;
        }
      },

      async loadCurrentCashSession(signal) {
        set({ currentStatus: "loading", error: null }, false, "loadCurrentCashSession:start");

        try {
          const current = await cashFacade.getCurrent(signal);

          set(
            {
              current,
              currentStatus: "success",
              error: null
            },
            false,
            "loadCurrentCashSession:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          set({ currentStatus: "error", error: createCashDataError(error) }, false, "loadCurrentCashSession:error");
        }
      },

      async openCashSession(input) {
        set({ error: null, openStatus: "loading" }, false, "openCashSession:start");

        try {
          const cashSession = await cashFacade.open(input);

          set(
            {
              current: {
                cashSession,
                isOpen: true
              },
              error: null,
              openStatus: "success"
            },
            false,
            "openCashSession:success"
          );

          return cashSession;
        } catch (error) {
          set({ error: createCashDataError(error), openStatus: "error" }, false, "openCashSession:error");

          return null;
        }
      },

      reset() {
        set(initialCashState, false, "reset");
      }
    }),
    { name: "CashStore" }
  )
);

export function resetCashStore() {
  useCashStore.getState().reset();
}
