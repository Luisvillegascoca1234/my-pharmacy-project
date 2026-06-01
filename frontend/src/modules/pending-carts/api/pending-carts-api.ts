import type { PendingCart, PendingCartsListResponse, PendingCartsQuery, ConvertPendingCart, DiscardPendingCart, EditPendingCart, SavePendingCart } from "../types/pendingCartTypes";
import { axiosApi } from "@/api";

export const pendingCartsApi = {
  async list(query: PendingCartsQuery, signal?: AbortSignal): Promise<PendingCartsListResponse> {
    const response = await axiosApi.get<PendingCartsListResponse>("/pending-carts", {
      params: query,
      signal
    });

    return response.data;
  },

  async create(input: SavePendingCart): Promise<PendingCart> {
    const response = await axiosApi.post<PendingCart>("/pending-carts", input);

    return response.data;
  },

  async update(pendingCartId: string, input: EditPendingCart): Promise<PendingCart> {
    const response = await axiosApi.patch<PendingCart>(`/pending-carts/${pendingCartId}`, input);

    return response.data;
  },

  async discard(pendingCartId: string, input: DiscardPendingCart): Promise<PendingCart> {
    const response = await axiosApi.post<PendingCart>(`/pending-carts/${pendingCartId}/discard`, input);

    return response.data;
  },

  async convert(pendingCartId: string, input: ConvertPendingCart): Promise<PendingCart> {
    const response = await axiosApi.post<PendingCart>(`/pending-carts/${pendingCartId}/convert`, input);

    return response.data;
  }
};
