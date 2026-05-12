import { useCallback, useEffect, useMemo } from "react";
import type { CreateSupplier, UpdateSupplier } from "@pharmacy-pos/shared";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectSuppliersActions, selectSuppliersState } from "../store/SuppliersSelectors";
import { useSuppliersStore } from "../store/SuppliersStore";

type UseSuppliersOptions = {
  autoLoadList?: boolean;
};

export function useSuppliers(options: UseSuppliersOptions = {}) {
  const { autoLoadList = true } = options;
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const supplierState = useSuppliersStore(useShallow(selectSuppliersState));
  const supplierActions = useSuppliersStore(useShallow(selectSuppliersActions));
  const canManage = user?.role.name === "superadmin" || user?.role.name === "admin";

  const loadSuppliers = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canManage) {
        supplierActions.reset();
        return;
      }

      await supplierActions.loadSuppliers(signal);
    },
    [canManage, supplierActions, token]
  );

  useEffect(() => {
    if (!autoLoadList) {
      return;
    }

    const controller = new AbortController();

    void loadSuppliers(controller.signal);

    return () => controller.abort();
  }, [autoLoadList, loadSuppliers, supplierState.pagination.page, supplierState.pagination.pageSize, supplierState.search, supplierState.status]);

  const loadSupplier = useCallback(
    async (supplierId: string, signal?: AbortSignal) => {
      if (!token || !canManage) {
        supplierActions.reset();
        return null;
      }

      return supplierActions.loadSupplier(supplierId, signal);
    },
    [canManage, supplierActions, token]
  );

  const createSupplier = useCallback(
    async (input?: CreateSupplier) => {
      if (!token || !canManage) {
        return null;
      }

      return supplierActions.createSupplier(input);
    },
    [canManage, supplierActions, token]
  );

  const updateSupplier = useCallback(
    async (supplierId: string, input?: UpdateSupplier) => {
      if (!token || !canManage) {
        return null;
      }

      return supplierActions.updateSupplier(supplierId, input);
    },
    [canManage, supplierActions, token]
  );

  const saveDraftForm = useCallback(
    async (supplierId?: string) => {
      if (!token || !canManage) {
        return null;
      }

      return supplierActions.saveDraftForm(supplierId);
    },
    [canManage, supplierActions, token]
  );

  return useMemo(
    () => ({
      ...supplierState,
      canManage,
      createSupplier,
      loadSupplier,
      reload: loadSuppliers,
      resetDraftForm: supplierActions.resetDraftForm,
      saveDraftForm,
      setDraftField: supplierActions.setDraftField,
      setDraftForm: supplierActions.setDraftForm,
      setPage: supplierActions.setPage,
      setPageSize: supplierActions.setPageSize,
      setSearch: supplierActions.setSearch,
      setSelectedSupplier: supplierActions.setSelectedSupplier,
      setStatus: supplierActions.setStatus,
      updateSupplier
    }),
    [canManage, createSupplier, loadSupplier, loadSuppliers, saveDraftForm, supplierActions, supplierState, updateSupplier]
  );
}
