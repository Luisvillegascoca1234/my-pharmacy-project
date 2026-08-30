import { useCallback, useEffect, useMemo } from "react";
import { isFeatureAllowed } from "@pharmacy-pos/shared";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectExportsActions, selectExportsState } from "../store/ExportsSelectors";
import { useExportsStore } from "../store/ExportsStore";

export function useExports() {
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const exportsState = useExportsStore(useShallow(selectExportsState));
  const exportsActions = useExportsStore(useShallow(selectExportsActions));
  const canDownloadExports = isFeatureAllowed(user?.role.name, "exports");

  const downloadSalesCsv = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canDownloadExports) {
        exportsActions.reset();
        return null;
      }

      return exportsActions.downloadSalesCsv(signal);
    },
    [canDownloadExports, exportsActions, token]
  );

  const downloadInventoryMovementsCsv = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canDownloadExports) {
        exportsActions.reset();
        return null;
      }

      return exportsActions.downloadInventoryMovementsCsv(signal);
    },
    [canDownloadExports, exportsActions, token]
  );

  const downloadStockPlanningObservationsParquet = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canDownloadExports) {
        exportsActions.reset();
        return null;
      }
      return exportsActions.downloadStockPlanningObservationsParquet(signal);
    },
    [canDownloadExports, exportsActions, token]
  );

  const downloadStockPlanningResultsParquet = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canDownloadExports) {
        exportsActions.reset();
        return null;
      }
      return exportsActions.downloadStockPlanningResultsParquet(signal);
    },
    [canDownloadExports, exportsActions, token]
  );

  useEffect(() => {
    if (!token || !canDownloadExports) {
      exportsActions.reset();
    }
  }, [canDownloadExports, exportsActions, token, user?.id]);

  return useMemo(
    () => ({
      ...exportsState,
      canDownloadExports,
      clearInventoryMovementsExport: exportsActions.clearInventoryMovementsExport,
      clearSalesExport: exportsActions.clearSalesExport,
      downloadInventoryMovementsCsv,
      downloadSalesCsv,
      downloadStockPlanningObservationsParquet,
      downloadStockPlanningResultsParquet,
      reset: exportsActions.reset,
      setInventoryMovementsFromDate: exportsActions.setInventoryMovementsFromDate,
      setInventoryMovementsToDate: exportsActions.setInventoryMovementsToDate,
      setSalesFromDate: exportsActions.setSalesFromDate,
      setSalesToDate: exportsActions.setSalesToDate,
      setStockPlanningFilters: exportsActions.setStockPlanningFilters,
      clearStockPlanningObservationsExport: exportsActions.clearStockPlanningObservationsExport,
      clearStockPlanningResultsExport: exportsActions.clearStockPlanningResultsExport
    }),
    [
      canDownloadExports,
      downloadInventoryMovementsCsv,
      downloadSalesCsv,
      downloadStockPlanningObservationsParquet,
      downloadStockPlanningResultsParquet,
      exportsActions,
      exportsState
    ]
  );
}
