import { useCallback, useEffect, useMemo } from "react";
import { isFeatureAllowed } from "@pharmacy-pos/shared";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectStockPlanningActions, selectStockPlanningState } from "../store/StockPlanningSelectors";
import { useStockPlanningStore } from "../store/StockPlanningStore";
import type { StockPlanningFilters } from "../types/stockPlanningTypes";

export function useStockPlanning() {
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const state = useStockPlanningStore(useShallow(selectStockPlanningState));
  const actions = useStockPlanningStore(useShallow(selectStockPlanningActions));
  const canAccess = isFeatureAllowed(user?.role.name, "stockPlanning");
  const canGovern = isFeatureAllowed(user?.role.name, "stockPlanningGovernance");

  const load = useCallback(
    async (filters: StockPlanningFilters = {}, signal?: AbortSignal) => {
      if (!token || !canAccess) {
        actions.reset();
        return;
      }

      await actions.load(filters, signal);
    },
    [actions, canAccess, token]
  );

  const updateProduct = useCallback(
    async (productId: string, input: Parameters<typeof actions.updateProduct>[1]) => {
      if (!token || !canAccess) {
        actions.reset();
        return false;
      }

      return actions.updateProduct(productId, input);
    },
    [actions, canAccess, token]
  );

  const updateConfiguration = useCallback(
    async (input: Parameters<typeof actions.updateConfiguration>[0]) => {
      if (!token || !canGovern) return false;
      return actions.updateConfiguration(input);
    },
    [actions, canGovern, token]
  );

  const runManualExecution = useCallback(async () => {
    if (!token || !canGovern) return false;
    return actions.runManualExecution();
  }, [actions, canGovern, token]);

  const loadDetail = useCallback(
    async (productId: string, executionId?: string, signal?: AbortSignal) => {
      if (!token || !canAccess) {
        actions.reset();
        return;
      }
      await actions.loadDetail(productId, executionId, signal);
    },
    [actions, canAccess, token]
  );

  useEffect(() => {
    if (!token || !canAccess) {
      actions.reset();
      return;
    }

    const controller = new AbortController();

    void actions.load({}, controller.signal);

    return () => controller.abort();
  }, [actions, canAccess, token, user?.id]);

  return useMemo(
    () => ({
      ...state,
      canAccess,
      canGovern,
      clearGovernanceError: actions.clearGovernanceError,
      clearDetail: actions.clearDetail,
      clearUpdateError: actions.clearUpdateError,
      load,
      loadDetail,
      updateProduct,
      updateConfiguration,
      runManualExecution
    }),
    [
      actions.clearGovernanceError,
      actions.clearDetail,
      actions.clearUpdateError,
      canAccess,
      canGovern,
      load,
      loadDetail,
      runManualExecution,
      state,
      updateConfiguration,
      updateProduct
    ]
  );
}
