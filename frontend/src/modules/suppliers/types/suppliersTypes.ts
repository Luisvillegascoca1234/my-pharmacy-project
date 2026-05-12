import type { SupplierStatus } from "@pharmacy-pos/shared";

export type SupplierStatusFilter = SupplierStatus | "all";

export type SupplierRequestStatus = "idle" | "loading" | "success" | "error";

export type SupplierDraftForm = {
  address: string;
  businessName: string;
  contactName: string;
  nit: string;
  phone: string;
  status: SupplierStatus;
};

export const createEmptySupplierDraftForm = (): SupplierDraftForm => ({
  address: "",
  businessName: "",
  contactName: "",
  nit: "",
  phone: "",
  status: "active"
});
