import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectSalesActions, selectSalesState } from "../store/SalesSelectors";
import { useSalesStore } from "../store/SalesStore";

type UseSalesOptions = {
  autoLoadList?: boolean;
};

function canUseSales(roleName?: string): boolean {
  return roleName === "superadmin" || roleName === "admin" || roleName === "seller";
}

function canSuperviseSales(roleName?: string): boolean {
  return roleName === "superadmin" || roleName === "admin";
}

export function useSales(options: UseSalesOptions = {}) {
  const { autoLoadList = true } = options;
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const salesState = useSalesStore(useShallow(selectSalesState));
  const salesActions = useSalesStore(useShallow(selectSalesActions));
  const canUse = canUseSales(user?.role.name);
  const canSupervise = canSuperviseSales(user?.role.name);

  const loadSales = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canUse) {
        salesActions.reset();
        return;
      }

      await salesActions.loadSales(signal);
    },
    [canUse, salesActions, token]
  );

  useEffect(() => {
    if (!autoLoadList) {
      return;
    }

    const controller = new AbortController();

    void loadSales(controller.signal);

    return () => controller.abort();
  }, [
    autoLoadList,
    loadSales,
    salesState.cashSessionId,
    salesState.fromDate,
    salesState.pagination.page,
    salesState.pagination.pageSize,
    salesState.search,
    salesState.sellerUserId,
    salesState.status,
    salesState.toDate,
    user?.id
  ]);

  useEffect(() => {
    if (!token || !canUse) {
      salesActions.reset();
    }
  }, [canUse, salesActions, token, user?.id]);

  const loadSale = useCallback(
    async (saleId: string, signal?: AbortSignal) => {
      if (!token || !canUse) {
        salesActions.reset();
        return null;
      }

      return salesActions.loadSale(saleId, signal);
    },
    [canUse, salesActions, token]
  );

  const cancelSelectedSale = useCallback(
    async (cancelReason?: string) => {
      if (!token || !canUse) {
        salesActions.reset();
        return null;
      }

      return salesActions.cancelSelectedSale(cancelReason);
    },
    [canUse, salesActions, token]
  );

  return useMemo(
    () => ({
      ...salesState,
      canSupervise,
      canUse,
      cancelSelectedSale,
      clearCancellation: salesActions.clearCancellation,
      loadSale,
      reload: loadSales,
      reset: salesActions.reset,
      selectSale: salesActions.selectSale,
      setCancelReason: salesActions.setCancelReason,
      setCashSessionId: salesActions.setCashSessionId,
      setFromDate: salesActions.setFromDate,
      setPage: salesActions.setPage,
      setPageSize: salesActions.setPageSize,
      setSearch: salesActions.setSearch,
      setSellerUserId: salesActions.setSellerUserId,
      setStatus: salesActions.setStatus,
      setToDate: salesActions.setToDate
    }),
    [canSupervise, canUse, cancelSelectedSale, loadSale, loadSales, salesActions, salesState]
  );
}
