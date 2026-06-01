import { Prisma } from "@prisma/client";
import type {
  CreateInventoryAdjustment,
  FefoPreview,
  InventoryAdjustment,
  InventoryBatch,
  InventoryMovement,
  InventoryMovementsListResponse,
  InventoryMovementsQuery,
  InventoryStockItem,
  InventoryStockListResponse,
  InventoryStockQuery
} from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { InventoryRepository } from "./inventory.repository.js";
import type {
  AuditContext,
  CancelPurchaseInventoryLayersInput,
  CreateInventoryAdjustmentData,
  CreateInventoryBatchData,
  CreateInventoryMovementData,
  CreatePurchaseInventoryLayersInput,
  InventoryBatchRecord,
  InventoryBatchWithPurchaseItem,
  InventoryMovementRecord,
  InventoryTransactionClient,
  PurchaseInventoryItem
} from "./inventory.types.js";

type InventoryBatchLayerRecord = Pick<
  InventoryBatchWithPurchaseItem,
  "id" | "productId" | "originalQuantity" | "availableQuantity" | "baseUnitCost" | "batchNumber" | "expirationDate" | "status"
>;

type InventoryRepositoryPort = {
  runInTransaction<T>(callback: (client: InventoryTransactionClient) => Promise<T>): Promise<T>;
  createAdjustment(data: CreateInventoryAdjustmentData, client: InventoryTransactionClient): Promise<{ id: string; createdAt: Date }>;
  createBatch(data: CreateInventoryBatchData, client: InventoryTransactionClient): Promise<InventoryBatchLayerRecord>;
  createMovement(data: CreateInventoryMovementData, client: InventoryTransactionClient): Promise<unknown>;
  createAuditLog(action: string, entityId: string, metadata: unknown, context: AuditContext, client?: InventoryTransactionClient): Promise<unknown>;
  findBatchById(id: string, client?: InventoryTransactionClient): Promise<InventoryBatchRecord | null>;
  findBatchesByPurchaseId(
    purchaseId: string,
    client: InventoryTransactionClient
  ): Promise<InventoryBatchWithPurchaseItem[]>;
  listBatches(filters?: { productId?: string; search?: string }): Promise<InventoryBatchRecord[]>;
  listFefoBatches(productId: string, today: Date): Promise<InventoryBatchRecord[]>;
  listMovements(filters: {
    search?: string;
    productId?: string;
    type?: InventoryMovementRecord["type"];
    fromDate?: string;
    toDate?: string;
    page: number;
    pageSize: number;
  }): Promise<{ data: InventoryMovementRecord[]; total: number }>;
  updateBatchQuantity(id: string, availableQuantity: Prisma.Decimal, client: InventoryTransactionClient): Promise<unknown>;
  cancelBatch(id: string, client: InventoryTransactionClient): Promise<unknown>;
};

export type InventoryServicePort = Pick<InventoryService, "createPurchaseReceiptLayers" | "cancelPurchaseReceiptLayers">;

const EXPIRING_SOON_DAYS = 30;

export class InventoryService {
  constructor(private readonly inventoryRepository: InventoryRepositoryPort = new InventoryRepository()) {}

  async createPurchaseReceiptLayers(input: CreatePurchaseInventoryLayersInput, client: InventoryTransactionClient) {
    const trackedItems = input.items.filter((item) => item.isInventoryTracked);

    for (const item of trackedItems) {
      const batch = await this.inventoryRepository.createBatch(
        {
          purchaseItemId: item.id,
          productId: item.productId,
          originalQuantity: item.baseQuantity,
          availableQuantity: item.baseQuantity,
          baseUnitCost: item.baseUnitCost,
          batchNumber: item.batchNumber,
          expirationDate: item.expirationDate
        },
        client
      );

      await this.inventoryRepository.createMovement(
        {
          batchId: batch.id,
          productId: batch.productId,
          type: "purchase_received",
          quantityBase: batch.originalQuantity,
          unitCostBase: batch.baseUnitCost,
          referenceType: "purchase",
          referenceId: input.purchaseId,
          referenceItemId: item.id,
          actorUserId: input.actorUserId,
          reason: "Purchase received"
        },
        client
      );
    }
  }

  async cancelPurchaseReceiptLayers(input: CancelPurchaseInventoryLayersInput, client: InventoryTransactionClient) {
    const batches = await this.inventoryRepository.findBatchesByPurchaseId(input.purchaseId, client);

    this.ensurePurchaseLayersCanBeCancelled(input.items, batches);

    for (const batch of batches) {
      await this.inventoryRepository.createMovement(
        {
          batchId: batch.id,
          productId: batch.productId,
          type: "purchase_cancelled",
          quantityBase: batch.originalQuantity.negated(),
          unitCostBase: batch.baseUnitCost,
          referenceType: "purchase",
          referenceId: input.purchaseId,
          referenceItemId: batch.purchaseItemId,
          actorUserId: input.actorUserId,
          reason: "Purchase cancelled"
        },
        client
      );

      await this.inventoryRepository.cancelBatch(batch.id, client);
    }
  }

  async listStock(query: InventoryStockQuery): Promise<InventoryStockListResponse> {
    const batches = await this.inventoryRepository.listBatches({
      productId: query.productId,
      search: query.search
    });
    const groupedStock = Array.from(groupStockItems(batches).values()).filter((item) => !query.status || item.status === query.status);
    const page = query.page;
    const pageSize = query.pageSize;
    const data = groupedStock.slice((page - 1) * pageSize, page * pageSize);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total: groupedStock.length,
        totalPages: Math.ceil(groupedStock.length / pageSize)
      }
    };
  }

  async listProductBatches(productId: string): Promise<InventoryBatch[]> {
    const batches = await this.inventoryRepository.listBatches({ productId });

    return batches.map(toInventoryBatch);
  }

  async listMovements(query: InventoryMovementsQuery): Promise<InventoryMovementsListResponse> {
    const page = query.page;
    const pageSize = query.pageSize;
    const result = await this.inventoryRepository.listMovements({
      fromDate: query.fromDate,
      page,
      pageSize,
      productId: query.productId,
      search: query.search,
      toDate: query.toDate,
      type: query.type
    });

    return {
      data: result.data.map(toInventoryMovement),
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize)
      }
    };
  }

  async createAdjustment(input: CreateInventoryAdjustment, context: AuditContext): Promise<InventoryAdjustment> {
    const actorUserId = getAuthenticatedUserId(context);
    const countedQuantity = new Prisma.Decimal(input.countedQuantity);
    const reason = input.reason.trim();

    return this.inventoryRepository.runInTransaction(async (tx) => {
      const batch = await this.inventoryRepository.findBatchById(input.batchId, tx);

      if (!batch) {
        throw new HttpError(404, "Inventory batch was not found.", "INVENTORY_BATCH_NOT_FOUND");
      }

      if (batch.status === "cancelled") {
        throw new HttpError(409, "Cancelled inventory batches cannot be adjusted.", "INVENTORY_BATCH_CANCELLED");
      }

      const differenceQuantity = countedQuantity.minus(batch.availableQuantity);
      const adjustment = await this.inventoryRepository.createAdjustment(
        {
          actorUserId,
          batchId: batch.id,
          countedQuantity,
          differenceQuantity,
          previousQuantity: batch.availableQuantity,
          productId: batch.productId,
          reason
        },
        tx
      );

      if (!differenceQuantity.equals(0)) {
        await this.inventoryRepository.updateBatchQuantity(batch.id, countedQuantity, tx);
        await this.inventoryRepository.createMovement(
          {
            actorUserId,
            batchId: batch.id,
            productId: batch.productId,
            type: "inventory_adjustment",
            quantityBase: differenceQuantity,
            unitCostBase: batch.baseUnitCost,
            referenceType: "inventory_adjustment",
            referenceId: adjustment.id,
            referenceItemId: null,
            reason
          },
          tx
        );
      }

      await this.inventoryRepository.createAuditLog(
        "INVENTORY_ADJUSTED",
        adjustment.id,
        {
          batchId: batch.id,
          productId: batch.productId,
          previousQuantity: Number(batch.availableQuantity),
          countedQuantity: Number(countedQuantity),
          differenceQuantity: Number(differenceQuantity),
          reason
        },
        context,
        tx
      );

      return {
        id: adjustment.id,
        batchId: batch.id,
        productId: batch.productId,
        previousQuantity: Number(batch.availableQuantity),
        countedQuantity: Number(countedQuantity),
        differenceQuantity: Number(differenceQuantity),
        reason,
        createdAt: adjustment.createdAt.toISOString()
      };
    });
  }

  async getFefoPreview(productId: string, requestedQuantity?: number): Promise<FefoPreview> {
    const batches = await this.inventoryRepository.listFefoBatches(productId, toDateOnlyStart(new Date()));
    const requested = requestedQuantity === undefined ? undefined : new Prisma.Decimal(requestedQuantity);
    let remaining = requested;

    const allocations = batches.map((batch) => {
      const allocatedQuantity =
        remaining === undefined
          ? new Prisma.Decimal(0)
          : remaining.lessThanOrEqualTo(0)
            ? new Prisma.Decimal(0)
            : batch.availableQuantity.lessThan(remaining)
              ? batch.availableQuantity
              : remaining;

      if (remaining !== undefined) {
        remaining = remaining.minus(allocatedQuantity);
      }

      return {
        batchId: batch.id,
        batchNumber: batch.batchNumber ?? undefined,
        expirationDate: batch.expirationDate ? toDateOnly(batch.expirationDate) : undefined,
        availableQuantity: Number(batch.availableQuantity),
        allocatedQuantity: Number(allocatedQuantity),
        unitCostBase: Number(batch.baseUnitCost)
      };
    });

    const totalAvailableQuantity = batches.reduce((total, batch) => total.plus(batch.availableQuantity), new Prisma.Decimal(0));

    return {
      allocations,
      canFulfill: requested === undefined ? true : totalAvailableQuantity.greaterThanOrEqualTo(requested),
      productId,
      requestedQuantity,
      totalAvailableQuantity: Number(totalAvailableQuantity)
    };
  }

  private ensurePurchaseLayersCanBeCancelled(
    purchaseItems: PurchaseInventoryItem[],
    batches: InventoryBatchWithPurchaseItem[]
  ) {
    const itemsById = new Map(purchaseItems.map((item) => [item.id, item]));
    const trackedItems = purchaseItems.filter((item) => item.isInventoryTracked);
    const batchesByPurchaseItemId = new Map(batches.map((batch) => [batch.purchaseItemId, batch]));

    for (const item of trackedItems) {
      const batch = batchesByPurchaseItemId.get(item.id);

      if (!batch || !this.batchMatchesPurchaseItem(batch, item)) {
        throw new HttpError(
          409,
          "Purchase inventory layers do not match the purchase items.",
          "PURCHASE_INVENTORY_LAYER_MISMATCH"
        );
      }

      if (!batch.availableQuantity.equals(batch.originalQuantity) || batch.status !== "active") {
        throw new HttpError(
          409,
          "Purchase inventory layers were already consumed or cancelled.",
          "PURCHASE_INVENTORY_LAYER_NOT_REVERSIBLE"
        );
      }
    }

    for (const batch of batches) {
      const item = itemsById.get(batch.purchaseItemId);

      if (!item?.isInventoryTracked || !this.batchMatchesPurchaseItem(batch, item)) {
        throw new HttpError(
          409,
          "Purchase inventory layers do not match the purchase items.",
          "PURCHASE_INVENTORY_LAYER_MISMATCH"
        );
      }
    }
  }

  private batchMatchesPurchaseItem(batch: InventoryBatchWithPurchaseItem, item: PurchaseInventoryItem) {
    return (
      batch.purchaseItemId === item.id &&
      batch.productId === item.productId &&
      batch.originalQuantity.equals(item.baseQuantity) &&
      batch.baseUnitCost.equals(item.baseUnitCost) &&
      batch.batchNumber === item.batchNumber &&
      areNullableDatesEqual(batch.expirationDate, item.expirationDate)
    );
  }
}

function groupStockItems(batches: InventoryBatchRecord[]) {
  const items = new Map<string, InventoryStockItem>();

  for (const batch of batches) {
    const key = [batch.productId, batch.batchNumber ?? "", batch.expirationDate ? toDateOnly(batch.expirationDate) : ""].join("|");
    const current = items.get(key);
    const totalValue = Number(batch.availableQuantity.mul(batch.baseUnitCost));
    const nextAvailable = (current?.totalAvailableQuantity ?? 0) + Number(batch.availableQuantity);
    const nextOriginal = (current?.totalOriginalQuantity ?? 0) + Number(batch.originalQuantity);
    const nextValue = (current?.totalValue ?? 0) + totalValue;

    items.set(key, {
      productId: batch.productId,
      product: toInventoryProductSummary(batch.product),
      batchNumber: batch.batchNumber ?? undefined,
      expirationDate: batch.expirationDate ? toDateOnly(batch.expirationDate) : undefined,
      totalOriginalQuantity: nextOriginal,
      totalAvailableQuantity: nextAvailable,
      totalValue: nextValue,
      averageUnitCost: nextAvailable > 0 ? nextValue / nextAvailable : 0,
      layerCount: (current?.layerCount ?? 0) + 1,
      status: getStockStatus(nextAvailable, Number(batch.product.minimumStock), batch.expirationDate),
      oldestLayerCreatedAt: current?.oldestLayerCreatedAt ?? batch.createdAt.toISOString()
    });
  }

  return items;
}

function getStockStatus(availableQuantity: number, minimumStock: number, expirationDate: Date | null) {
  if (availableQuantity <= 0) {
    return "out_of_stock";
  }

  if (expirationDate && toDateOnly(expirationDate) < toDateOnly(new Date())) {
    return "expired";
  }

  if (expirationDate && toDateOnly(expirationDate) <= toDateOnly(addDays(new Date(), EXPIRING_SOON_DAYS))) {
    return "near_expiration";
  }

  if (minimumStock > 0 && availableQuantity <= minimumStock) {
    return "low_stock";
  }

  return "available";
}

function toInventoryBatch(batch: InventoryBatchRecord): InventoryBatch {
  return {
    id: batch.id,
    productId: batch.productId,
    product: toInventoryProductSummary(batch.product),
    purchaseItemId: batch.purchaseItemId,
    purchaseId: batch.purchaseItem.purchaseId,
    supplierName: batch.purchaseItem.purchase.supplier.businessName,
    originalQuantity: Number(batch.originalQuantity),
    availableQuantity: Number(batch.availableQuantity),
    baseUnitCost: Number(batch.baseUnitCost),
    batchNumber: batch.batchNumber ?? undefined,
    expirationDate: batch.expirationDate ? toDateOnly(batch.expirationDate) : undefined,
    status: batch.status,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString()
  };
}

function toInventoryMovement(movement: InventoryMovementRecord): InventoryMovement {
  return {
    id: movement.id,
    batchId: movement.batchId,
    productId: movement.productId,
    product: toInventoryProductSummary(movement.product),
    type: movement.type,
    quantityBase: Number(movement.quantityBase),
    unitCostBase: Number(movement.unitCostBase),
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
    referenceItemId: movement.referenceItemId ?? undefined,
    actorUser: movement.actorUser ?? undefined,
    batchNumber: movement.batch.batchNumber ?? undefined,
    expirationDate: movement.batch.expirationDate ? toDateOnly(movement.batch.expirationDate) : undefined,
    reason: movement.reason ?? undefined,
    createdAt: movement.createdAt.toISOString()
  };
}

function toInventoryProductSummary(product: InventoryBatchRecord["product"]) {
  return {
    id: product.id,
    internalCode: product.internalCode,
    commercialName: product.commercialName,
    genericName: product.genericName ?? undefined,
    minimumStock: Number(product.minimumStock),
    baseUnit: product.baseUnit
  };
}

function getAuthenticatedUserId(context: AuditContext) {
  if (!context.actorUserId) {
    throw new HttpError(401, "Authenticated user is required to adjust inventory.", "AUTHENTICATED_USER_REQUIRED");
  }

  return context.actorUserId;
}

function areNullableDatesEqual(firstValue: Date | null, secondValue: Date | null) {
  return firstValue?.getTime() === secondValue?.getTime();
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toDateOnlyStart(value: Date) {
  return new Date(`${toDateOnly(value)}T00:00:00.000Z`);
}

function addDays(value: Date, days: number) {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}
