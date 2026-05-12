import type { CreateSupplier, Supplier, SuppliersListResponse, SuppliersQuery, UpdateSupplier } from "@pharmacy-pos/shared";
import { suppliersApi } from "../api/suppliers-api";
import { buildCreateSupplierPayload, buildUpdateSupplierPayload } from "../utils/supplierPayloads";

export const suppliersFacade = {
  getAll(query: SuppliersQuery, signal?: AbortSignal): Promise<SuppliersListResponse> {
    return suppliersApi.listSuppliers(query, signal);
  },

  getById(supplierId: string, signal?: AbortSignal): Promise<Supplier> {
    return suppliersApi.getSupplier(supplierId, signal);
  },

  create(input: CreateSupplier): Promise<Supplier> {
    return suppliersApi.createSupplier(buildCreateSupplierPayload(input));
  },

  update(supplierId: string, input: UpdateSupplier): Promise<Supplier> {
    return suppliersApi.updateSupplier(supplierId, buildUpdateSupplierPayload(input));
  }
};
