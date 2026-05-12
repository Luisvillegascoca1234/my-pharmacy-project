import { describe, expect, it } from "vitest";
import { captureHttpError, expectHttpError } from "../../tests/utils/http-error.js";
import {
  FakeInventoryRepository,
  decimal,
  makeInventoryBatchRecord,
  makePurchaseItemRecord,
  testTransactionClient
} from "../../tests/utils/service-fakes.js";
import { InventoryService } from "./inventory.service.js";

describe("InventoryService purchase receipt and cancellation rules", () => {
  it("creates exactly one active batch and purchase_received movement for each tracked item", async () => {
    const inventoryRepository = new FakeInventoryRepository();
    const service = new InventoryService(inventoryRepository);
    const trackedItem = makePurchaseItemRecord({
      id: "purchase-item-1",
      purchaseId: "purchase-1",
      productId: "product-1",
      baseQuantity: decimal(24),
      baseUnitCost: decimal(1.25),
      isInventoryTracked: true,
      batchNumber: "LOT-001",
      expirationDate: new Date("2027-01-01T00:00:00.000Z")
    });
    const untrackedItem = makePurchaseItemRecord({
      id: "purchase-item-2",
      purchaseId: "purchase-1",
      productId: "service-1",
      isInventoryTracked: false,
      batchNumber: null,
      expirationDate: null
    });

    await service.createPurchaseReceiptLayers(
      {
        purchaseId: "purchase-1",
        actorUserId: "user-1",
        items: [trackedItem, untrackedItem]
      },
      testTransactionClient
    );

    expect(inventoryRepository.batches).toEqual([
      expect.objectContaining({
        id: "batch-1",
        purchaseItemId: "purchase-item-1",
        productId: "product-1",
        originalQuantity: decimal(24),
        availableQuantity: decimal(24),
        baseUnitCost: decimal(1.25),
        batchNumber: "LOT-001",
        expirationDate: new Date("2027-01-01T00:00:00.000Z"),
        status: "active"
      })
    ]);
    expect(inventoryRepository.movements).toEqual([
      {
        batchId: "batch-1",
        productId: "product-1",
        type: "purchase_received",
        quantityBase: decimal(24),
        unitCostBase: decimal(1.25),
        referenceType: "purchase",
        referenceId: "purchase-1",
        referenceItemId: "purchase-item-1",
        actorUserId: "user-1",
        reason: "Purchase received"
      }
    ]);
    expect(inventoryRepository.movements[0].productId).toBe(inventoryRepository.batches[0].productId);
  });

  it("creates purchase_cancelled movements with negative quantity and cancels intact batches", async () => {
    const inventoryRepository = new FakeInventoryRepository();
    const service = new InventoryService(inventoryRepository);
    const item = makePurchaseItemRecord({
      id: "purchase-item-1",
      purchaseId: "purchase-1",
      productId: "product-1",
      baseQuantity: decimal(10),
      baseUnitCost: decimal(3.5),
      batchNumber: "LOT-001",
      expirationDate: new Date("2027-01-01T00:00:00.000Z")
    });
    inventoryRepository.batches.push(makeInventoryBatchRecord({ id: "batch-1", purchaseItemId: item.id, purchaseItem: item }));

    await service.cancelPurchaseReceiptLayers(
      {
        purchaseId: "purchase-1",
        actorUserId: "user-1",
        items: [item]
      },
      testTransactionClient
    );

    expect(inventoryRepository.movements).toEqual([
      {
        batchId: "batch-1",
        productId: "product-1",
        type: "purchase_cancelled",
        quantityBase: decimal(-10),
        unitCostBase: decimal(3.5),
        referenceType: "purchase",
        referenceId: "purchase-1",
        referenceItemId: "purchase-item-1",
        actorUserId: "user-1",
        reason: "Purchase cancelled"
      }
    ]);
    expect(inventoryRepository.movements[0].productId).toBe(inventoryRepository.batches[0].productId);
    expect(inventoryRepository.batches[0]).toEqual(
      expect.objectContaining({
        status: "cancelled",
        availableQuantity: decimal(0)
      })
    );
  });

  it("blocks consumed received batches before creating cancellation movements", async () => {
    const inventoryRepository = new FakeInventoryRepository();
    const service = new InventoryService(inventoryRepository);
    const item = makePurchaseItemRecord({
      id: "purchase-item-1",
      purchaseId: "purchase-1",
      productId: "product-1",
      baseQuantity: decimal(10),
      baseUnitCost: decimal(3.5)
    });
    inventoryRepository.batches.push(
      makeInventoryBatchRecord({
        id: "batch-1",
        purchaseItemId: item.id,
        purchaseItem: item,
        availableQuantity: decimal(6)
      })
    );

    const error = await captureHttpError(() =>
      service.cancelPurchaseReceiptLayers(
        {
          purchaseId: "purchase-1",
          actorUserId: "user-1",
          items: [item]
        },
        testTransactionClient
      )
    );

    expectHttpError(error, {
      code: "PURCHASE_INVENTORY_LAYER_NOT_REVERSIBLE",
      statusCode: 409
    });
    expect(inventoryRepository.movements).toHaveLength(0);
    expect(inventoryRepository.batches[0]).toEqual(
      expect.objectContaining({
        status: "active",
        availableQuantity: decimal(6)
      })
    );
  });
});
