import { Prisma } from "@prisma/client";
import type {
  CreateInventoryBatchData,
  CreateInventoryMovementData,
  InventoryBatchWithPurchaseItem,
  InventoryTransactionClient
} from "./inventory.types.js";

export class InventoryRepository {
  createBatch(data: CreateInventoryBatchData, client: InventoryTransactionClient) {
    return client.inventoryBatch.create({
      data: {
        ...data,
        status: "active"
      }
    });
  }

  createMovement(data: CreateInventoryMovementData, client: InventoryTransactionClient) {
    return client.inventoryMovement.create({
      data
    });
  }

  findBatchesByPurchaseId(
    purchaseId: string,
    client: InventoryTransactionClient
  ): Promise<InventoryBatchWithPurchaseItem[]> {
    return client.inventoryBatch.findMany({
      where: {
        purchaseItem: {
          purchaseId
        }
      },
      include: {
        purchaseItem: {
          select: {
            id: true,
            productId: true,
            baseQuantity: true,
            baseUnitCost: true,
            isInventoryTracked: true,
            batchNumber: true,
            expirationDate: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  cancelBatch(id: string, client: InventoryTransactionClient) {
    return client.inventoryBatch.update({
      where: { id },
      data: {
        availableQuantity: new Prisma.Decimal(0),
        status: "cancelled"
      }
    });
  }
}
