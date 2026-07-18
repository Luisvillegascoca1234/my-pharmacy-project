import { useCallback, useEffect, useMemo } from "react";
import { isFeatureAllowed, type CloseCashSession, type OpenCashSession } from "@pharmacy-pos/shared";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectCashActions, selectCashState } from "../store/CashSelectors";
import { useCashStore } from "../store/CashStore";

type UseCashSessionOptions = {
  autoLoadCurrent?: boolean;
};

export function useCashSession(options: UseCashSessionOptions = {}) {
  const { autoLoadCurrent = true } = options;
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const cashState = useCashStore(useShallow(selectCashState));
  const cashActions = useCashStore(useShallow(selectCashActions));
  const canUseCash = isFeatureAllowed(user?.role.name, "cash");
  const canSupervise = isFeatureAllowed(user?.role.name, "supervision");

  const loadCurrentCashSession = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canUseCash) {
        cashActions.reset();
        return;
      }

      await cashActions.loadCurrentCashSession(signal);
    },
    [canUseCash, cashActions, token]
  );

  useEffect(() => {
    if (!autoLoadCurrent) {
      return;
    }

    const controller = new AbortController();

    void loadCurrentCashSession(controller.signal);

    return () => controller.abort();
  }, [autoLoadCurrent, loadCurrentCashSession, user?.id]);

  const openCashSession = useCallback(
    async (input: OpenCashSession) => {
      if (!token || !canUseCash) {
        cashActions.reset();
        return null;
      }

      return cashActions.openCashSession(input);
    },
    [canUseCash, cashActions, token]
  );

  const closeOwnCashSession = useCallback(
    async (input: CloseCashSession) => {
      if (!token || !canUseCash) {
        cashActions.reset();
        return null;
      }

      return cashActions.closeOwnCashSession(input);
    },
    [canUseCash, cashActions, token]
  );

  return useMemo(
    () => ({
      ...cashState,
      canSupervise,
      canUseCash,
      closeOwnCashSession,
      loadCurrentCashSession,
      openCashSession,
      reset: cashActions.reset
    }),
    [canSupervise, canUseCash, cashActions.reset, cashState, closeOwnCashSession, loadCurrentCashSession, openCashSession]
  );
}
