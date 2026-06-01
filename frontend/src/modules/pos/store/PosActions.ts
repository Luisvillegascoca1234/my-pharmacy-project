import type { PosProduct, Sale } from "@pharmacy-pos/shared";
import type { PosCartItem } from "../types/posTypes";

export type PosActions = {
  addCartItem: (product: PosProduct, quantity?: number) => void;
  clearCart: () => void;
  confirmCashSale: (receivedAmount: number) => Promise<Sale | null>;
  removeCartItem: (productId: string) => void;
  replaceCartItems: (items: PosCartItem[]) => void;
  reset: () => void;
  resetCheckout: () => void;
  searchProducts: (signal?: AbortSignal) => Promise<void>;
  setConfirmedSale: (sale: Sale) => void;
  setCode: (code: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
};
