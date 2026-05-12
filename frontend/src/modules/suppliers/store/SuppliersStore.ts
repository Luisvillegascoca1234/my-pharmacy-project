import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ApiError } from "@/api/ApiError";
import { suppliersFacade } from "../facades/suppliersFacade";
import { createEmptySupplierDraftForm } from "../types/suppliersTypes";
import { createSupplierDraftFromSupplier, createSupplierDraftPatch } from "../utils/supplierPayloads";
import type { SuppliersActions } from "./SuppliersActions";
import { buildSuppliersQuery, initialSuppliersPagination, initialSuppliersState, type SuppliersState } from "./SuppliersState";

export type SuppliersStore = SuppliersState & SuppliersActions;

export const useSuppliersStore = create<SuppliersStore>()(
  devtools(
    (set, get) => ({
      ...initialSuppliersState,

      async createSupplier(input) {
        set({ error: null, errorStatusCode: null, saveStatus: "loading" }, false, "createSupplier:start");

        try {
          const supplier = await suppliersFacade.create(input ?? get().draftForm);

          set(
            {
              draftForm: createSupplierDraftFromSupplier(supplier),
              error: null,
              errorStatusCode: null,
              isDirty: false,
              selectedSupplier: supplier,
              saveStatus: "success"
            },
            false,
            "createSupplier:success"
          );

          await get().loadSuppliers();

          return supplier;
        } catch (error) {
          set(
            {
              error: error instanceof Error ? error.message : null,
              errorStatusCode: ApiError.isApiError(error) ? error.statusCode : null,
              saveStatus: "error"
            },
            false,
            "createSupplier:error"
          );

          return null;
        }
      },

      async loadSupplier(supplierId, signal) {
        set({ detailStatus: "loading", error: null, errorStatusCode: null }, false, "loadSupplier:start");

        try {
          const supplier = await suppliersFacade.getById(supplierId, signal);

          set(
            {
              detailStatus: "success",
              draftForm: createSupplierDraftFromSupplier(supplier),
              error: null,
              errorStatusCode: null,
              isDirty: false,
              selectedSupplier: supplier
            },
            false,
            "loadSupplier:success"
          );

          return supplier;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return null;
          }

          set(
            {
              detailStatus: "error",
              error: error instanceof Error ? error.message : null,
              errorStatusCode: ApiError.isApiError(error) ? error.statusCode : null,
              selectedSupplier: null
            },
            false,
            "loadSupplier:error"
          );

          return null;
        }
      },

      async loadSuppliers(signal) {
        set({ error: null, errorStatusCode: null, listStatus: "loading" }, false, "loadSuppliers:start");

        try {
          const response = await suppliersFacade.getAll(buildSuppliersQuery(get()), signal);

          set(
            {
              error: null,
              errorStatusCode: null,
              items: response.data,
              listStatus: "success",
              pagination: response.pagination
            },
            false,
            "loadSuppliers:success"
          );
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          set(
            {
              error: error instanceof Error ? error.message : null,
              errorStatusCode: ApiError.isApiError(error) ? error.statusCode : null,
              listStatus: "error"
            },
            false,
            "loadSuppliers:error"
          );
        }
      },

      reset() {
        set(initialSuppliersState, false, "reset");
      },

      resetDraftForm() {
        set(
          {
            draftForm: createEmptySupplierDraftForm(),
            detailStatus: "idle",
            error: null,
            errorStatusCode: null,
            isDirty: false,
            saveStatus: "idle",
            selectedSupplier: null
          },
          false,
          "resetDraftForm"
        );
      },

      async saveDraftForm(supplierId) {
        if (supplierId) {
          return get().updateSupplier(supplierId);
        }

        return get().createSupplier();
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

      setDraftForm(draftForm) {
        set({ draftForm, isDirty: true, saveStatus: "idle" }, false, "setDraftForm");
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
              ...initialSuppliersPagination,
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

      setSelectedSupplier(supplier) {
        set(
          {
            draftForm: supplier ? createSupplierDraftFromSupplier(supplier) : createEmptySupplierDraftForm(),
            error: null,
            errorStatusCode: null,
            isDirty: false,
            saveStatus: "idle",
            selectedSupplier: supplier
          },
          false,
          "setSelectedSupplier"
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

      async updateSupplier(supplierId, input) {
        set({ error: null, errorStatusCode: null, saveStatus: "loading" }, false, "updateSupplier:start");

        try {
          const state = get();
          const supplier = await suppliersFacade.update(supplierId, input ?? createSupplierDraftPatch(state.draftForm, state.selectedSupplier));

          set(
            {
              draftForm: createSupplierDraftFromSupplier(supplier),
              error: null,
              errorStatusCode: null,
              isDirty: false,
              items: state.items.map((item) => (item.id === supplier.id ? supplier : item)),
              saveStatus: "success",
              selectedSupplier: supplier
            },
            false,
            "updateSupplier:success"
          );

          return supplier;
        } catch (error) {
          set(
            {
              error: error instanceof Error ? error.message : null,
              errorStatusCode: ApiError.isApiError(error) ? error.statusCode : null,
              saveStatus: "error"
            },
            false,
            "updateSupplier:error"
          );

          return null;
        }
      }
    }),
    { name: "SuppliersStore" }
  )
);

export function resetSuppliersStore() {
  useSuppliersStore.getState().reset();
}
