import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import type { DiscardPendingCart, PendingCart, PendingCartDraft, PendingCartItemInput } from "../types/pendingCartTypes";
import { selectPendingCartsActions, selectPendingCartsState } from "../store/PendingCartsSelectors";
import { usePendingCartsStore } from "../store/PendingCartsStore";

type UsePendingCartsOptions = {
  autoLoadList?: boolean;
  includeAllForSupervision?: boolean;
};

function canUsePendingCarts(roleName?: string): boolean {
  return roleName === "superadmin" || roleName === "admin" || roleName === "seller";
}

function canSupervisePendingCarts(roleName?: string): boolean {
  return roleName === "superadmin" || roleName === "admin";
}

export function usePendingCarts(options: UsePendingCartsOptions = {}) {
  const { autoLoadList = true, includeAllForSupervision = false } = options;
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const pendingState = usePendingCartsStore(useShallow(selectPendingCartsState));
  const pendingActions = usePendingCartsStore(useShallow(selectPendingCartsActions));
  const canUse = canUsePendingCarts(user?.role.name);
  const canSupervise = canSupervisePendingCarts(user?.role.name);

  useEffect(() => {
    pendingActions.setIncludeAll(includeAllForSupervision && canSupervise);
  }, [canSupervise, includeAllForSupervision, pendingActions]);

  const loadPendingCarts = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canUse) {
        pendingActions.reset();
        return;
      }

      await pendingActions.loadPendingCarts(signal);
    },
    [canUse, pendingActions, token]
  );

  useEffect(() => {
    if (!autoLoadList) {
      return;
    }

    const controller = new AbortController();

    void loadPendingCarts(controller.signal);

    return () => controller.abort();
  }, [
    autoLoadList,
    loadPendingCarts,
    pendingState.includeAll,
    pendingState.pagination.page,
    pendingState.pagination.pageSize,
    pendingState.search,
    pendingState.status,
    user?.id
  ]);

  useEffect(() => {
    if (!token || !canUse) {
      pendingActions.reset();
    }
  }, [canUse, pendingActions, token, user?.id]);

  const saveDraft = useCallback(
    async (pendingCartId?: string) => {
      if (!token || !canUse) {
        pendingActions.reset();
        return null;
      }

      return pendingActions.saveDraft(pendingCartId);
    },
    [canUse, pendingActions, token]
  );

  const discardCart = useCallback(
    async (pendingCartId: string, input?: DiscardPendingCart) => {
      if (!token || !canUse) {
        pendingActions.reset();
        return null;
      }

      return pendingActions.discardCart(pendingCartId, input);
    },
    [canUse, pendingActions, token]
  );

  const convertSelectedCart = useCallback(
    async (receivedAmount: number) => {
      if (!token || !canUse) {
        pendingActions.reset();
        return null;
      }

      return pendingActions.convertSelectedCart(receivedAmount);
    },
    [canUse, pendingActions, token]
  );

  const retakeCart = useCallback(
    (pendingCart: PendingCart) => {
      if (!token || !canUse) {
        pendingActions.reset();
        return;
      }

      pendingActions.retakeCart(pendingCart);
    },
    [canUse, pendingActions, token]
  );

  const addDraftItem = useCallback(
    (item: PendingCartItemInput) => {
      if (!token || !canUse) {
        pendingActions.reset();
        return;
      }

      pendingActions.addDraftItem(item);
    },
    [canUse, pendingActions, token]
  );

  const setDraft = useCallback(
    (draft: PendingCartDraft) => {
      if (!token || !canUse) {
        pendingActions.reset();
        return;
      }

      pendingActions.setDraft(draft);
    },
    [canUse, pendingActions, token]
  );

  return useMemo(
    () => ({
      ...pendingState,
      addDraftItem,
      canSupervise,
      canUse,
      clearDraft: pendingActions.clearDraft,
      convertSelectedCart,
      discardCart,
      reload: loadPendingCarts,
      removeDraftItem: pendingActions.removeDraftItem,
      reset: pendingActions.reset,
      retakeCart,
      saveDraft,
      selectCart: pendingActions.selectCart,
      setDraft,
      setDraftField: pendingActions.setDraftField,
      setDraftItemQuantity: pendingActions.setDraftItemQuantity,
      setIncludeAll: pendingActions.setIncludeAll,
      setPage: pendingActions.setPage,
      setPageSize: pendingActions.setPageSize,
      setSearch: pendingActions.setSearch,
      setStatus: pendingActions.setStatus
    }),
    [
      addDraftItem,
      canSupervise,
      canUse,
      convertSelectedCart,
      discardCart,
      loadPendingCarts,
      pendingActions,
      pendingState,
      retakeCart,
      saveDraft,
      setDraft
    ]
  );
}
