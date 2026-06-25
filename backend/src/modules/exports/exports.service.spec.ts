import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { SalesCsvExportQuerySchema } from "@pharmacy-pos/shared";
import { expectHttpError } from "../../tests/utils/http-error.js";
import { canDownloadExports } from "./exports.routes.js";
import { ExportsService, type ExportsRepositoryPort } from "./exports.service.js";
import type {
  CsvExportFilters,
  ExportAuditContext,
  InventoryMovementCsvExportRecord,
  SalesCsvExportRecord
} from "./exports.types.js";

const auditContext: ExportAuditContext = {
  actorUserId: "admin-1",
  ipAddress: "127.0.0.1",
  userAgent: "vitest"
};

describe("ExportsService", () => {
  it("exports sales CSV with semicolon separator, ISO dates, filters and audit log", async () => {
    const repository = new FakeExportsRepository();
    repository.sales = [
      makeSale({
        correlativeCode: "V-000001",
        status: "confirmed",
        sellerUser: { fullName: "Ana Perez" },
        totalAmount: 30,
        totalCost: 20,
        totalMargin: 10,
        confirmedAt: new Date("2026-06-25T14:00:00.000Z")
      }),
      makeSale({
        id: "sale-2",
        correlativeCode: "V-000002",
        status: "returned",
        sellerUser: { fullName: "Vendedor; Con Separador" },
        totalAmount: 12,
        totalCost: 8,
        totalMargin: 4,
        confirmedAt: new Date("2026-06-25T15:00:00.000Z"),
        saleReturn: { returnedAt: new Date("2026-06-26T10:00:00.000Z") }
      })
    ];
    const service = new ExportsService(repository);
    const query = SalesCsvExportQuerySchema.parse({
      fromDate: "2026-06-01",
      toDate: "2026-06-30",
      separator: ";"
    });

    const result = await service.exportSalesCsv(query, auditContext);

    expect(repository.lastSalesFilters).toEqual({ fromDate: "2026-06-01", toDate: "2026-06-30" });
    expect(result).toEqual(
      expect.objectContaining({
        fileName: "sales.csv",
        contentType: "text/csv; charset=utf-8",
        rowCount: 2
      })
    );
    expect(result.csv).toBe(
      [
        "saleId;correlativeCode;status;sellerName;cashSessionCorrelativeCode;totalAmount;totalCost;totalMargin;confirmedAt;cancelledAt;returnedAt",
        "sale-1;V-000001;confirmed;Ana Perez;C-000001;30;20;10;2026-06-25T14:00:00.000Z;;",
        'sale-2;V-000002;returned;"Vendedor; Con Separador";C-000001;12;8;4;2026-06-25T15:00:00.000Z;;2026-06-26T10:00:00.000Z',
        ""
      ].join("\r\n")
    );
    expect(repository.auditLogs).toEqual([
      {
        fileName: "sales.csv",
        filters: { fromDate: "2026-06-01", toDate: "2026-06-30" },
        rowCount: 2,
        context: auditContext
      }
    ]);
  });

  it("exports inventory movements CSV with semicolon separator, ISO dates, filters and audit log", async () => {
    const repository = new FakeExportsRepository();
    repository.inventoryMovements = [
      makeInventoryMovement({
        actorUser: { fullName: "Admin Operativo" },
        reason: "Ajuste por auditoria",
        createdAt: new Date("2026-06-25T18:00:00.000Z")
      })
    ];
    const service = new ExportsService(repository);

    const result = await service.exportInventoryMovementsCsv(
      { fromDate: "2026-06-01", toDate: "2026-06-30", separator: ";" },
      auditContext
    );

    expect(repository.lastInventoryMovementFilters).toEqual({ fromDate: "2026-06-01", toDate: "2026-06-30" });
    expect(result.csv).toBe(
      [
        "movementId;type;productId;internalCode;commercialName;batchId;batchNumber;quantityBase;unitCostBase;referenceType;referenceId;actorUserName;reason;createdAt",
        "movement-1;inventory_adjustment;product-1;MED-001;Paracetamol 500 mg;batch-1;LOT-001;2.5;4;adjustment;adjustment-1;Admin Operativo;Ajuste por auditoria;2026-06-25T18:00:00.000Z",
        ""
      ].join("\r\n")
    );
    expect(repository.auditLogs).toEqual([
      {
        fileName: "inventory-movements.csv",
        filters: { fromDate: "2026-06-01", toDate: "2026-06-30" },
        rowCount: 1,
        context: auditContext
      }
    ]);
  });
});

describe("Exports routes permissions", () => {
  it.each(["admin", "superadmin"])("allows %s to download exports", (roleName) => {
    const request = makeRoleRequest(roleName);
    const next = createNextSpy();

    canDownloadExports(request, {} as never, next);

    expect(next.calls).toEqual([undefined]);
  });

  it("blocks seller from exports before controller execution", () => {
    const request = makeRoleRequest("seller");
    const next = createNextSpy();

    canDownloadExports(request, {} as never, next);

    expect(next.calls).toHaveLength(1);
    expectHttpError(next.calls[0], {
      code: "FORBIDDEN",
      statusCode: 403
    });
  });
});

class FakeExportsRepository implements ExportsRepositoryPort {
  sales: SalesCsvExportRecord[] = [];
  inventoryMovements: InventoryMovementCsvExportRecord[] = [];
  auditLogs: Array<{
    fileName: string;
    filters: CsvExportFilters;
    rowCount: number;
    context: ExportAuditContext;
  }> = [];
  lastSalesFilters?: CsvExportFilters;
  lastInventoryMovementFilters?: CsvExportFilters;

  listSalesForCsv(filters: CsvExportFilters) {
    this.lastSalesFilters = filters;

    return Promise.resolve(this.sales);
  }

  listInventoryMovementsForCsv(filters: CsvExportFilters) {
    this.lastInventoryMovementFilters = filters;

    return Promise.resolve(this.inventoryMovements);
  }

  createCsvDownloadAuditLog(input: {
    fileName: string;
    filters: CsvExportFilters;
    rowCount: number;
    context: ExportAuditContext;
  }) {
    this.auditLogs.push(input);

    return Promise.resolve({ id: `audit-${this.auditLogs.length}` });
  }
}

function makeSale(overrides: Partial<Omit<SalesCsvExportRecord, "totalAmount" | "totalCost" | "totalMargin">> & {
  totalAmount?: Prisma.Decimal.Value;
  totalCost?: Prisma.Decimal.Value;
  totalMargin?: Prisma.Decimal.Value;
} = {}): SalesCsvExportRecord {
  return {
    id: overrides.id ?? "sale-1",
    correlativeCode: overrides.correlativeCode ?? "V-000001",
    status: overrides.status ?? "confirmed",
    sellerUser: overrides.sellerUser ?? { fullName: "Ana Perez" },
    cashSession: overrides.cashSession ?? { correlativeCode: "C-000001" },
    totalAmount: decimal(overrides.totalAmount ?? 30),
    totalCost: decimal(overrides.totalCost ?? 20),
    totalMargin: decimal(overrides.totalMargin ?? 10),
    confirmedAt: overrides.confirmedAt ?? new Date("2026-06-25T14:00:00.000Z"),
    cancelledAt: overrides.cancelledAt ?? null,
    saleReturn: overrides.saleReturn ?? null
  };
}

function makeInventoryMovement(
  overrides: Partial<Omit<InventoryMovementCsvExportRecord, "quantityBase" | "unitCostBase">> & {
    quantityBase?: Prisma.Decimal.Value;
    unitCostBase?: Prisma.Decimal.Value;
  } = {}
): InventoryMovementCsvExportRecord {
  return {
    id: overrides.id ?? "movement-1",
    type: overrides.type ?? "inventory_adjustment",
    batchId: overrides.batchId ?? "batch-1",
    productId: overrides.productId ?? "product-1",
    quantityBase: decimal(overrides.quantityBase ?? 2.5),
    unitCostBase: decimal(overrides.unitCostBase ?? 4),
    referenceType: overrides.referenceType ?? "adjustment",
    referenceId: overrides.referenceId ?? "adjustment-1",
    actorUser: overrides.actorUser ?? null,
    reason: overrides.reason ?? null,
    createdAt: overrides.createdAt ?? new Date("2026-06-25T18:00:00.000Z"),
    product: overrides.product ?? {
      internalCode: "MED-001",
      commercialName: "Paracetamol 500 mg"
    },
    batch: overrides.batch ?? {
      batchNumber: "LOT-001"
    }
  };
}

function decimal(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value);
}

function makeRoleRequest(roleName: string) {
  return {
    authenticatedUser: {
      id: `${roleName}-1`,
      fullName: roleName,
      email: `${roleName}@example.com`,
      status: "active",
      role: {
        id: `${roleName}-role`,
        name: roleName
      }
    }
  } as never;
}

function createNextSpy() {
  const next = ((error?: unknown) => {
    next.calls.push(error);
  }) as ((error?: unknown) => void) & { calls: unknown[] };

  next.calls = [];

  return next;
}
