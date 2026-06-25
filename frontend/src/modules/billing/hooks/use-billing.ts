import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectBillingActions, selectBillingState } from "../store/BillingSelectors";
import { useBillingStore } from "../store/BillingStore";
import type { CancelPreparedInvoice, PrepareInvoiceFromSale } from "../types/billingTypes";

type UseBillingOptions = {
  autoLoadInvoiceableSales?: boolean;
  autoLoadPreparedInvoices?: boolean;
};

function canUseAdministrativeBilling(roleName?: string): boolean {
  return roleName === "superadmin" || roleName === "admin";
}

export function useBilling(options: UseBillingOptions = {}) {
  const { autoLoadInvoiceableSales = false, autoLoadPreparedInvoices = true } = options;
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const billingState = useBillingStore(useShallow(selectBillingState));
  const billingActions = useBillingStore(useShallow(selectBillingActions));
  const canUseBilling = canUseAdministrativeBilling(user?.role.name);

  const loadInvoiceableSales = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canUseBilling) {
        billingActions.reset();
        return;
      }

      await billingActions.loadInvoiceableSales(signal);
    },
    [billingActions, canUseBilling, token]
  );

  const loadPreparedInvoices = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canUseBilling) {
        billingActions.reset();
        return;
      }

      await billingActions.loadPreparedInvoices(signal);
    },
    [billingActions, canUseBilling, token]
  );

  useEffect(() => {
    if (!autoLoadInvoiceableSales) {
      return;
    }

    const controller = new AbortController();

    void loadInvoiceableSales(controller.signal);

    return () => controller.abort();
  }, [
    autoLoadInvoiceableSales,
    billingState.invoiceableFromDate,
    billingState.invoiceablePagination.page,
    billingState.invoiceablePagination.pageSize,
    billingState.invoiceableSearch,
    billingState.invoiceableSellerUserId,
    billingState.invoiceableToDate,
    loadInvoiceableSales,
    user?.id
  ]);

  useEffect(() => {
    if (!autoLoadPreparedInvoices) {
      return;
    }

    const controller = new AbortController();

    void loadPreparedInvoices(controller.signal);

    return () => controller.abort();
  }, [
    autoLoadPreparedInvoices,
    billingState.preparedInvoiceFromDate,
    billingState.preparedInvoicePagination.page,
    billingState.preparedInvoicePagination.pageSize,
    billingState.preparedInvoiceSaleId,
    billingState.preparedInvoiceSearch,
    billingState.preparedInvoiceStatus,
    billingState.preparedInvoiceToDate,
    loadPreparedInvoices,
    user?.id
  ]);

  useEffect(() => {
    if (!token || !canUseBilling) {
      billingActions.reset();
    }
  }, [billingActions, canUseBilling, token, user?.id]);

  const loadPreparedInvoice = useCallback(
    async (preparedInvoiceId: string, signal?: AbortSignal) => {
      if (!token || !canUseBilling) {
        billingActions.reset();
        return null;
      }

      return billingActions.loadPreparedInvoice(preparedInvoiceId, signal);
    },
    [billingActions, canUseBilling, token]
  );

  const prepareInvoice = useCallback(
    async (input: PrepareInvoiceFromSale) => {
      if (!token || !canUseBilling) {
        billingActions.reset();
        return null;
      }

      return billingActions.prepareInvoice(input);
    },
    [billingActions, canUseBilling, token]
  );

  const cancelSelectedPreparedInvoice = useCallback(
    async (input?: CancelPreparedInvoice) => {
      if (!token || !canUseBilling) {
        billingActions.reset();
        return null;
      }

      return billingActions.cancelSelectedPreparedInvoice(input);
    },
    [billingActions, canUseBilling, token]
  );

  return useMemo(
    () => ({
      ...billingState,
      canUseBilling,
      cancelSelectedPreparedInvoice,
      clearCancellation: billingActions.clearCancellation,
      clearPreparation: billingActions.clearPreparation,
      loadPreparedInvoice,
      prepareInvoice,
      reloadInvoiceableSales: loadInvoiceableSales,
      reloadPreparedInvoices: loadPreparedInvoices,
      reset: billingActions.reset,
      selectPreparedInvoice: billingActions.selectPreparedInvoice,
      setInvoiceableFromDate: billingActions.setInvoiceableFromDate,
      setInvoiceablePage: billingActions.setInvoiceablePage,
      setInvoiceableSearch: billingActions.setInvoiceableSearch,
      setInvoiceableSellerUserId: billingActions.setInvoiceableSellerUserId,
      setInvoiceableToDate: billingActions.setInvoiceableToDate,
      setPreparedInvoiceFromDate: billingActions.setPreparedInvoiceFromDate,
      setPreparedInvoicePage: billingActions.setPreparedInvoicePage,
      setPreparedInvoiceSaleId: billingActions.setPreparedInvoiceSaleId,
      setPreparedInvoiceSearch: billingActions.setPreparedInvoiceSearch,
      setPreparedInvoiceStatus: billingActions.setPreparedInvoiceStatus,
      setPreparedInvoiceToDate: billingActions.setPreparedInvoiceToDate
    }),
    [
      billingActions,
      billingState,
      canUseBilling,
      cancelSelectedPreparedInvoice,
      loadInvoiceableSales,
      loadPreparedInvoice,
      loadPreparedInvoices,
      prepareInvoice
    ]
  );
}
