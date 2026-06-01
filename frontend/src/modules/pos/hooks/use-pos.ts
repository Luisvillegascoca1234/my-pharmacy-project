import { useCallback, useEffect, useMemo } from "react";
import type { PosProduct } from "@pharmacy-pos/shared";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectPosActions, selectPosState } from "../store/PosSelectors";
import { usePosStore } from "../store/PosStore";

type UsePosOptions = {
  autoSearchProducts?: boolean;
};

function canUsePos(roleName?: string): boolean {
  return roleName === "superadmin" || roleName === "admin" || roleName === "seller";
}

export function usePos(options: UsePosOptions = {}) {
  const { autoSearchProducts = false } = options;
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const posState = usePosStore(useShallow(selectPosState));
  const posActions = usePosStore(useShallow(selectPosActions));
  const canSell = canUsePos(user?.role.name);

  const searchProducts = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canSell) {
        posActions.reset();
        return;
      }

      await posActions.searchProducts(signal);
    },
    [canSell, posActions, token]
  );

  useEffect(() => {
    if (!autoSearchProducts) {
      return;
    }

    const controller = new AbortController();

    void searchProducts(controller.signal);

    return () => controller.abort();
  }, [autoSearchProducts, posState.code, posState.pagination.page, posState.pagination.pageSize, posState.search, searchProducts]);

  useEffect(() => {
    if (!token || !canSell) {
      posActions.reset();
    }
  }, [canSell, posActions, token, user?.id]);

  const addCartItem = useCallback(
    (product: PosProduct, quantity?: number) => {
      if (!token || !canSell) {
        posActions.reset();
        return;
      }

      posActions.addCartItem(product, quantity);
    },
    [canSell, posActions, token]
  );

  const confirmCashSale = useCallback(
    async (receivedAmount: number) => {
      if (!token || !canSell) {
        posActions.reset();
        return null;
      }

      return posActions.confirmCashSale(receivedAmount);
    },
    [canSell, posActions, token]
  );

  return useMemo(
    () => ({
      ...posState,
      addCartItem,
      canSell,
      clearCart: posActions.clearCart,
      confirmCashSale,
      removeCartItem: posActions.removeCartItem,
      replaceCartItems: posActions.replaceCartItems,
      reset: posActions.reset,
      resetCheckout: posActions.resetCheckout,
      searchProducts,
      setConfirmedSale: posActions.setConfirmedSale,
      setCode: posActions.setCode,
      setPage: posActions.setPage,
      setPageSize: posActions.setPageSize,
      setSearch: posActions.setSearch,
      updateCartItemQuantity: posActions.updateCartItemQuantity
    }),
    [addCartItem, canSell, confirmCashSale, posActions, posState, searchProducts]
  );
}
