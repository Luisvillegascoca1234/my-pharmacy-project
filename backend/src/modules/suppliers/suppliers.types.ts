import type { Supplier } from "@prisma/client";

export type SupplierRecord = Supplier;

export type SuppliersListFilters = {
  search?: string;
  status?: Supplier["status"];
  page: number;
  pageSize: number;
};

export type SuppliersListResult = {
  data: SupplierRecord[];
  total: number;
};

export type SupplierCreateData = {
  businessName: string;
  nit: string | null;
  phone: string | null;
  address: string | null;
  contactName: string | null;
  status: Supplier["status"];
};

export type SupplierUpdateData = Partial<SupplierCreateData>;

export type AuditContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};
