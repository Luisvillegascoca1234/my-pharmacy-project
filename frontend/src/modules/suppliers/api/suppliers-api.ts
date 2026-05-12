import type { CreateSupplier, Supplier, SuppliersListResponse, SuppliersQuery, UpdateSupplier } from "@pharmacy-pos/shared";
import { axiosApi } from "@/api";

export const suppliersApi = {
  async listSuppliers(query: SuppliersQuery, signal?: AbortSignal): Promise<SuppliersListResponse> {
    const response = await axiosApi.get<SuppliersListResponse>("/suppliers", {
      params: query,
      signal
    });

    return response.data;
  },

  async getSupplier(supplierId: string, signal?: AbortSignal): Promise<Supplier> {
    const response = await axiosApi.get<Supplier>(`/suppliers/${supplierId}`, { signal });

    return response.data;
  },

  async createSupplier(input: CreateSupplier): Promise<Supplier> {
    const response = await axiosApi.post<Supplier>("/suppliers", input);

    return response.data;
  },

  async updateSupplier(supplierId: string, input: UpdateSupplier): Promise<Supplier> {
    const response = await axiosApi.patch<Supplier>(`/suppliers/${supplierId}`, input);

    return response.data;
  }
};
