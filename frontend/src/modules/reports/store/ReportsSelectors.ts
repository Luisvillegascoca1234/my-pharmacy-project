import type { ReportsStore } from "./ReportsStore";

export const selectReportsState = (state: ReportsStore) => ({
  dailySalesFromDate: state.dailySalesFromDate,
  dailySalesReport: state.dailySalesReport,
  dailySalesStatus: state.dailySalesStatus,
  dailySalesToDate: state.dailySalesToDate,
  error: state.error,
  expiringDays: state.expiringDays,
  expiringProductId: state.expiringProductId,
  expiringProductsReport: state.expiringProductsReport,
  expiringProductsStatus: state.expiringProductsStatus,
  expiringSearch: state.expiringSearch,
  inventoryValuationProductId: state.inventoryValuationProductId,
  inventoryValuationReport: state.inventoryValuationReport,
  inventoryValuationSearch: state.inventoryValuationSearch,
  inventoryValuationStatus: state.inventoryValuationStatus
});

export const selectReportsActions = (state: ReportsStore) => ({
  loadDailySalesReport: state.loadDailySalesReport,
  loadExpiringProductsReport: state.loadExpiringProductsReport,
  loadInventoryValuationReport: state.loadInventoryValuationReport,
  reset: state.reset,
  setDailySalesFromDate: state.setDailySalesFromDate,
  setDailySalesToDate: state.setDailySalesToDate,
  setExpiringDays: state.setExpiringDays,
  setExpiringProductId: state.setExpiringProductId,
  setExpiringSearch: state.setExpiringSearch,
  setInventoryValuationProductId: state.setInventoryValuationProductId,
  setInventoryValuationSearch: state.setInventoryValuationSearch
});
