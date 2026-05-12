import type { CreateSupplier, Supplier, SuppliersListResponse, SuppliersQuery, UpdateSupplier } from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { SuppliersRepository } from "./suppliers.repository.js";
import type {
  AuditContext,
  SupplierCreateData,
  SupplierRecord,
  SuppliersListFilters,
  SuppliersListResult,
  SupplierUpdateData
} from "./suppliers.types.js";

export type SuppliersRepositoryPort = {
  listSuppliers(filters: SuppliersListFilters): Promise<SuppliersListResult>;
  findSupplierById(id: string): Promise<SupplierRecord | null>;
  findSupplierByNit(nit: string, exceptId?: string): Promise<SupplierRecord | null>;
  createSupplier(input: SupplierCreateData): Promise<SupplierRecord>;
  updateSupplier(id: string, input: SupplierUpdateData): Promise<SupplierRecord>;
  createAuditLog(action: string, entityId: string, metadata: unknown, context: AuditContext): Promise<unknown>;
};

export class SuppliersService {
  constructor(private readonly suppliersRepository: SuppliersRepositoryPort = new SuppliersRepository()) {}

  async listSuppliers(query: SuppliersQuery): Promise<SuppliersListResponse> {
    const page = query.page;
    const pageSize = query.pageSize;
    const result = await this.suppliersRepository.listSuppliers({
      search: query.search,
      status: query.status,
      page,
      pageSize
    });

    return {
      data: result.data.map(toSupplier),
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize)
      }
    };
  }

  async getSupplier(id: string): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findSupplierById(id);

    if (!supplier) {
      throw new HttpError(404, "Supplier was not found.", "SUPPLIER_NOT_FOUND");
    }

    return toSupplier(supplier);
  }

  async createSupplier(input: CreateSupplier, context: AuditContext): Promise<Supplier> {
    const normalizedInput = normalizeCreateSupplierInput(input);

    if (normalizedInput.nit) {
      await this.ensureNitIsAvailable(normalizedInput.nit);
    }

    const supplier = await this.suppliersRepository.createSupplier(normalizedInput);

    await this.suppliersRepository.createAuditLog(
      "SUPPLIER_CREATED",
      supplier.id,
      { businessName: supplier.businessName, nit: supplier.nit, status: supplier.status },
      context
    );

    return toSupplier(supplier);
  }

  async updateSupplier(id: string, input: UpdateSupplier, context: AuditContext): Promise<Supplier> {
    const currentSupplier = await this.suppliersRepository.findSupplierById(id);

    if (!currentSupplier) {
      throw new HttpError(404, "Supplier was not found.", "SUPPLIER_NOT_FOUND");
    }

    const normalizedInput = normalizeUpdateSupplierInput(input);

    if (normalizedInput.nit) {
      await this.ensureNitIsAvailable(normalizedInput.nit, id);
    }

    const supplier = await this.suppliersRepository.updateSupplier(id, normalizedInput);

    await this.suppliersRepository.createAuditLog(
      "SUPPLIER_UPDATED",
      supplier.id,
      buildSupplierAuditMetadata(currentSupplier, supplier),
      context
    );

    return toSupplier(supplier);
  }

  private async ensureNitIsAvailable(nit: string, exceptId?: string) {
    const existingSupplier = await this.suppliersRepository.findSupplierByNit(nit, exceptId);

    if (existingSupplier) {
      throw new HttpError(409, "Supplier NIT is already in use.", "SUPPLIER_NIT_IN_USE");
    }
  }
}

function normalizeCreateSupplierInput(input: CreateSupplier) {
  return {
    businessName: input.businessName.trim(),
    nit: normalizeOptionalText(input.nit) ?? null,
    phone: normalizeOptionalText(input.phone) ?? null,
    address: normalizeOptionalText(input.address) ?? null,
    contactName: normalizeOptionalText(input.contactName) ?? null,
    status: input.status
  };
}

function normalizeUpdateSupplierInput(input: UpdateSupplier) {
  return {
    businessName: input.businessName?.trim(),
    nit: input.nit === undefined ? undefined : normalizeOptionalText(input.nit) ?? null,
    phone: input.phone === undefined ? undefined : normalizeOptionalText(input.phone) ?? null,
    address: input.address === undefined ? undefined : normalizeOptionalText(input.address) ?? null,
    contactName: input.contactName === undefined ? undefined : normalizeOptionalText(input.contactName) ?? null,
    status: input.status
  };
}

function normalizeOptionalText(value?: string) {
  const normalizedValue = value?.trim();

  return normalizedValue || undefined;
}

function toSupplier(supplier: SupplierRecord): Supplier {
  return {
    id: supplier.id,
    businessName: supplier.businessName,
    nit: supplier.nit ?? undefined,
    phone: supplier.phone ?? undefined,
    address: supplier.address ?? undefined,
    contactName: supplier.contactName ?? undefined,
    status: supplier.status,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString()
  };
}

function buildSupplierAuditMetadata(before: SupplierRecord, after: SupplierRecord) {
  return {
    before: {
      businessName: before.businessName,
      nit: before.nit,
      phone: before.phone,
      address: before.address,
      contactName: before.contactName,
      status: before.status
    },
    after: {
      businessName: after.businessName,
      nit: after.nit,
      phone: after.phone,
      address: after.address,
      contactName: after.contactName,
      status: after.status
    }
  };
}
