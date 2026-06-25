import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectReturnsActions, selectReturnsState } from "../store/ReturnsSelectors";
import { useReturnsStore } from "../store/ReturnsStore";
import type { CreateTotalSaleReturn } from "../types/returnsTypes";

type UseReturnsOptions = {
  autoLoadReturnableSales?: boolean;
  autoLoadSaleReturns?: boolean;
};

function canUseAdministrativeReturns(roleName?: string): boolean {
  return roleName === "superadmin" || roleName === "admin";
}

export function useReturns(options: UseReturnsOptions = {}) {
  const { autoLoadReturnableSales = false, autoLoadSaleReturns = true } = options;
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const returnsState = useReturnsStore(useShallow(selectReturnsState));
  const returnsActions = useReturnsStore(useShallow(selectReturnsActions));
  const canUseReturns = canUseAdministrativeReturns(user?.role.name);

  const loadReturnableSales = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canUseReturns) {
        returnsActions.reset();
        return;
      }

      await returnsActions.loadReturnableSales(signal);
    },
    [canUseReturns, returnsActions, token]
  );

  const loadSaleReturns = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canUseReturns) {
        returnsActions.reset();
        return;
      }

      await returnsActions.loadSaleReturns(signal);
    },
    [canUseReturns, returnsActions, token]
  );

  useEffect(() => {
    if (!autoLoadReturnableSales) {
      return;
    }

    const controller = new AbortController();

    void loadReturnableSales(controller.signal);

    return () => controller.abort();
  }, [
    autoLoadReturnableSales,
    loadReturnableSales,
    returnsState.returnableFromDate,
    returnsState.returnablePagination.page,
    returnsState.returnablePagination.pageSize,
    returnsState.returnableSearch,
    returnsState.returnableSellerUserId,
    returnsState.returnableToDate,
    user?.id
  ]);

  useEffect(() => {
    if (!autoLoadSaleReturns) {
      return;
    }

    const controller = new AbortController();

    void loadSaleReturns(controller.signal);

    return () => controller.abort();
  }, [
    autoLoadSaleReturns,
    loadSaleReturns,
    returnsState.saleReturnActorUserId,
    returnsState.saleReturnFromDate,
    returnsState.saleReturnPagination.page,
    returnsState.saleReturnPagination.pageSize,
    returnsState.saleReturnSaleId,
    returnsState.saleReturnSearch,
    returnsState.saleReturnToDate,
    user?.id
  ]);

  useEffect(() => {
    if (!token || !canUseReturns) {
      returnsActions.reset();
    }
  }, [canUseReturns, returnsActions, token, user?.id]);

  const loadSaleReturn = useCallback(
    async (saleReturnId: string, signal?: AbortSignal) => {
      if (!token || !canUseReturns) {
        returnsActions.reset();
        return null;
      }

      return returnsActions.loadSaleReturn(saleReturnId, signal);
    },
    [canUseReturns, returnsActions, token]
  );

  const createTotalSaleReturn = useCallback(
    async (input: CreateTotalSaleReturn) => {
      if (!token || !canUseReturns) {
        returnsActions.reset();
        return null;
      }

      return returnsActions.createTotalSaleReturn(input);
    },
    [canUseReturns, returnsActions, token]
  );

  return useMemo(
    () => ({
      ...returnsState,
      canUseReturns,
      clearCreation: returnsActions.clearCreation,
      createTotalSaleReturn,
      loadSaleReturn,
      reloadReturnableSales: loadReturnableSales,
      reloadSaleReturns: loadSaleReturns,
      reset: returnsActions.reset,
      selectSaleReturn: returnsActions.selectSaleReturn,
      setReturnableFromDate: returnsActions.setReturnableFromDate,
      setReturnablePage: returnsActions.setReturnablePage,
      setReturnableSearch: returnsActions.setReturnableSearch,
      setReturnableSellerUserId: returnsActions.setReturnableSellerUserId,
      setReturnableToDate: returnsActions.setReturnableToDate,
      setSaleReturnActorUserId: returnsActions.setSaleReturnActorUserId,
      setSaleReturnFromDate: returnsActions.setSaleReturnFromDate,
      setSaleReturnPage: returnsActions.setSaleReturnPage,
      setSaleReturnSaleId: returnsActions.setSaleReturnSaleId,
      setSaleReturnSearch: returnsActions.setSaleReturnSearch,
      setSaleReturnToDate: returnsActions.setSaleReturnToDate
    }),
    [canUseReturns, createTotalSaleReturn, loadReturnableSales, loadSaleReturn, loadSaleReturns, returnsActions, returnsState]
  );
}
