import { HttpError } from "../../common/http/http-error.js";
import { InventoryRepository } from "./inventory.repository.js";
import type {
  CancelPurchaseInventoryLayersInput,
  CreateInventoryBatchData,
  CreateInventoryMovementData,
  CreatePurchaseInventoryLayersInput,
  InventoryBatchWithPurchaseItem,
  InventoryTransactionClient,
  PurchaseInventoryItem
} from "./inventory.types.js";

type InventoryBatchRecord = Pick<
  InventoryBatchWithPurchaseItem,
  "id" | "productId" | "originalQuantity" | "availableQuantity" | "baseUnitCost" | "batchNumber" | "expirationDate" | "status"
>;

export type InventoryRepositoryPort = {
  createBatch(data: CreateInventoryBatchData, client: InventoryTransactionClient): Promise<InventoryBatchRecord>;
  createMovement(data: CreateInventoryMovementData, client: InventoryTransactionClient): Promise<unknown>;
  findBatchesByPurchaseId(
    purchaseId: string,
    client: InventoryTransactionClient
  ): Promise<InventoryBatchWithPurchaseItem[]>;
  cancelBatch(id: string, client: InventoryTransactionClient): Promise<unknown>;
};

export type InventoryServicePort = Pick<InventoryService, "createPurchaseReceiptLayers" | "cancelPurchaseReceiptLayers">;

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

function areNullableDatesEqual(firstValue: Date | null, secondValue: Date | null) {
  return firstValue?.getTime() === secondValue?.getTime();
}
