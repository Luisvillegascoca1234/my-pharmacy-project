import type { PosStore } from "./PosStore";

export const selectPosState = (state: PosStore) => ({
  cartItems: state.cartItems,
  cartTotals: state.cartTotals,
  code: state.code,
  confirmedSale: state.confirmedSale,
  error: state.error,
  pagination: state.pagination,
  receipt: state.receipt,
  search: state.search,
  searchResults: state.searchResults,
  searchStatus: state.searchStatus,
  saleStatus: state.saleStatus
});

export const selectPosActions = (state: PosStore) => ({
  addCartItem: state.addCartItem,
  clearCart: state.clearCart,
  confirmCashSale: state.confirmCashSale,
  removeCartItem: state.removeCartItem,
  replaceCartItems: state.replaceCartItems,
  reset: state.reset,
  resetCheckout: state.resetCheckout,
  searchProducts: state.searchProducts,
  setConfirmedSale: state.setConfirmedSale,
  setCode: state.setCode,
  setPage: state.setPage,
  setPageSize: state.setPageSize,
  setSearch: state.setSearch,
  updateCartItemQuantity: state.updateCartItemQuantity
});
