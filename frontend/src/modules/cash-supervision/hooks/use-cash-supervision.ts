import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import type { CloseSupervisedCashSession } from "../types/cashSupervisionTypes";
import { selectCashSupervisionActions, selectCashSupervisionState } from "../store/CashSupervisionSelectors";
import { useCashSupervisionStore } from "../store/CashSupervisionStore";

type UseCashSupervisionOptions = {
  autoLoadList?: boolean;
};

function canSuperviseCash(roleName?: string): boolean {
  return roleName === "superadmin" || roleName === "admin";
}

export function useCashSupervision(options: UseCashSupervisionOptions = {}) {
  const { autoLoadList = true } = options;
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const cashSupervisionState = useCashSupervisionStore(useShallow(selectCashSupervisionState));
  const cashSupervisionActions = useCashSupervisionStore(useShallow(selectCashSupervisionActions));
  const canSupervise = canSuperviseCash(user?.role.name);

  const loadCashSessions = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canSupervise) {
        cashSupervisionActions.reset();
        return;
      }

      await cashSupervisionActions.loadCashSessions(signal);
    },
    [canSupervise, cashSupervisionActions, token]
  );

  useEffect(() => {
    if (!autoLoadList) {
      return;
    }

    const controller = new AbortController();

    void loadCashSessions(controller.signal);

    return () => controller.abort();
  }, [
    autoLoadList,
    cashSupervisionState.fromDate,
    cashSupervisionState.openedByUserId,
    cashSupervisionState.pagination.page,
    cashSupervisionState.pagination.pageSize,
    cashSupervisionState.status,
    cashSupervisionState.toDate,
    loadCashSessions,
    user?.id
  ]);

  useEffect(() => {
    if (!token || !canSupervise) {
      cashSupervisionActions.reset();
    }
  }, [canSupervise, cashSupervisionActions, token, user?.id]);

  const closeCashSession = useCallback(
    async (cashSessionId: string, input: CloseSupervisedCashSession) => {
      if (!token || !canSupervise) {
        cashSupervisionActions.reset();
        return null;
      }

      return cashSupervisionActions.closeCashSession(cashSessionId, input);
    },
    [canSupervise, cashSupervisionActions, token]
  );

  return useMemo(
    () => ({
      ...cashSupervisionState,
      canSupervise,
      closeCashSession,
      reload: loadCashSessions,
      reset: cashSupervisionActions.reset,
      selectCashSession: cashSupervisionActions.selectCashSession,
      setFromDate: cashSupervisionActions.setFromDate,
      setOpenedByUserId: cashSupervisionActions.setOpenedByUserId,
      setPage: cashSupervisionActions.setPage,
      setPageSize: cashSupervisionActions.setPageSize,
      setStatus: cashSupervisionActions.setStatus,
      setToDate: cashSupervisionActions.setToDate
    }),
    [canSupervise, cashSupervisionActions, cashSupervisionState, closeCashSession, loadCashSessions]
  );
}
