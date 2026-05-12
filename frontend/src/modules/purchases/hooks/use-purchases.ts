import { useCallback, useEffect, useMemo } from "react";
import type { CancelPurchase, ReceivePurchase } from "@pharmacy-pos/shared";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectPurchasesActions, selectPurchasesState } from "../store/PurchasesSelectors";
import { usePurchasesStore } from "../store/PurchasesStore";

type UsePurchasesOptions = {
  autoLoadList?: boolean;
};

export function usePurchases(options: UsePurchasesOptions = {}) {
  const { autoLoadList = true } = options;
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const purchaseState = usePurchasesStore(useShallow(selectPurchasesState));
  const purchaseActions = usePurchasesStore(useShallow(selectPurchasesActions));
  const canManage = user?.role.name === "superadmin" || user?.role.name === "admin";

  const loadPurchases = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canManage) {
        purchaseActions.reset();
        return;
      }

      await purchaseActions.loadPurchases(signal);
    },
    [canManage, purchaseActions, token]
  );

  useEffect(() => {
    if (!autoLoadList) {
      return;
    }

    const controller = new AbortController();

    void loadPurchases(controller.signal);

    return () => controller.abort();
  }, [
    autoLoadList,
    loadPurchases,
    purchaseState.fromDate,
    purchaseState.pagination.page,
    purchaseState.pagination.pageSize,
    purchaseState.search,
    purchaseState.status,
    purchaseState.supplierId,
    purchaseState.toDate
  ]);

  const loadPurchase = useCallback(
    async (purchaseId: string, signal?: AbortSignal) => {
      if (!token || !canManage) {
        purchaseActions.reset();
        return null;
      }

      return purchaseActions.loadPurchase(purchaseId, signal);
    },
    [canManage, purchaseActions, token]
  );

  const receivePurchase = useCallback(
    async (purchaseId: string, input: ReceivePurchase) => {
      if (!token || !canManage) {
        return null;
      }

      return purchaseActions.receivePurchase(purchaseId, input);
    },
    [canManage, purchaseActions, token]
  );

  const cancelPurchase = useCallback(
    async (purchaseId: string, input: CancelPurchase) => {
      if (!token || !canManage) {
        return null;
      }

      return purchaseActions.cancelPurchase(purchaseId, input);
    },
    [canManage, purchaseActions, token]
  );

  const saveDraftForm = useCallback(
    async (purchaseId?: string) => {
      if (!token || !canManage) {
        return null;
      }

      return purchaseActions.saveDraftForm(purchaseId);
    },
    [canManage, purchaseActions, token]
  );

  return useMemo(
    () => ({
      ...purchaseState,
      addDraftItem: purchaseActions.addDraftItem,
      canManage,
      cancelPurchase,
      loadPurchase,
      receivePurchase,
      reload: loadPurchases,
      removeDraftItem: purchaseActions.removeDraftItem,
      resetDraftForm: purchaseActions.resetDraftForm,
      saveDraftForm,
      setDraftField: purchaseActions.setDraftField,
      setDraftItemField: purchaseActions.setDraftItemField,
      setFromDate: purchaseActions.setFromDate,
      setPage: purchaseActions.setPage,
      setPageSize: purchaseActions.setPageSize,
      setSearch: purchaseActions.setSearch,
      setStatus: purchaseActions.setStatus,
      setSupplierId: purchaseActions.setSupplierId,
      setToDate: purchaseActions.setToDate
    }),
    [
      canManage,
      cancelPurchase,
      loadPurchase,
      loadPurchases,
      purchaseActions,
      purchaseState,
      receivePurchase,
      saveDraftForm
    ]
  );
}
