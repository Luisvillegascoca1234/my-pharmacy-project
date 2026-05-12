import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ApiError } from "@/api/ApiError";
import { purchasesFacade } from "../facades/purchasesFacade";
import { createEmptyPurchaseDraftForm, createEmptyPurchaseDraftItemForm } from "../types/purchasesTypes";
import { buildCreatePurchasePayload, buildUpdatePurchasePayload, createPurchaseDraftFromPurchase } from "../utils/purchasePayloads";
import type { PurchasesActions } from "./PurchasesActions";
import { buildPurchasesQuery, initialPurchasesPagination, initialPurchasesState, type PurchasesState } from "./PurchasesState";

export type PurchasesStore = PurchasesState & PurchasesActions;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function getErrorState(error: unknown) {
  return {
    error: error instanceof Error ? error.message : null,
    errorStatusCode: ApiError.isApiError(error) ? error.statusCode : null
  };
}

export const usePurchasesStore = create<PurchasesStore>()(
  devtools(
    (set, get) => ({
      ...initialPurchasesState,

      addDraftItem() {
        set(
          (state) => ({
            draftForm: {
              ...state.draftForm,
              items: [...state.draftForm.items, createEmptyPurchaseDraftItemForm()]
            },
            isDirty: true,
            saveStatus: "idle"
          }),
          false,
          "addDraftItem"
        );
      },

      async cancelPurchase(purchaseId, input) {
        set({ cancelStatus: "loading", error: null, errorStatusCode: null }, false, "cancelPurchase:start");

        try {
          const purchase = await purchasesFacade.cancel(purchaseId, input);

          set(
            {
              cancelStatus: "success",
              detailStatus: "success",
              draftForm: createPurchaseDraftFromPurchase(purchase),
              error: null,
              errorStatusCode: null,
              isDirty: false,
              selectedPurchase: purchase
            },
            false,
            "cancelPurchase:success"
          );

          await get().loadPurchases();

          return purchase;
        } catch (error) {
          set({ ...getErrorState(error), cancelStatus: "error" }, false, "cancelPurchase:error");

          return null;
        }
      },

      async createPurchase(input) {
        set({ error: null, errorStatusCode: null, saveStatus: "loading" }, false, "createPurchase:start");

        try {
          const purchase = await purchasesFacade.create(input ?? buildCreatePurchasePayload(get().draftForm));

          set(
            {
              draftForm: createPurchaseDraftFromPurchase(purchase),
              error: null,
              errorStatusCode: null,
              isDirty: false,
              saveStatus: "success",
              selectedPurchase: purchase
            },
            false,
            "createPurchase:success"
          );

          await get().loadPurchases();

          return purchase;
        } catch (error) {
          set({ ...getErrorState(error), saveStatus: "error" }, false, "createPurchase:error");

          return null;
        }
      },

      async loadPurchase(purchaseId, signal) {
        set({ detailStatus: "loading", error: null, errorStatusCode: null }, false, "loadPurchase:start");

        try {
          const purchase = await purchasesFacade.getById(purchaseId, signal);

          set(
            {
              detailStatus: "success",
              draftForm: createPurchaseDraftFromPurchase(purchase),
              error: null,
              errorStatusCode: null,
              isDirty: false,
              selectedPurchase: purchase
            },
            false,
            "loadPurchase:success"
          );

          return purchase;
        } catch (error) {
          if (isAbortError(error)) {
            return null;
          }

          set({ ...getErrorState(error), detailStatus: "error", selectedPurchase: null }, false, "loadPurchase:error");

          return null;
        }
      },

      async loadPurchases(signal) {
        set({ error: null, errorStatusCode: null, listStatus: "loading" }, false, "loadPurchases:start");

        try {
          const response = await purchasesFacade.getAll(buildPurchasesQuery(get()), signal);

          set(
            {
              error: null,
              errorStatusCode: null,
              items: response.data,
              listStatus: "success",
              pagination: response.pagination
            },
            false,
            "loadPurchases:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          set({ ...getErrorState(error), listStatus: "error" }, false, "loadPurchases:error");
        }
      },

      async receivePurchase(purchaseId, input) {
        set({ error: null, errorStatusCode: null, receiveStatus: "loading" }, false, "receivePurchase:start");

        try {
          const purchase = await purchasesFacade.receive(purchaseId, input);

          set(
            {
              detailStatus: "success",
              draftForm: createPurchaseDraftFromPurchase(purchase),
              error: null,
              errorStatusCode: null,
              isDirty: false,
              receiveStatus: "success",
              selectedPurchase: purchase
            },
            false,
            "receivePurchase:success"
          );

          await get().loadPurchases();

          return purchase;
        } catch (error) {
          set({ ...getErrorState(error), receiveStatus: "error" }, false, "receivePurchase:error");

          return null;
        }
      },

      removeDraftItem(index) {
        set(
          (state) => ({
            draftForm: {
              ...state.draftForm,
              items: state.draftForm.items.filter((_, itemIndex) => itemIndex !== index)
            },
            isDirty: true,
            saveStatus: "idle"
          }),
          false,
          "removeDraftItem"
        );
      },

      reset() {
        set(initialPurchasesState, false, "reset");
      },

      resetDraftForm() {
        set(
          {
            cancelStatus: "idle",
            detailStatus: "idle",
            draftForm: createEmptyPurchaseDraftForm(),
            error: null,
            errorStatusCode: null,
            isDirty: false,
            receiveStatus: "idle",
            saveStatus: "idle",
            selectedPurchase: null
          },
          false,
          "resetDraftForm"
        );
      },

      async saveDraftForm(purchaseId) {
        if (purchaseId) {
          return get().updatePurchase(purchaseId);
        }

        return get().createPurchase();
      },

      setDraftField(field, value) {
        set(
          (state) => ({
            draftForm: {
              ...state.draftForm,
              [field]: value
            },
            isDirty: true,
            saveStatus: "idle"
          }),
          false,
          "setDraftField"
        );
      },

      setDraftItemField(index, field, value) {
        set(
          (state) => ({
            draftForm: {
              ...state.draftForm,
              items: state.draftForm.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
            },
            isDirty: true,
            saveStatus: "idle"
          }),
          false,
          "setDraftItemField"
        );
      },

      setFromDate(fromDate) {
        set(
          (state) => ({
            fromDate,
            pagination: {
              ...state.pagination,
              page: 1
            }
          }),
          false,
          "setFromDate"
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
              ...initialPurchasesPagination,
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

      setStatus(status) {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              page: 1
            },
            status
          }),
          false,
          "setStatus"
        );
      },

      setSupplierId(supplierId) {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              page: 1
            },
            supplierId
          }),
          false,
          "setSupplierId"
        );
      },

      setToDate(toDate) {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              page: 1
            },
            toDate
          }),
          false,
          "setToDate"
        );
      },

      async updatePurchase(purchaseId, input) {
        set({ error: null, errorStatusCode: null, saveStatus: "loading" }, false, "updatePurchase:start");

        try {
          const purchase = await purchasesFacade.update(purchaseId, input ?? buildUpdatePurchasePayload(get().draftForm));

          set(
            {
              draftForm: createPurchaseDraftFromPurchase(purchase),
              error: null,
              errorStatusCode: null,
              isDirty: false,
              saveStatus: "success",
              selectedPurchase: purchase
            },
            false,
            "updatePurchase:success"
          );

          await get().loadPurchases();

          return purchase;
        } catch (error) {
          set({ ...getErrorState(error), saveStatus: "error" }, false, "updatePurchase:error");

          return null;
        }
      }
    }),
    { name: "PurchasesStore" }
  )
);

export function resetPurchasesStore() {
  usePurchasesStore.getState().reset();
}
