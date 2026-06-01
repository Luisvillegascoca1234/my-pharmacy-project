import type { ConvertPendingCart, DiscardPendingCart, EditPendingCart, PendingCart, PendingCartsListResponse, PendingCartsQuery, SavePendingCart } from "../types/pendingCartTypes";
import { pendingCartsApi } from "../api/pending-carts-api";
import { buildPendingCartsQuery } from "../utils/pendingCartPayloads";

export const pendingCartsFacade = {
  list(query: PendingCartsQuery, signal?: AbortSignal): Promise<PendingCartsListResponse> {
    return pendingCartsApi.list(buildPendingCartsQuery(query), signal);
  },

  create(input: SavePendingCart): Promise<PendingCart> {
    return pendingCartsApi.create(input);
  },

  update(pendingCartId: string, input: EditPendingCart): Promise<PendingCart> {
    return pendingCartsApi.update(pendingCartId, input);
  },

  discard(pendingCartId: string, input: DiscardPendingCart): Promise<PendingCart> {
    return pendingCartsApi.discard(pendingCartId, input);
  },

  convert(pendingCartId: string, input: ConvertPendingCart): Promise<PendingCart> {
    return pendingCartsApi.convert(pendingCartId, input);
  }
};
