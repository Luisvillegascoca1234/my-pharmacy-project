import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { PendingCart, PendingCartItemInput } from "../types/pendingCartTypes";
import { createEmptyPendingCartDraft } from "../types/pendingCartTypes";
import { pendingCartsFacade } from "../facades/pendingCartsFacade";
import { createPendingCartDataError, getPendingCartStatusFromError } from "../utils/pendingCartErrors";
import { buildConvertPendingCartPayload, buildEditPendingCartPayload, buildSavePendingCartPayload } from "../utils/pendingCartPayloads";
import type { PendingCartsActions } from "./PendingCartsActions";
import { buildPendingCartsQuery, initialPendingCartsPagination, initialPendingCartsState, type PendingCartsState } from "./PendingCartsState";

export type PendingCartsStore = PendingCartsState & PendingCartsActions;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function createRevalidation(cart: PendingCart) {
  const issues = cart.revalidationIssues ?? cart.items.flatMap((item) => item.revalidationIssues ?? []);
  const hasBlockedIssue = issues.some((issue) => issue.code === "stock-insufficient" || issue.code === "product-not-saleable");

  return {
    cartId: cart.id,
    issues,
    status: cart.status === "expired" ? "expired" : hasBlockedIssue ? "blocked" : issues.length > 0 ? "warning" : "valid",
    totals: {
      currentTotalAmount: cart.currentTotalAmount ?? cart.referenceTotalAmount,
      referenceTotalAmount: cart.referenceTotalAmount
    }
  } as const;
}

function upsertCart(items: PendingCart[], cart: PendingCart) {
  const exists = items.some((item) => item.id === cart.id);

  return exists ? items.map((item) => (item.id === cart.id ? cart : item)) : [cart, ...items];
}

function normalizeDraftItem(item: PendingCartItemInput): PendingCartItemInput {
  return {
    productId: item.productId,
    quantity: Math.max(1, Math.trunc(item.quantity || 1))
  };
}

export const usePendingCartsStore = create<PendingCartsStore>()(
  devtools(
    (set, get) => ({
      ...initialPendingCartsState,

      addDraftItem(item) {
        const normalizedItem = normalizeDraftItem(item);

        set(
          (state) => {
            const existingItem = state.draft.items.find((draftItem) => draftItem.productId === normalizedItem.productId);
            const items = existingItem
              ? state.draft.items.map((draftItem) =>
                  draftItem.productId === normalizedItem.productId
                    ? normalizeDraftItem({ ...draftItem, quantity: draftItem.quantity + normalizedItem.quantity })
                    : draftItem
                )
              : [...state.draft.items, normalizedItem];

            return {
              draft: {
                ...state.draft,
                items
              },
              isDirty: true,
              saveStatus: "idle"
            };
          },
          false,
          "addDraftItem"
        );
      },

      clearDraft() {
        set(
          {
            draft: createEmptyPendingCartDraft(),
            error: null,
            isDirty: false,
            revalidation: null,
            revalidationStatus: "idle",
            saveStatus: "idle",
            selectedCart: null,
            selectedCartId: null
          },
          false,
          "clearDraft"
        );
      },

      async convertSelectedCart(receivedAmount) {
        const selectedCartId = get().selectedCartId;

        if (!selectedCartId) {
          return null;
        }

        set({ convertStatus: "loading", error: null }, false, "convertSelectedCart:start");

        try {
          const cart = await pendingCartsFacade.convert(selectedCartId, buildConvertPendingCartPayload(receivedAmount));

          set(
            (state) => ({
              convertStatus: "success",
              draft: createEmptyPendingCartDraft(),
              error: null,
              isDirty: false,
              items: upsertCart(state.items, cart),
              lastConvertedCart: cart,
              revalidation: createRevalidation(cart),
              revalidationStatus: cart.status === "expired" ? "expired" : "success",
              selectedCart: cart,
              selectedCartId: cart.id
            }),
            false,
            "convertSelectedCart:success"
          );

          return cart;
        } catch (error) {
          const dataError = createPendingCartDataError(error);
          const status = getPendingCartStatusFromError(dataError);

          set({ convertStatus: status, error: dataError }, false, "convertSelectedCart:error");

          return null;
        }
      },

      async discardCart(pendingCartId, input = {}) {
        set({ discardStatus: "loading", error: null }, false, "discardCart:start");

        try {
          const cart = await pendingCartsFacade.discard(pendingCartId, input);

          set(
            (state) => ({
              discardStatus: "success",
              error: null,
              items: upsertCart(state.items, cart),
              selectedCart: state.selectedCartId === cart.id ? cart : state.selectedCart,
              selectedCartId: state.selectedCartId
            }),
            false,
            "discardCart:success"
          );

          return cart;
        } catch (error) {
          const dataError = createPendingCartDataError(error);

          set({ discardStatus: getPendingCartStatusFromError(dataError), error: dataError }, false, "discardCart:error");

          return null;
        }
      },

      async loadPendingCarts(signal) {
        set({ error: null, listStatus: "loading" }, false, "loadPendingCarts:start");

        try {
          const response = await pendingCartsFacade.list(buildPendingCartsQuery(get()), signal);

          set(
            {
              error: null,
              items: response.data,
              listStatus: response.data.length > 0 ? "success" : "empty",
              pagination: response.pagination
            },
            false,
            "loadPendingCarts:success"
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          const dataError = createPendingCartDataError(error);

          set({ error: dataError, listStatus: getPendingCartStatusFromError(dataError) }, false, "loadPendingCarts:error");
        }
      },

      removeDraftItem(productId) {
        set(
          (state) => ({
            draft: {
              ...state.draft,
              items: state.draft.items.filter((item) => item.productId !== productId)
            },
            isDirty: true,
            saveStatus: "idle"
          }),
          false,
          "removeDraftItem"
        );
      },

      reset() {
        set(initialPendingCartsState, false, "reset");
      },

      retakeCart(pendingCart) {
        set(
          {
            draft: {
              items: pendingCart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity
              })),
              name: pendingCart.name ?? "",
              note: pendingCart.note ?? ""
            },
            error: null,
            isDirty: false,
            revalidation: createRevalidation(pendingCart),
            revalidationStatus: pendingCart.status === "expired" ? "expired" : "success",
            selectedCart: pendingCart,
            selectedCartId: pendingCart.id
          },
          false,
          "retakeCart"
        );
      },

      async saveDraft(pendingCartId) {
        set({ error: null, saveStatus: "loading" }, false, "saveDraft:start");

        try {
          const draft = get().draft;
          const cart = pendingCartId
            ? await pendingCartsFacade.update(pendingCartId, buildEditPendingCartPayload(draft))
            : await pendingCartsFacade.create(buildSavePendingCartPayload(draft));

          set(
            (state) => ({
              error: null,
              isDirty: false,
              items: upsertCart(state.items, cart),
              lastSavedCart: cart,
              saveStatus: "success",
              selectedCart: cart,
              selectedCartId: cart.id
            }),
            false,
            "saveDraft:success"
          );

          return cart;
        } catch (error) {
          const dataError = createPendingCartDataError(error);

          set({ error: dataError, saveStatus: getPendingCartStatusFromError(dataError) }, false, "saveDraft:error");

          return null;
        }
      },

      selectCart(pendingCartId) {
        const selectedCart = pendingCartId ? get().items.find((item) => item.id === pendingCartId) ?? null : null;

        set(
          {
            revalidation: selectedCart ? createRevalidation(selectedCart) : null,
            revalidationStatus: selectedCart ? (selectedCart.status === "expired" ? "expired" : "success") : "idle",
            selectedCart,
            selectedCartId: pendingCartId
          },
          false,
          "selectCart"
        );
      },

      setDraft(draft) {
        set({ draft, isDirty: true, saveStatus: "idle" }, false, "setDraft");
      },

      setDraftField(field, value) {
        set(
          (state) => ({
            draft: {
              ...state.draft,
              [field]: value
            },
            isDirty: true,
            saveStatus: "idle"
          }),
          false,
          "setDraftField"
        );
      },

      setDraftItemQuantity(productId, quantity) {
        set(
          (state) => ({
            draft: {
              ...state.draft,
              items: state.draft.items.map((item) => (item.productId === productId ? normalizeDraftItem({ ...item, quantity }) : item))
            },
            isDirty: true,
            saveStatus: "idle"
          }),
          false,
          "setDraftItemQuantity"
        );
      },

      setIncludeAll(includeAll) {
        set(
          {
            includeAll,
            pagination: initialPendingCartsPagination
          },
          false,
          "setIncludeAll"
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
              ...initialPendingCartsPagination,
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
      }
    }),
    { name: "PendingCartsStore" }
  )
);

export function resetPendingCartsStore() {
  usePendingCartsStore.getState().reset();
}
