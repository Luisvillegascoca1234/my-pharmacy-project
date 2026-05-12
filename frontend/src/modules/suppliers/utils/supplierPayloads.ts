import { CreateSupplierSchema, UpdateSupplierSchema, type CreateSupplier, type Supplier, type UpdateSupplier } from "@pharmacy-pos/shared";
import { createEmptySupplierDraftForm, type SupplierDraftForm } from "../types/suppliersTypes";

export function createSupplierDraftFromSupplier(supplier: Supplier): SupplierDraftForm {
  return {
    address: supplier.address ?? "",
    businessName: supplier.businessName,
    contactName: supplier.contactName ?? "",
    nit: supplier.nit ?? "",
    phone: supplier.phone ?? "",
    status: supplier.status
  };
}

export function createSupplierDraftPatch(draftForm: SupplierDraftForm, supplier?: Supplier | null): UpdateSupplier {
  const payload = buildCreateSupplierPayload(draftForm);

  if (!supplier) {
    return payload;
  }

  const patch: UpdateSupplier = {};

  if (payload.address !== supplier.address) {
    patch.address = payload.address;
  }

  if (payload.businessName !== supplier.businessName) {
    patch.businessName = payload.businessName;
  }

  if (payload.contactName !== supplier.contactName) {
    patch.contactName = payload.contactName;
  }

  if (payload.nit !== supplier.nit) {
    patch.nit = payload.nit;
  }

  if (payload.phone !== supplier.phone) {
    patch.phone = payload.phone;
  }

  if (payload.status !== supplier.status) {
    patch.status = payload.status;
  }

  return UpdateSupplierSchema.parse(patch);
}

export function buildCreateSupplierPayload(input: CreateSupplier | SupplierDraftForm): CreateSupplier {
  return CreateSupplierSchema.parse(input);
}

export function buildUpdateSupplierPayload(input: UpdateSupplier): UpdateSupplier {
  return UpdateSupplierSchema.parse(input);
}
