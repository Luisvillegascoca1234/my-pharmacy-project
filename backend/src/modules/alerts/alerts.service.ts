import type { Alert, AlertsListResponse } from "@pharmacy-pos/shared";
import { InventoryRepository } from "../inventory/inventory.repository.js";
import type { InventoryBatchRecord } from "../inventory/inventory.types.js";

const EXPIRING_SOON_DAYS = 30;

export class AlertsService {
  constructor(private readonly inventoryRepository = new InventoryRepository()) {}

  async listAlerts(): Promise<AlertsListResponse> {
    const batches = await this.inventoryRepository.listBatches();
    const alerts = buildAlerts(batches);

    return {
      data: alerts,
      generatedAt: new Date().toISOString()
    };
  }
}

function buildAlerts(batches: InventoryBatchRecord[]): Alert[] {
  const alerts: Alert[] = [];
  const stockByProduct = new Map<string, { product: InventoryBatchRecord["product"]; availableQuantity: number }>();

  for (const batch of batches) {
    const current = stockByProduct.get(batch.productId);

    stockByProduct.set(batch.productId, {
      product: batch.product,
      availableQuantity: (current?.availableQuantity ?? 0) + Number(batch.availableQuantity)
    });

    if (Number(batch.availableQuantity) <= 0) {
      continue;
    }

    if (batch.expirationDate && toDateOnly(batch.expirationDate) < toDateOnly(new Date())) {
      alerts.push(toAlert(batch, "expired", "critical", "Lote vencido con saldo disponible."));
      continue;
    }

    if (batch.expirationDate && toDateOnly(batch.expirationDate) <= toDateOnly(addDays(new Date(), EXPIRING_SOON_DAYS))) {
      alerts.push(toAlert(batch, "near_expiration", "warning", "Lote próximo a vencer."));
    }
  }

  for (const [productId, stock] of stockByProduct) {
    const minimumStock = Number(stock.product.minimumStock);

    if (stock.availableQuantity <= 0) {
      alerts.push({
        id: `out_of_stock:${productId}`,
        type: "out_of_stock",
        severity: "critical",
        productId,
        productName: stock.product.commercialName,
        internalCode: stock.product.internalCode,
        availableQuantity: 0,
        minimumStock,
        baseUnitAbbreviation: stock.product.baseUnit.abbreviation,
        message: "Producto sin saldo disponible."
      });
      continue;
    }

    if (minimumStock > 0 && stock.availableQuantity <= minimumStock) {
      alerts.push({
        id: `low_stock:${productId}`,
        type: "low_stock",
        severity: "warning",
        productId,
        productName: stock.product.commercialName,
        internalCode: stock.product.internalCode,
        availableQuantity: stock.availableQuantity,
        minimumStock,
        baseUnitAbbreviation: stock.product.baseUnit.abbreviation,
        message: "Producto por debajo del stock mínimo."
      });
    }
  }

  return alerts.sort((first, second) => severityRank(second.severity) - severityRank(first.severity));
}

function toAlert(
  batch: InventoryBatchRecord,
  type: "near_expiration" | "expired",
  severity: "warning" | "critical",
  message: string
): Alert {
  return {
    id: `${type}:${batch.id}`,
    type,
    severity,
    productId: batch.productId,
    productName: batch.product.commercialName,
    internalCode: batch.product.internalCode,
    batchNumber: batch.batchNumber ?? undefined,
    expirationDate: batch.expirationDate ? toDateOnly(batch.expirationDate) : undefined,
    availableQuantity: Number(batch.availableQuantity),
    minimumStock: Number(batch.product.minimumStock),
    baseUnitAbbreviation: batch.product.baseUnit.abbreviation,
    message
  };
}

function severityRank(severity: Alert["severity"]) {
  return severity === "critical" ? 3 : severity === "warning" ? 2 : 1;
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number) {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}
