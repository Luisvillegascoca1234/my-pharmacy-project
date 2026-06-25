import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectExportsActions, selectExportsState } from "../store/ExportsSelectors";
import { useExportsStore } from "../store/ExportsStore";

function canUseExports(roleName?: string): boolean {
  return roleName === "superadmin" || roleName === "admin";
}

export function useExports() {
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const exportsState = useExportsStore(useShallow(selectExportsState));
  const exportsActions = useExportsStore(useShallow(selectExportsActions));
  const canDownloadExports = canUseExports(user?.role.name);

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
      reset: exportsActions.reset,
      setInventoryMovementsFromDate: exportsActions.setInventoryMovementsFromDate,
      setInventoryMovementsToDate: exportsActions.setInventoryMovementsToDate,
      setSalesFromDate: exportsActions.setSalesFromDate,
      setSalesToDate: exportsActions.setSalesToDate
    }),
    [canDownloadExports, downloadInventoryMovementsCsv, downloadSalesCsv, exportsActions, exportsState]
  );
}
