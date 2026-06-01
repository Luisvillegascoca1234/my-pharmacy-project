import { ConvertPendingCartSchema, EditPendingCartSchema, PendingCartsQuerySchema, SavePendingCartSchema } from "@pharmacy-pos/shared";
import type { ConvertPendingCart, EditPendingCart, PendingCartDraft, PendingCartsQuery, SavePendingCart } from "../types/pendingCartTypes";

export function buildPendingCartsQuery(query: PendingCartsQuery): PendingCartsQuery {
  return PendingCartsQuerySchema.parse({
    includeAll: query.includeAll || undefined,
    page: query.page,
    pageSize: query.pageSize,
    search: query.search || undefined,
    sellerUserId: query.sellerUserId || undefined,
    status: query.status
  });
}

export function buildSavePendingCartPayload(draft: PendingCartDraft): SavePendingCart {
  return SavePendingCartSchema.parse({
    items: draft.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    })),
    name: draft.name.trim() || undefined,
    note: draft.note.trim() || undefined
  });
}

export function buildEditPendingCartPayload(draft: PendingCartDraft): EditPendingCart {
  return EditPendingCartSchema.parse(buildSavePendingCartPayload(draft));
}

export function buildConvertPendingCartPayload(receivedAmount: number): ConvertPendingCart {
  return ConvertPendingCartSchema.parse({
    payment: {
      method: "cash",
      receivedAmount
    }
  });
}
