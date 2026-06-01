import type { PosProduct } from "@pharmacy-pos/shared";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { posFacade } from "../facades/posFacade";
import { calculatePosCartTotals, createPosCartItem, updatePosCartItemQuantity } from "../utils/posCart";
import { createPosDataError } from "../utils/posErrors";
import { normalizeNonNegativeMoney, normalizePositiveInteger } from "../utils/posMoney";
import type { PosDataError } from "../types/posTypes";
import type { PosActions } from "./PosActions";
import { buildPosSearchQuery, initialPosPagination, initialPosState, type PosState } from "./PosState";

export type PosStore = PosState & PosActions;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function createLocalError(code: PosDataError["code"], productId?: string): PosDataError {
  return {
    code,
    productId,
    statusCode: null
  };
}

function clampQuantityToStock(quantity: number, product: Pick<PosProduct, "id" | "saleableStock">): { error: PosDataError | null; quantity: number } {
  const normalizedQuantity = normalizePositiveInteger(quantity);

  if (product.saleableStock <= 0) {
    return {
      error: createLocalError("stock-insufficient", product.id),
      quantity: 0
    };
  }

  if (normalizedQuantity > product.saleableStock) {
    return {
      error: createLocalError("stock-insufficient", product.id),
      quantity: product.saleableStock
    };
  }

  return {
    error: null,
    quantity: normalizedQuantity
  };
}

function rebuildCartState(items: PosState["cartItems"]) {
  const cartTotals = calculatePosCartTotals(items);

  return {
    cartItems: items,
    cartTotals
  };
}

export const usePosStore = create<PosStore>()(
  devtools(
    (set, get) => ({
      ...initialPosState,

      addCartItem(product, quantity = 1) {
        const state = get();
        const existingItem = state.cartItems.find((item) => item.productId === product.id);
        const requestedQuantity = existingItem ? existingItem.quantity + normalizePositiveInteger(quantity) : quantity;
        const quantityState = clampQuantityToStock(requestedQuantity, product);

        if (quantityState.quantity === 0) {
          set({ error: quantityState.error }, false, "addCartItem:stockInsufficient");
          return;
        }

        const nextItems = existingItem
          ? state.cartItems.map((item) => (item.productId === product.id ? updatePosCartItemQuantity(item, quantityState.quantity) : item))
          : [...state.cartItems, createPosCartItem(product, quantityState.quantity)];

        set(
          {
            ...rebuildCartState(nextItems),
            confirmedSale: null,
            error: quantityState.error,
            receipt: null,
            saleStatus: "idle"
          },
          false,
          "addCartItem"
        );
      },

      clearCart() {
        set(
          {
            ...rebuildCartState([]),
            error: null,
            saleStatus: "idle"
          },
          false,
          "clearCart"
        );
      },

      async confirmCashSale(receivedAmount) {
        const state = get();
        const paymentReceivedAmount = normalizeNonNegativeMoney(receivedAmount);

        if (state.cartItems.length === 0) {
          set({ error: createLocalError("cart-empty"), saleStatus: "error" }, false, "confirmCashSale:cartEmpty");
          return null;
        }

        if (paymentReceivedAmount < state.cartTotals.totalAmount) {
          set(
            {
              error: createLocalError("payment-insufficient"),
              saleStatus: "error"
            },
            false,
            "confirmCashSale:paymentInsufficient"
          );

          return null;
        }

        set(
          {
            error: null,
            saleStatus: "loading"
          },
          false,
          "confirmCashSale:start"
        );

        try {
          const sale = await posFacade.confirmCashSale(state.cartItems, paymentReceivedAmount);

          set(
            {
              ...rebuildCartState([]),
              confirmedSale: sale,
              error: null,
              receipt: sale.receipt,
              saleStatus: "success"
            },
            false,
            "confirmCashSale:success"
          );

          return sale;
        } catch (error) {
          set({ error: createPosDataError(error), saleStatus: "error" }, false, "confirmCashSale:error");

          return null;
        }
      },

      removeCartItem(productId) {
        const state = get();
        const nextItems = state.cartItems.filter((item) => item.productId !== productId);

        set(
          {
            ...rebuildCartState(nextItems),
            error: null,
            saleStatus: "idle"
          },
          false,
          "removeCartItem"
        );
      },

      replaceCartItems(items) {
        set(
          {
            ...rebuildCartState(items),
            confirmedSale: null,
            error: null,
            receipt: null,
            saleStatus: "idle"
          },
          false,
          "replaceCartItems"
        );
      },

      reset() {
        set(initialPosState, false, "reset");
      },

      resetCheckout() {
        set(
          {
            confirmedSale: null,
            error: null,
            receipt: null,
            saleStatus: "idle"
          },
          false,
          "resetCheckout"
        );
      },

      setConfirmedSale(sale) {
        set(
          {
            ...rebuildCartState([]),
            confirmedSale: sale,
            error: null,
            receipt: sale.receipt,
            saleStatus: "success"
          },
          false,
          "setConfirmedSale"
        );
      },

      async searchProducts(signal) {
        set({ error: null, searchStatus: "loading" }, false, "searchProducts:start");

        try {
          const response = await posFacade.searchProducts(buildPosSearchQuery(get()), signal);

          set(
            {
              error: null,
              pagination: response.pagination,
              searchResults: response.data,
              searchStatus: "success"
            },
            false,
            "searchProducts:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          set({ error: createPosDataError(error), searchStatus: "error" }, false, "searchProducts:error");
        }
      },

      setCode(code) {
        set(
          (state) => ({
            code,
            pagination: {
              ...state.pagination,
              page: 1
            }
          }),
          false,
          "setCode"
        );
      },

      setPage(page) {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              page
            }
          }),
          false,
          "setPage"
        );
      },

      setPageSize(pageSize) {
        set(
          {
            pagination: {
              ...initialPosPagination,
              pageSize
            }
          },
          false,
          "setPageSize"
        );
      },

      setSearch(search) {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              page: 1
            },
            search
          }),
          false,
          "setSearch"
        );
      },

      updateCartItemQuantity(productId, quantity) {
        const state = get();
        const item = state.cartItems.find((cartItem) => cartItem.productId === productId);

        if (!item) {
          return;
        }

        const quantityState = clampQuantityToStock(quantity, {
          id: item.productId,
          saleableStock: item.saleableStock
        });

        if (quantityState.quantity === 0) {
          set({ error: quantityState.error }, false, "updateCartItemQuantity:stockInsufficient");
          return;
        }

        const nextItems = state.cartItems.map((cartItem) =>
          cartItem.productId === productId ? updatePosCartItemQuantity(cartItem, quantityState.quantity) : cartItem
        );

        set(
          {
            ...rebuildCartState(nextItems),
            error: quantityState.error,
            saleStatus: "idle"
          },
          false,
          "updateCartItemQuantity"
        );
      }
    }),
    { name: "PosStore" }
  )
);

export function resetPosStore() {
  usePosStore.getState().reset();
}
