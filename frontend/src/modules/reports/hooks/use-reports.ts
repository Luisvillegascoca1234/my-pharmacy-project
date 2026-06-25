import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectReportsActions, selectReportsState } from "../store/ReportsSelectors";
import { useReportsStore } from "../store/ReportsStore";

type UseReportsOptions = {
  autoLoadDailySales?: boolean;
  autoLoadExpiringProducts?: boolean;
  autoLoadInventoryValuation?: boolean;
};

function canUseReports(roleName?: string): boolean {
  return roleName === "superadmin" || roleName === "admin";
}

export function useReports(options: UseReportsOptions = {}) {
  const { autoLoadDailySales = false, autoLoadExpiringProducts = false, autoLoadInventoryValuation = false } = options;
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const reportsState = useReportsStore(useShallow(selectReportsState));
  const reportsActions = useReportsStore(useShallow(selectReportsActions));
  const canReadReports = canUseReports(user?.role.name);

  const loadDailySalesReport = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canReadReports) {
        reportsActions.reset();
        return;
      }

      await reportsActions.loadDailySalesReport(signal);
    },
    [canReadReports, reportsActions, token]
  );

  const loadExpiringProductsReport = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canReadReports) {
        reportsActions.reset();
        return;
      }

      await reportsActions.loadExpiringProductsReport(signal);
    },
    [canReadReports, reportsActions, token]
  );

  const loadInventoryValuationReport = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canReadReports) {
        reportsActions.reset();
        return;
      }

      await reportsActions.loadInventoryValuationReport(signal);
    },
    [canReadReports, reportsActions, token]
  );

  useEffect(() => {
    if (!autoLoadDailySales) {
      return;
    }

    const controller = new AbortController();

    void loadDailySalesReport(controller.signal);

    return () => controller.abort();
  }, [autoLoadDailySales, loadDailySalesReport, reportsState.dailySalesFromDate, reportsState.dailySalesToDate, user?.id]);

  useEffect(() => {
    if (!autoLoadExpiringProducts) {
      return;
    }

    const controller = new AbortController();

    void loadExpiringProductsReport(controller.signal);

    return () => controller.abort();
  }, [
    autoLoadExpiringProducts,
    loadExpiringProductsReport,
    reportsState.expiringDays,
    reportsState.expiringProductId,
    reportsState.expiringSearch,
    user?.id
  ]);

  useEffect(() => {
    if (!autoLoadInventoryValuation) {
      return;
    }

    const controller = new AbortController();

    void loadInventoryValuationReport(controller.signal);

    return () => controller.abort();
  }, [
    autoLoadInventoryValuation,
    loadInventoryValuationReport,
    reportsState.inventoryValuationProductId,
    reportsState.inventoryValuationSearch,
    user?.id
  ]);

  useEffect(() => {
    if (!token || !canReadReports) {
      reportsActions.reset();
    }
  }, [canReadReports, reportsActions, token, user?.id]);

  return useMemo(
    () => ({
      ...reportsState,
      canReadReports,
      loadDailySalesReport,
      loadExpiringProductsReport,
      loadInventoryValuationReport,
      reset: reportsActions.reset,
      setDailySalesFromDate: reportsActions.setDailySalesFromDate,
      setDailySalesToDate: reportsActions.setDailySalesToDate,
      setExpiringDays: reportsActions.setExpiringDays,
      setExpiringProductId: reportsActions.setExpiringProductId,
      setExpiringSearch: reportsActions.setExpiringSearch,
      setInventoryValuationProductId: reportsActions.setInventoryValuationProductId,
      setInventoryValuationSearch: reportsActions.setInventoryValuationSearch
    }),
    [
      canReadReports,
      loadDailySalesReport,
      loadExpiringProductsReport,
      loadInventoryValuationReport,
      reportsActions,
      reportsState
    ]
  );
}
