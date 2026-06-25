import { Prisma } from "@prisma/client";
import type {
  InventoryMovementsCsvExportQuery,
  InventoryMovementsCsvRow,
  SalesCsvExportQuery,
  SalesCsvRow
} from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { ExportsRepository } from "./exports.repository.js";
import type {
  CsvExportFilters,
  CsvExportResult,
  ExportAuditContext,
  InventoryMovementCsvExportRecord,
  SalesCsvExportRecord
} from "./exports.types.js";

const CSV_CONTENT_TYPE = "text/csv; charset=utf-8";

export type ExportsRepositoryPort = {
  listSalesForCsv(filters: CsvExportFilters): Promise<SalesCsvExportRecord[]>;
  listInventoryMovementsForCsv(filters: CsvExportFilters): Promise<InventoryMovementCsvExportRecord[]>;
  createCsvDownloadAuditLog(input: {
    fileName: string;
    filters: CsvExportFilters;
    rowCount: number;
    context: ExportAuditContext;
  }): Promise<unknown>;
};

export class ExportsService {
  constructor(private readonly exportsRepository: ExportsRepositoryPort = new ExportsRepository()) {}

  async exportSalesCsv(query: SalesCsvExportQuery, context: ExportAuditContext): Promise<CsvExportResult> {
    ensureValidDateRange(query);

    const filters = toCsvExportFilters(query);
    const rows = (await this.exportsRepository.listSalesForCsv(filters)).map(toSalesCsvRow);
    const csv = stringifyCsv(
      [
        "saleId",
        "correlativeCode",
        "status",
        "sellerName",
        "cashSessionCorrelativeCode",
        "totalAmount",
        "totalCost",
        "totalMargin",
        "confirmedAt",
        "cancelledAt",
        "returnedAt"
      ],
      rows
    );

    await this.exportsRepository.createCsvDownloadAuditLog({
      fileName: "sales.csv",
      filters,
      rowCount: rows.length,
      context
    });

    return {
      fileName: "sales.csv",
      contentType: CSV_CONTENT_TYPE,
      rowCount: rows.length,
      csv
    };
  }

  async exportInventoryMovementsCsv(
    query: InventoryMovementsCsvExportQuery,
    context: ExportAuditContext
  ): Promise<CsvExportResult> {
    ensureValidDateRange(query);

    const filters = toCsvExportFilters(query);
    const rows = (await this.exportsRepository.listInventoryMovementsForCsv(filters)).map(toInventoryMovementsCsvRow);
    const csv = stringifyCsv(
      [
        "movementId",
        "type",
        "productId",
        "internalCode",
        "commercialName",
        "batchId",
        "batchNumber",
        "quantityBase",
        "unitCostBase",
        "referenceType",
        "referenceId",
        "actorUserName",
        "reason",
        "createdAt"
      ],
      rows
    );

    await this.exportsRepository.createCsvDownloadAuditLog({
      fileName: "inventory-movements.csv",
      filters,
      rowCount: rows.length,
      context
    });

    return {
      fileName: "inventory-movements.csv",
      contentType: CSV_CONTENT_TYPE,
      rowCount: rows.length,
      csv
    };
  }
}

function ensureValidDateRange(query: CsvExportFilters) {
  if (query.fromDate && query.toDate && query.fromDate > query.toDate) {
    throw new HttpError(400, "fromDate must be less than or equal to toDate.", "INVALID_EXPORT_DATE_RANGE");
  }
}

function toCsvExportFilters(query: CsvExportFilters): CsvExportFilters {
  return {
    fromDate: query.fromDate,
    toDate: query.toDate
  };
}

function toSalesCsvRow(sale: SalesCsvExportRecord): SalesCsvRow {
  return {
    saleId: sale.id,
    correlativeCode: sale.correlativeCode,
    status: sale.status,
    sellerName: sale.sellerUser.fullName,
    cashSessionCorrelativeCode: sale.cashSession.correlativeCode,
    totalAmount: toMoney(sale.totalAmount),
    totalCost: toMoney(sale.totalCost),
    totalMargin: toMoney(sale.totalMargin),
    confirmedAt: sale.confirmedAt.toISOString(),
    cancelledAt: sale.cancelledAt?.toISOString(),
    returnedAt: sale.saleReturn?.returnedAt.toISOString()
  };
}

function toInventoryMovementsCsvRow(movement: InventoryMovementCsvExportRecord): InventoryMovementsCsvRow {
  return {
    movementId: movement.id,
    type: movement.type,
    productId: movement.productId,
    internalCode: movement.product.internalCode,
    commercialName: movement.product.commercialName,
    batchId: movement.batchId,
    batchNumber: movement.batch.batchNumber ?? undefined,
    quantityBase: toQuantity(movement.quantityBase),
    unitCostBase: toQuantity(movement.unitCostBase),
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
    actorUserName: movement.actorUser?.fullName,
    reason: movement.reason ?? undefined,
    createdAt: movement.createdAt.toISOString()
  };
}

function stringifyCsv<T extends Record<string, unknown>>(headers: Array<keyof T & string>, rows: T[]) {
  const lines = [headers.join(";")];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvValue(row[header])).join(";"));
  }

  return `${lines.join("\r\n")}\r\n`;
}

function escapeCsvValue(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }

  const text = String(value);

  if (!/[;"\r\n]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function toMoney(value: Prisma.Decimal.Value) {
  return Number(new Prisma.Decimal(value).toDecimalPlaces(2));
}

function toQuantity(value: Prisma.Decimal.Value) {
  return Number(new Prisma.Decimal(value).toDecimalPlaces(4));
}
