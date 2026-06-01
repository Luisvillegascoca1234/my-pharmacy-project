import type { DiscardPendingCart, PendingCart, PendingCartDraft, PendingCartItemInput, PendingCartStatusFilter } from "../types/pendingCartTypes";

export type PendingCartsActions = {
  addDraftItem: (item: PendingCartItemInput) => void;
  clearDraft: () => void;
  convertSelectedCart: (receivedAmount: number) => Promise<PendingCart | null>;
  discardCart: (pendingCartId: string, input?: DiscardPendingCart) => Promise<PendingCart | null>;
  loadPendingCarts: (signal?: AbortSignal) => Promise<void>;
  removeDraftItem: (productId: string) => void;
  reset: () => void;
  retakeCart: (pendingCart: PendingCart) => void;
  saveDraft: (pendingCartId?: string) => Promise<PendingCart | null>;
  selectCart: (pendingCartId: string | null) => void;
  setDraft: (draft: PendingCartDraft) => void;
  setDraftField: <Field extends keyof PendingCartDraft>(field: Field, value: PendingCartDraft[Field]) => void;
  setDraftItemQuantity: (productId: string, quantity: number) => void;
  setIncludeAll: (includeAll: boolean) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setStatus: (status: PendingCartStatusFilter) => void;
};
