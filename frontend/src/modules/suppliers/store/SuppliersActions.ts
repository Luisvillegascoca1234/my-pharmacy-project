import type { CreateSupplier, Supplier, UpdateSupplier } from "@pharmacy-pos/shared";
import type { SupplierDraftForm, SupplierStatusFilter } from "../types/suppliersTypes";

export type SuppliersActions = {
  createSupplier: (input?: CreateSupplier) => Promise<Supplier | null>;
  loadSupplier: (supplierId: string, signal?: AbortSignal) => Promise<Supplier | null>;
  loadSuppliers: (signal?: AbortSignal) => Promise<void>;
  reset: () => void;
  resetDraftForm: () => void;
  saveDraftForm: (supplierId?: string) => Promise<Supplier | null>;
  setDraftForm: (draftForm: SupplierDraftForm) => void;
  setDraftField: <Field extends keyof SupplierDraftForm>(field: Field, value: SupplierDraftForm[Field]) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setSelectedSupplier: (supplier: Supplier | null) => void;
  setStatus: (status: SupplierStatusFilter) => void;
  updateSupplier: (supplierId: string, input?: UpdateSupplier) => Promise<Supplier | null>;
};
