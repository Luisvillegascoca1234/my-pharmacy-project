import type { CreatePurchase } from "@pharmacy-pos/shared";
import { describe, expect, it } from "vitest";
import { captureHttpError, expectHttpError } from "../../tests/utils/http-error.js";
import {
  FakeInventoryService,
  FakeInventoryRepository,
  FakePurchasesRepository,
  decimal,
  makeInventoryBatchRecord,
  makeProductWithPurchaseRelations,
  makePurchaseItemRecord,
  makePurchaseRecord,
  makeSupplierRecord,
  makeUserRecord
} from "../../tests/utils/service-fakes.js";
import { InventoryService } from "../inventory/inventory.service.js";
import { PurchasesService } from "./purchases.service.js";

const auditContext = {
  actorUserId: "user-1",
  ipAddress: "127.0.0.1",
  userAgent: "vitest"
};

const basePurchaseInput: CreatePurchase = {
  supplierId: "supplier-1",
  purchaseDate: "2026-02-03",
  notes: " Compra inicial ",
  items: [
    {
      productId: "product-1",
      unitId: "unit-box",
      quantity: 2.3456,
      unitCost: 10.12,
      batchNumber: " lot-001 ",
      expirationDate: "2027-04-05"
    }
  ]
};

describe("PurchasesService draft rules", () => {
  it("preserves list filters and maps paginated purchase summaries", async () => {
    const supplier = makeSupplierRecord({ id: "supplier-1", businessName: "Laboratorio Norte" });
    const purchasesRepository = new FakePurchasesRepository();
    purchasesRepository.listPurchasesResult = {
      data: [
        makePurchaseRecord({
          id: "purchase-1",
          supplier,
          supplierId: supplier.id,
          status: "draft",
          totalAmount: decimal(25.5)
        })
      ],
      total: 3
    };
    const service = new PurchasesService(purchasesRepository, new FakeInventoryService());

    const result = await service.listPurchases({
      search: "lab",
      status: "draft",
      supplierId: "supplier-1",
      fromDate: "2026-01-01",
      toDate: "2026-01-31",
      page: 2,
      pageSize: 1
    });

    expect(purchasesRepository.listPurchasesCalls).toEqual([
      {
        search: "lab",
        status: "draft",
        supplierId: "supplier-1",
        fromDate: "2026-01-01",
        toDate: "2026-01-31",
        page: 2,
        pageSize: 1
      }
    ]);
    expect(result).toEqual({
      data: [
        expect.objectContaining({
          id: "purchase-1",
          supplierId: "supplier-1",
          supplier: expect.objectContaining({ businessName: "Laboratorio Norte" }),
          status: "draft",
          totalAmount: 25.5
        })
      ],
      pagination: {
        page: 2,
        pageSize: 1,
        total: 3,
        totalPages: 3
      }
    });
  });

  it("returns purchase detail and maps missing purchases to PURCHASE_NOT_FOUND", async () => {
    const purchasesRepository = createSeededRepository();
    const product = makeProductWithPurchaseRelations({ id: "product-1" });
    purchasesRepository.seedProducts([product]);
    purchasesRepository.seedPurchases([
      makePurchaseRecord({
        id: "purchase-1",
        items: [
          {
            ...product.units[0],
            id: "purchase-item-1",
            purchaseId: "purchase-1",
            productId: product.id,
            product,
            unitId: product.units[0].unitId,
            unit: product.units[0].unit,
            quantity: decimal(3),
            unitCost: decimal(4),
            conversionFactor: decimal(1),
            baseQuantity: decimal(3),
            baseUnitCost: decimal(4),
            lineTotal: decimal(12),
            isInventoryTracked: true,
            batchNumber: "LOT-001",
            expirationDate: new Date("2027-01-01T00:00:00.000Z"),
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-01-01T00:00:00.000Z")
          }
        ]
      })
    ]);
    const service = new PurchasesService(purchasesRepository, new FakeInventoryService());

    await expect(service.getPurchase("purchase-1")).resolves.toEqual(
      expect.objectContaining({
        id: "purchase-1",
        createdByUser: expect.objectContaining({ id: "user-1" }),
        items: [
          expect.objectContaining({
            id: "purchase-item-1",
            productName: "Paracetamol 500mg",
            batchNumber: "LOT-001",
            expirationDate: "2027-01-01"
          })
        ]
      })
    );

    const error = await captureHttpError(() => service.getPurchase("missing-purchase"));

    expectHttpError(error, {
      code: "PURCHASE_NOT_FOUND",
      statusCode: 404
    });
  });

  it("creates a draft purchase with calculated item snapshots, total, normalized batch, and audit", async () => {
    const purchasesRepository = createSeededRepository();
    purchasesRepository.seedProducts([makePurchaseProduct()]);
    const service = new PurchasesService(purchasesRepository, new FakeInventoryService());

    const purchase = await service.createPurchase(basePurchaseInput, auditContext);
    const createdCall = purchasesRepository.createDraftPurchaseCalls[0];
    const createdItem = createdCall.items[0];

    expect(createdCall.input).toEqual({
      supplierId: "supplier-1",
      purchaseDate: new Date("2026-02-03T00:00:00.000Z"),
      totalAmount: decimal(23.74),
      createdByUserId: "user-1",
      notes: "Compra inicial"
    });
    expect(createdItem).toMatchObject({
      productId: "product-1",
      unitId: "unit-box",
      isInventoryTracked: true,
      batchNumber: "LOT-001",
      expirationDate: new Date("2027-04-05T00:00:00.000Z")
    });
    expect(createdItem.quantity.toString()).toBe("2.3456");
    expect(createdItem.unitCost.toString()).toBe("10.12");
    expect(createdItem.conversionFactor.toString()).toBe("12");
    expect(createdItem.baseQuantity.toString()).toBe("28.1472");
    expect(createdItem.baseUnitCost.toString()).toBe("0.8433");
    expect(createdItem.lineTotal.toString()).toBe("23.74");
    expect(purchase).toEqual(
      expect.objectContaining({
        supplierId: "supplier-1",
        purchaseDate: "2026-02-03",
        totalAmount: 23.74,
        notes: "Compra inicial",
        items: [expect.objectContaining({ batchNumber: "LOT-001", lineTotal: 23.74 })]
      })
    );
    expect(purchasesRepository.auditLogs).toEqual([
      {
        action: "PURCHASE_CREATED",
        entityId: purchase.id,
        context: auditContext,
        metadata: {
          supplierId: "supplier-1",
          purchaseDate: "2026-02-03",
          status: "draft",
          totalAmount: 23.74,
          itemCount: 1
        }
      }
    ]);
  });

  it("requires at least one item, an active supplier, and a valid creator", async () => {
    const emptyItemsRepository = createSeededRepository();
    const emptyItemsService = new PurchasesService(emptyItemsRepository, new FakeInventoryService());

    await expectPurchaseError(
      () => emptyItemsService.createPurchase({ ...basePurchaseInput, items: [] }, auditContext),
      "PURCHASE_ITEMS_REQUIRED"
    );

    const inactiveSupplierRepository = createSeededRepository({ supplierStatus: "inactive" });
    const inactiveSupplierService = new PurchasesService(inactiveSupplierRepository, new FakeInventoryService());

    await expectPurchaseError(
      () => inactiveSupplierService.createPurchase(basePurchaseInput, auditContext),
      "SUPPLIER_NOT_ACTIVE"
    );

    const missingUserRepository = createSeededRepository({ seedUser: false });
    const missingUserService = new PurchasesService(missingUserRepository, new FakeInventoryService());

    await expectPurchaseError(
      () => missingUserService.createPurchase(basePurchaseInput, auditContext),
      "AUTHENTICATED_USER_NOT_FOUND"
    );
  });

  it("updates only draft purchases by replacing the header and items transactionally through the repository", async () => {
    const purchasesRepository = createSeededRepository();
    purchasesRepository.seedProducts([makePurchaseProduct()]);
    purchasesRepository.seedPurchases([makePurchaseRecord({ id: "purchase-1", status: "draft" })]);
    const service = new PurchasesService(purchasesRepository, new FakeInventoryService());

    const purchase = await service.updatePurchase("purchase-1", basePurchaseInput, auditContext);

    expect(purchasesRepository.replaceDraftPurchaseCalls).toEqual([
      expect.objectContaining({
        id: "purchase-1",
        context: auditContext,
        input: {
          supplierId: "supplier-1",
          purchaseDate: new Date("2026-02-03T00:00:00.000Z"),
          totalAmount: decimal(23.74),
          notes: "Compra inicial"
        },
        items: [expect.objectContaining({ batchNumber: "LOT-001", lineTotal: decimal(23.74) })]
      })
    ]);
    expect(purchase.items).toEqual([expect.objectContaining({ productId: "product-1", batchNumber: "LOT-001" })]);
    expect(purchasesRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "PURCHASE_UPDATED",
        entityId: "purchase-1",
        context: auditContext
      })
    ]);
  });

  it("rejects updates for purchases that are not in draft status", async () => {
    const purchasesRepository = createSeededRepository();
    purchasesRepository.seedPurchases([makePurchaseRecord({ id: "purchase-1", status: "received" })]);
    const service = new PurchasesService(purchasesRepository, new FakeInventoryService());

    const error = await captureHttpError(() => service.updatePurchase("purchase-1", basePurchaseInput, auditContext));

    expectHttpError(error, {
      code: "PURCHASE_NOT_DRAFT",
      statusCode: 409
    });
    expect(purchasesRepository.replaceDraftPurchaseCalls).toHaveLength(0);
  });

  it("rejects inactive products, unconfigured units, and equivalent duplicate items", async () => {
    const inactiveProductRepository = createSeededRepository();
    inactiveProductRepository.seedProducts([makePurchaseProduct({ status: "inactive" })]);
    const inactiveProductService = new PurchasesService(inactiveProductRepository, new FakeInventoryService());

    await expectPurchaseError(() => inactiveProductService.createPurchase(basePurchaseInput, auditContext), "PRODUCT_NOT_ACTIVE");

    const unconfiguredUnitRepository = createSeededRepository();
    unconfiguredUnitRepository.seedProducts([makePurchaseProduct()]);
    const unconfiguredUnitService = new PurchasesService(unconfiguredUnitRepository, new FakeInventoryService());

    await expectPurchaseError(
      () =>
        unconfiguredUnitService.createPurchase(
          {
            ...basePurchaseInput,
            items: [{ ...basePurchaseInput.items[0], unitId: "missing-unit" }]
          },
          auditContext
        ),
      "PRODUCT_UNIT_NOT_CONFIGURED"
    );

    const supplierMismatchRepository = createSeededRepository();
    supplierMismatchRepository.seedProducts([makePurchaseProduct({ supplierId: "supplier-2" })]);
    const supplierMismatchService = new PurchasesService(supplierMismatchRepository, new FakeInventoryService());

    await expectPurchaseError(
      () => supplierMismatchService.createPurchase(basePurchaseInput, auditContext),
      "PRODUCT_SUPPLIER_MISMATCH"
    );

    const duplicatesRepository = createSeededRepository();
    duplicatesRepository.seedProducts([makePurchaseProduct()]);
    const duplicatesService = new PurchasesService(duplicatesRepository, new FakeInventoryService());

    await expectPurchaseError(
      () =>
        duplicatesService.createPurchase(
          {
            ...basePurchaseInput,
            items: [
              basePurchaseInput.items[0],
              {
                ...basePurchaseInput.items[0],
                unitId: "unit-each",
                batchNumber: "LOT-001"
              }
            ]
          },
          auditContext
        ),
      "DUPLICATED_PURCHASE_ITEM",
      409
    );
  });

  it("validates quantities, costs, pure dates, and batch number length inside the service", async () => {
    const cases: Array<{ code: string; input: CreatePurchase }> = [
      {
        code: "PURCHASE_QUANTITY_INVALID",
        input: { ...basePurchaseInput, items: [{ ...basePurchaseInput.items[0], quantity: 0 }] }
      },
      {
        code: "PURCHASE_UNIT_COST_INVALID",
        input: { ...basePurchaseInput, items: [{ ...basePurchaseInput.items[0], unitCost: 1.234 }] }
      },
      {
        code: "PURCHASE_DATE_INVALID",
        input: { ...basePurchaseInput, purchaseDate: "2026-02-31" }
      },
      {
        code: "PURCHASE_EXPIRATION_DATE_INVALID",
        input: { ...basePurchaseInput, items: [{ ...basePurchaseInput.items[0], expirationDate: "2027-13-01" }] }
      },
      {
        code: "PURCHASE_BATCH_NUMBER_INVALID",
        input: { ...basePurchaseInput, items: [{ ...basePurchaseInput.items[0], batchNumber: "x".repeat(81) }] }
      }
    ];

    for (const testCase of cases) {
      const purchasesRepository = createSeededRepository();
      purchasesRepository.seedProducts([makePurchaseProduct()]);
      const service = new PurchasesService(purchasesRepository, new FakeInventoryService());

      await expectPurchaseError(() => service.createPurchase(testCase.input, auditContext), testCase.code);
      expect(purchasesRepository.createDraftPurchaseCalls).toHaveLength(0);
    }
  });

  it("receives a valid draft purchase transactionally and creates inventory only for tracked items", async () => {
    const purchasesRepository = createSeededRepository();
    const inventoryRepository = new FakeInventoryRepository();
    const inventoryService = new InventoryService(inventoryRepository);
    const trackedProduct = makePurchaseProduct({ id: "product-1" });
    const untrackedProduct = makePurchaseProduct({
      id: "product-2",
      isInventoryTracked: false,
      requiresBatch: false,
      requiresExpiration: false
    });
    const trackedItem = makePurchaseItemRecord({
      id: "purchase-item-1",
      purchaseId: "purchase-1",
      productId: trackedProduct.id,
      product: trackedProduct,
      unitId: "unit-box",
      unit: trackedProduct.units[1].unit,
      quantity: decimal(2),
      unitCost: decimal(12),
      conversionFactor: decimal(12),
      baseQuantity: decimal(24),
      baseUnitCost: decimal(1),
      lineTotal: decimal(24),
      batchNumber: "LOT-001",
      expirationDate: new Date("2027-01-01T00:00:00.000Z")
    });
    const untrackedItem = makePurchaseItemRecord({
      id: "purchase-item-2",
      purchaseId: "purchase-1",
      productId: untrackedProduct.id,
      product: untrackedProduct,
      unitId: "unit-each",
      unit: untrackedProduct.units[0].unit,
      isInventoryTracked: false,
      batchNumber: null,
      expirationDate: null
    });
    purchasesRepository.seedProducts([trackedProduct, untrackedProduct]);
    purchasesRepository.seedPurchases([
      makePurchaseRecord({
        id: "purchase-1",
        status: "draft",
        items: [trackedItem, untrackedItem],
        totalAmount: decimal(34)
      })
    ]);
    const service = new PurchasesService(purchasesRepository, inventoryService);

    const purchase = await service.receivePurchase("purchase-1", { receiveNotes: " recibido completo " }, auditContext);

    expect(purchase).toEqual(
      expect.objectContaining({
        id: "purchase-1",
        status: "received",
        receivedByUserId: "user-1",
        receiveNotes: "recibido completo"
      })
    );
    expect(inventoryRepository.batches).toEqual([
      expect.objectContaining({
        purchaseItemId: "purchase-item-1",
        productId: "product-1",
        originalQuantity: decimal(24),
        availableQuantity: decimal(24),
        baseUnitCost: decimal(1),
        status: "active"
      })
    ]);
    expect(inventoryRepository.movements).toEqual([
      expect.objectContaining({
        batchId: "batch-1",
        productId: "product-1",
        type: "purchase_received",
        quantityBase: decimal(24),
        unitCostBase: decimal(1),
        referenceType: "purchase",
        referenceId: "purchase-1",
        referenceItemId: "purchase-item-1",
        actorUserId: "user-1",
        reason: "Purchase received"
      })
    ]);
    expect(inventoryRepository.movements[0].productId).toBe(inventoryRepository.batches[0].productId);
    expect(purchasesRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "PURCHASE_RECEIVED",
        entityId: "purchase-1",
        context: auditContext,
        metadata: expect.objectContaining({
          status: "received",
          receivedByUserId: "user-1",
          receiveNotes: "recibido completo",
          itemCount: 2
        })
      })
    ]);
  });

  it("rejects invalid purchase receipt states and item inventory requirements without partial changes", async () => {
    const cases = [
      {
        code: "PURCHASE_NOT_DRAFT",
        statusCode: 409,
        purchase: makeReceiptPurchase({ status: "received" })
      },
      {
        code: "SUPPLIER_NOT_ACTIVE",
        repositoryOptions: { supplierStatus: "inactive" as const },
        purchase: makeReceiptPurchase()
      },
      {
        code: "AUTHENTICATED_USER_NOT_FOUND",
        repositoryOptions: { seedUser: false },
        purchase: makeReceiptPurchase()
      },
      {
        code: "PRODUCT_NOT_ACTIVE",
        product: makePurchaseProduct({ id: "product-1", status: "inactive" }),
        purchase: makeReceiptPurchase()
      },
      {
        code: "PURCHASE_BATCH_REQUIRED",
        purchase: makeReceiptPurchase({ items: [makeReceiptItem({ batchNumber: null })] })
      },
      {
        code: "PURCHASE_EXPIRATION_REQUIRED",
        purchase: makeReceiptPurchase({ items: [makeReceiptItem({ expirationDate: null })] })
      },
      {
        code: "PURCHASE_EXPIRATION_EXPIRED",
        purchase: makeReceiptPurchase({ items: [makeReceiptItem({ expirationDate: new Date("2020-01-01T00:00:00.000Z") })] })
      }
    ];

    for (const testCase of cases) {
      const purchasesRepository = createSeededRepository(testCase.repositoryOptions);
      const inventoryRepository = new FakeInventoryRepository();
      purchasesRepository.seedProducts([testCase.product ?? makePurchaseProduct({ id: "product-1" })]);
      purchasesRepository.seedPurchases([testCase.purchase]);
      const service = new PurchasesService(purchasesRepository, new InventoryService(inventoryRepository));

      const error = await captureHttpError(() => service.receivePurchase("purchase-1", {}, auditContext));

      expectHttpError(error, {
        code: testCase.code,
        statusCode: testCase.statusCode ?? 400
      });
      expect(await purchasesRepository.getPurchase("purchase-1")).toEqual(testCase.purchase);
      expect(inventoryRepository.batches).toHaveLength(0);
      expect(inventoryRepository.movements).toHaveLength(0);
      expect(purchasesRepository.auditLogs).toHaveLength(0);
    }
  });

  it("cancels draft purchases with a reason and audit log without inventory movements", async () => {
    const purchasesRepository = createSeededRepository();
    const inventoryService = new FakeInventoryService();
    purchasesRepository.seedPurchases([makePurchaseRecord({ id: "purchase-1", status: "draft", items: [makeReceiptItem()] })]);
    const service = new PurchasesService(purchasesRepository, inventoryService);

    const purchase = await service.cancelPurchase("purchase-1", { cancelReason: " proveedor sin stock " }, auditContext);

    expect(purchase).toEqual(
      expect.objectContaining({
        id: "purchase-1",
        status: "cancelled",
        cancelReason: "proveedor sin stock"
      })
    );
    expect(inventoryService.cancelPurchaseReceiptLayersCalls).toHaveLength(0);
    expect(purchasesRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "PURCHASE_CANCELLED",
        entityId: "purchase-1",
        metadata: expect.objectContaining({
          status: "cancelled",
          cancelReason: "proveedor sin stock"
        })
      })
    ]);
  });

  it("requires a cancel reason before changing purchase state", async () => {
    const purchasesRepository = createSeededRepository();
    purchasesRepository.seedPurchases([makePurchaseRecord({ id: "purchase-1", status: "draft" })]);
    const service = new PurchasesService(purchasesRepository, new FakeInventoryService());

    await expectPurchaseError(() => service.cancelPurchase("purchase-1", { cancelReason: "   " }, auditContext), "PURCHASE_CANCEL_REASON_REQUIRED");

    expect(await purchasesRepository.getPurchase("purchase-1")).toEqual(makePurchaseRecord({ id: "purchase-1", status: "draft" }));
    expect(purchasesRepository.auditLogs).toHaveLength(0);
  });

  it("cancels intact received purchases by reversing inventory layers and writing audit", async () => {
    const purchasesRepository = createSeededRepository();
    const inventoryRepository = new FakeInventoryRepository();
    const item = makeReceiptItem({ baseQuantity: decimal(5), baseUnitCost: decimal(2.25) });
    const purchase = makeReceiptPurchase({ status: "received", items: [item] });
    purchasesRepository.seedProducts([makePurchaseProduct({ id: "product-1" })]);
    purchasesRepository.seedPurchases([purchase]);
    inventoryRepository.batches.push(makeInventoryBatchRecord({ id: "batch-1", purchaseItemId: item.id, purchaseItem: item }));
    const service = new PurchasesService(purchasesRepository, new InventoryService(inventoryRepository));

    const cancelledPurchase = await service.cancelPurchase("purchase-1", { cancelReason: "devolucion al proveedor" }, auditContext);

    expect(cancelledPurchase).toEqual(
      expect.objectContaining({
        id: "purchase-1",
        status: "cancelled",
        cancelReason: "devolucion al proveedor"
      })
    );
    expect(inventoryRepository.movements).toEqual([
      expect.objectContaining({
        batchId: "batch-1",
        productId: "product-1",
        type: "purchase_cancelled",
        quantityBase: decimal(-5),
        unitCostBase: decimal(2.25),
        referenceType: "purchase",
        referenceId: "purchase-1",
        referenceItemId: "purchase-item-1",
        actorUserId: "user-1",
        reason: "Purchase cancelled"
      })
    ]);
    expect(inventoryRepository.movements[0].productId).toBe(inventoryRepository.batches[0].productId);
    expect(inventoryRepository.batches[0]).toEqual(
      expect.objectContaining({
        status: "cancelled",
        availableQuantity: decimal(0)
      })
    );
    expect(purchasesRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "PURCHASE_CANCELLED",
        entityId: "purchase-1",
        metadata: expect.objectContaining({
          status: "cancelled",
          cancelReason: "devolucion al proveedor"
        })
      })
    ]);
  });

  it("blocks cancellation of consumed received purchases without purchase, inventory, or audit changes", async () => {
    const purchasesRepository = createSeededRepository();
    const inventoryRepository = new FakeInventoryRepository();
    const item = makeReceiptItem({ baseQuantity: decimal(5), baseUnitCost: decimal(2.25) });
    const purchase = makeReceiptPurchase({ status: "received", items: [item] });
    purchasesRepository.seedProducts([makePurchaseProduct({ id: "product-1" })]);
    purchasesRepository.seedPurchases([purchase]);
    inventoryRepository.batches.push(
      makeInventoryBatchRecord({
        id: "batch-1",
        purchaseItemId: item.id,
        purchaseItem: item,
        availableQuantity: decimal(3)
      })
    );
    const service = new PurchasesService(purchasesRepository, new InventoryService(inventoryRepository));

    const error = await captureHttpError(() =>
      service.cancelPurchase("purchase-1", { cancelReason: "devolucion al proveedor" }, auditContext)
    );

    expectHttpError(error, {
      code: "PURCHASE_INVENTORY_LAYER_NOT_REVERSIBLE",
      statusCode: 409
    });
    expect(await purchasesRepository.getPurchase("purchase-1")).toEqual(purchase);
    expect(inventoryRepository.movements).toHaveLength(0);
    expect(inventoryRepository.batches[0]).toEqual(
      expect.objectContaining({
        status: "active",
        availableQuantity: decimal(3)
      })
    );
    expect(purchasesRepository.auditLogs).toHaveLength(0);
  });
});

function createSeededRepository(options: { seedUser?: boolean; supplierStatus?: "active" | "inactive" } = {}) {
  const purchasesRepository = new FakePurchasesRepository();
  purchasesRepository.seedSuppliers([makeSupplierRecord({ id: "supplier-1", status: options.supplierStatus ?? "active" })]);

  if (options.seedUser !== false) {
    purchasesRepository.seedUsers([makeUserRecord({ id: "user-1" })]);
  }

  return purchasesRepository;
}

function makePurchaseProduct(overrides: Parameters<typeof makeProductWithPurchaseRelations>[0] = {}) {
  return makeProductWithPurchaseRelations({
    id: "product-1",
    baseUnitId: "unit-each",
    supplierId: "supplier-1",
    units: [
      {
        id: "product-unit-each",
        productId: "product-1",
        unitId: "unit-each",
        conversionFactor: decimal(1),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        unit: {
          id: "unit-each",
          name: "Unidad",
          abbreviation: "u",
          description: null,
          status: "active",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z")
        }
      },
      {
        id: "product-unit-box",
        productId: "product-1",
        unitId: "unit-box",
        conversionFactor: decimal(12),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        unit: {
          id: "unit-box",
          name: "Caja",
          abbreviation: "cj",
          description: null,
          status: "active",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z")
        }
      }
    ],
    ...overrides
  });
}

function makeReceiptItem(overrides: Parameters<typeof makePurchaseItemRecord>[0] = {}) {
  const product = makePurchaseProduct({ id: overrides.productId ?? "product-1" });

  return makePurchaseItemRecord(
    {
      id: "purchase-item-1",
      purchaseId: "purchase-1",
      productId: product.id,
      product,
      unitId: "unit-box",
      unit: product.units[1].unit,
      quantity: decimal(1),
      unitCost: decimal(12),
      conversionFactor: decimal(12),
      baseQuantity: decimal(12),
      baseUnitCost: decimal(1),
      lineTotal: decimal(12),
      isInventoryTracked: true,
      batchNumber: "LOT-001",
      expirationDate: new Date("2027-01-01T00:00:00.000Z"),
      ...overrides
    },
    0,
    product
  );
}

function makeReceiptPurchase(overrides: Parameters<typeof makePurchaseRecord>[0] = {}) {
  return makePurchaseRecord({
    id: "purchase-1",
    status: "draft",
    supplierId: "supplier-1",
    items: [makeReceiptItem()],
    totalAmount: decimal(12),
    ...overrides
  });
}

async function expectPurchaseError(action: () => Promise<unknown>, code: string, statusCode = 400) {
  const error = await captureHttpError(action);

  expectHttpError(error, {
    code,
    statusCode
  });
}
