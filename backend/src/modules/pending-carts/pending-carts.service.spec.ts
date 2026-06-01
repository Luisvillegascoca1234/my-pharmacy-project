import { Prisma } from "@prisma/client";
import type { Sale } from "@pharmacy-pos/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { captureHttpError, expectHttpError } from "../../tests/utils/http-error.js";
import type { SalesService } from "../sales/sales.service.js";
import { PendingCartsService } from "./pending-carts.service.js";
import type {
  PendingCartItemSnapshotData,
  PendingCartProductRecord,
  PendingCartRecord,
  PendingCartsTransactionClient,
  SavePendingCartData,
  UpdatePendingCartData
} from "./pending-carts.types.js";

const testTransactionClient = {} as PendingCartsTransactionClient;
const auditContext = {
  actorUserId: "seller-1",
  actorRoleName: "seller",
  ipAddress: "127.0.0.1",
  userAgent: "vitest"
};

afterEach(() => {
  vi.useRealTimers();
});

describe("PendingCartsService lifecycle and revalidation rules", () => {
  it("saves a pending cart snapshot without reserving stock or charging a sale", async () => {
    const repository = new FakePendingCartsRepository();
    const salesService = new FakeSalesService();

    repository.seedProducts([makeProduct({ salePrice: decimal(10), inventoryBatches: [makeBatch({ availableQuantity: 5 })] })]);
    const service = new PendingCartsService(asPendingCartsRepository(repository), salesService.asSalesService());

    const cart = await service.createPendingCart(
      {
        items: [{ productId: "product-1", quantity: 2 }],
        name: "Receta mostrador",
        note: "Retira en la tarde"
      },
      auditContext
    );

    expect(cart).toEqual(
      expect.objectContaining({
        currentTotalAmount: 20,
        name: "Receta mostrador",
        referenceTotalAmount: 20,
        status: "active"
      })
    );
    expect(cart.items[0]).toEqual(
      expect.objectContaining({
        currentUnitPrice: 10,
        referenceSubtotal: 20,
        referenceUnitPrice: 10,
        saleableStock: 5
      })
    );
    expect(repository.products[0].inventoryBatches[0].availableQuantity).toEqual(decimal(5));
    expect(salesService.createSaleCalls).toHaveLength(0);
    expect(repository.auditLogs).toEqual([
      expect.objectContaining({
        action: "PENDING_CART_CREATED",
        entityId: "pending-cart-1"
      })
    ]);
  });

  it("edits an active pending cart and refreshes the reference snapshot with current price", async () => {
    const repository = new FakePendingCartsRepository();
    repository.seedProducts([makeProduct({ salePrice: decimal(12), inventoryBatches: [makeBatch({ availableQuantity: 5 })] })]);
    repository.seedCarts([makeCart({ referenceTotalAmount: decimal(10) })]);
    const service = new PendingCartsService(asPendingCartsRepository(repository), new FakeSalesService().asSalesService());

    const cart = await service.updatePendingCart(
      "pending-cart-1",
      {
        items: [{ productId: "product-1", quantity: 2 }],
        name: "Receta actualizada"
      },
      auditContext
    );

    expect(cart).toEqual(
      expect.objectContaining({
        currentTotalAmount: 24,
        name: "Receta actualizada",
        referenceTotalAmount: 24
      })
    );
    expect(cart.items).toEqual([
      expect.objectContaining({
        quantity: 2,
        referenceSubtotal: 24,
        referenceUnitPrice: 12
      })
    ]);
    expect(repository.auditLogs).toEqual([
      expect.objectContaining({
        action: "PENDING_CART_UPDATED",
        entityId: "pending-cart-1"
      })
    ]);
  });

  it("discards active and expired carts only for the owner or an administrator", async () => {
    const sellerRepository = new FakePendingCartsRepository();
    sellerRepository.seedProducts([makeProduct()]);
    sellerRepository.seedCarts([makeCart({ ownerUserId: "seller-2" })]);
    const sellerService = new PendingCartsService(asPendingCartsRepository(sellerRepository), new FakeSalesService().asSalesService());

    const sellerError = await captureHttpError(() =>
      sellerService.discardPendingCart(
        "pending-cart-1",
        { discardReason: "No retirado" },
        {
          actorUserId: "seller-1",
          actorRoleName: "seller"
        }
      )
    );

    expectHttpError(sellerError, {
      code: "PENDING_CART_DISCARD_FORBIDDEN",
      statusCode: 403
    });
    expect(sellerRepository.auditLogs).toHaveLength(0);

    const adminRepository = new FakePendingCartsRepository();
    adminRepository.seedProducts([makeProduct()]);
    adminRepository.seedCarts([makeCart({ ownerUserId: "seller-2", status: "expired" })]);
    const adminService = new PendingCartsService(asPendingCartsRepository(adminRepository), new FakeSalesService().asSalesService());

    const discardedCart = await adminService.discardPendingCart(
      "pending-cart-1",
      { discardReason: "Caducado en supervision" },
      {
        actorUserId: "admin-1",
        actorRoleName: "admin"
      }
    );

    expect(discardedCart).toEqual(
      expect.objectContaining({
        discardReason: "Caducado en supervision",
        status: "discarded"
      })
    );
    expect(adminRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "PENDING_CART_DISCARDED",
        entityId: "pending-cart-1"
      })
    ]);
  });

  it("lists own carts for sellers and supervised carts for admin roles", async () => {
    const repository = new FakePendingCartsRepository();
    repository.seedProducts([makeProduct()]);
    repository.seedCarts([
      makeCart({ id: "pending-cart-1", ownerUserId: "seller-1" }),
      makeCart({ id: "pending-cart-2", ownerUserId: "seller-2" })
    ]);
    const service = new PendingCartsService(asPendingCartsRepository(repository), new FakeSalesService().asSalesService());

    const sellerResult = await service.listPendingCarts(
      { page: 1, pageSize: 20 },
      {
        actorUserId: "seller-1",
        actorRoleName: "seller"
      }
    );

    expect(repository.listCalls[0]).toEqual(
      expect.objectContaining({
        includeAll: false,
        ownerUserId: "seller-1"
      })
    );
    expect(sellerResult.data).toEqual([
      expect.objectContaining({
        id: "pending-cart-1",
        ownerUserId: "seller-1"
      })
    ]);

    const sellerForbiddenError = await captureHttpError(() =>
      service.listPendingCarts(
        { includeAll: true, page: 1, pageSize: 20 },
        {
          actorUserId: "seller-1",
          actorRoleName: "seller"
        }
      )
    );

    expectHttpError(sellerForbiddenError, {
      code: "PENDING_CART_ACCESS_FORBIDDEN",
      statusCode: 403
    });

    const adminResult = await service.listPendingCarts(
      { includeAll: true, page: 1, pageSize: 20, sellerUserId: "seller-2" },
      {
        actorUserId: "admin-1",
        actorRoleName: "superadmin"
      }
    );

    expect(repository.listCalls.at(-1)).toEqual(
      expect.objectContaining({
        includeAll: true,
        ownerUserId: "admin-1",
        sellerUserId: "seller-2"
      })
    );
    expect(adminResult.data).toEqual([
      expect.objectContaining({
        id: "pending-cart-2",
        ownerUserId: "seller-2"
      })
    ]);
  });

  it("expires active carts and blocks conversion of an expired cart before creating a sale", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));
    const repository = new FakePendingCartsRepository();
    const salesService = new FakeSalesService();

    repository.seedProducts([makeProduct()]);
    repository.seedCarts([makeCart({ expiresAt: new Date("2026-05-31T10:00:00.000Z") })]);
    const service = new PendingCartsService(asPendingCartsRepository(repository), salesService.asSalesService());

    const error = await captureHttpError(() =>
      service.convertPendingCart(
        "pending-cart-1",
        { payment: { method: "cash", receivedAmount: 20 } },
        auditContext
      )
    );

    expectHttpError(error, {
      code: "PENDING_CART_EXPIRED",
      statusCode: 409
    });
    expect(salesService.createSaleCalls).toHaveLength(0);
  });

  it("revalidates current price and stock instead of freezing the saved snapshot", async () => {
    const priceRepository = new FakePendingCartsRepository();
    const priceSalesService = new FakeSalesService();

    priceRepository.seedProducts([makeProduct({ salePrice: decimal(12), inventoryBatches: [makeBatch({ availableQuantity: 5 })] })]);
    priceRepository.seedCarts([makeCart({ referenceTotalAmount: decimal(10) })]);
    const priceService = new PendingCartsService(asPendingCartsRepository(priceRepository), priceSalesService.asSalesService());

    const priceError = await captureHttpError(() =>
      priceService.convertPendingCart(
        "pending-cart-1",
        { payment: { method: "cash", receivedAmount: 12 } },
        auditContext
      )
    );

    expectHttpError(priceError, {
      code: "PENDING_CART_ITEM_PRICE_CHANGED",
      statusCode: 409
    });
    expect(priceSalesService.createSaleCalls).toHaveLength(0);

    const stockRepository = new FakePendingCartsRepository();
    const stockSalesService = new FakeSalesService();

    stockRepository.seedProducts([makeProduct({ salePrice: decimal(10), inventoryBatches: [makeBatch({ availableQuantity: 1 })] })]);
    stockRepository.seedCarts([makeCart({ items: [makeCartItem({ quantity: 2, referenceSubtotal: decimal(20) })], referenceTotalAmount: decimal(20) })]);
    const stockService = new PendingCartsService(asPendingCartsRepository(stockRepository), stockSalesService.asSalesService());

    const stockError = await captureHttpError(() =>
      stockService.convertPendingCart(
        "pending-cart-1",
        { payment: { method: "cash", receivedAmount: 20 } },
        auditContext
      )
    );

    expectHttpError(stockError, {
      code: "PENDING_CART_STOCK_INSUFFICIENT",
      statusCode: 409
    });
    expect(stockSalesService.createSaleCalls).toHaveLength(0);
  });

  it("converts a valid pending cart by delegating to sale creation in the same transaction", async () => {
    const repository = new FakePendingCartsRepository();
    const salesService = new FakeSalesService();

    repository.seedProducts([makeProduct({ salePrice: decimal(10), inventoryBatches: [makeBatch({ availableQuantity: 5 })] })]);
    repository.seedCarts([makeCart()]);
    const service = new PendingCartsService(asPendingCartsRepository(repository), salesService.asSalesService());

    const convertedCart = await service.convertPendingCart(
      "pending-cart-1",
      { payment: { method: "cash", receivedAmount: 10 } },
      auditContext
    );

    expect(salesService.createSaleCalls).toEqual([
      {
        input: {
          items: [{ productId: "product-1", quantity: 1 }],
          payment: { method: "cash", receivedAmount: 10 }
        },
        context: auditContext,
        tx: testTransactionClient
      }
    ]);
    expect(convertedCart).toEqual(
      expect.objectContaining({
        convertedSaleId: "sale-1",
        status: "converted"
      })
    );
    expect(convertedCart.convertedSale).toEqual(
      expect.objectContaining({
        id: "sale-1",
        totalAmount: 10
      })
    );
    expect(repository.auditLogs).toEqual([
      expect.objectContaining({
        action: "PENDING_CART_CONVERTED",
        entityId: "pending-cart-1",
        metadata: expect.objectContaining({
          convertedSaleId: "sale-1"
        })
      })
    ]);
  });
});

function asPendingCartsRepository(repository: FakePendingCartsRepository): ConstructorParameters<typeof PendingCartsService>[0] {
  return repository as unknown as ConstructorParameters<typeof PendingCartsService>[0];
}

class FakePendingCartsRepository {
  readonly auditLogs: Array<{
    action: string;
    actorUserId: string | undefined;
    context: { ipAddress?: string; userAgent?: string };
    entityId: string;
    metadata: unknown;
  }> = [];
  readonly listCalls: Array<{
    includeAll?: boolean;
    ownerUserId: string;
    page: number;
    pageSize: number;
    search?: string;
    sellerUserId?: string;
    status?: PendingCartRecord["status"];
  }> = [];

  private cartRecords = new Map<string, PendingCartRecord>();
  private productRecords = new Map<string, PendingCartProductRecord>();

  get products() {
    return [...this.productRecords.values()].map(cloneProduct);
  }

  async runInTransaction<T>(callback: (client: PendingCartsTransactionClient) => Promise<T>) {
    const snapshot = this.createSnapshot();

    try {
      return await callback(testTransactionClient);
    } catch (error) {
      this.restoreSnapshot(snapshot);
      throw error;
    }
  }

  async expireActiveCarts(now: Date) {
    let count = 0;

    for (const cart of this.cartRecords.values()) {
      if (cart.status === "active" && cart.expiresAt.getTime() <= now.getTime()) {
        cart.status = "expired";
        cart.expiredAt = now;
        cart.updatedAt = now;
        count += 1;
      }
    }

    return { count };
  }

  async list(filters: Parameters<PendingCartsService["listPendingCarts"]>[0] & { ownerUserId: string; includeAll?: boolean }) {
    this.listCalls.push(filters);

    const data = [...this.cartRecords.values()].filter((cart) => {
      if (filters.includeAll) {
        return filters.sellerUserId ? cart.ownerUserId === filters.sellerUserId : true;
      }

      return cart.ownerUserId === filters.ownerUserId;
    });

    return {
      data: data.map(cloneCart),
      total: data.length
    };
  }

  async findById(id: string) {
    const cart = this.cartRecords.get(id);

    return cart ? cloneCart(cart) : null;
  }

  async findProductsByIds(productIds: string[], today: Date) {
    return productIds.flatMap((productId) => {
      const product = this.productRecords.get(productId);

      if (!product) {
        return [];
      }

      return [
        cloneProduct({
          ...product,
          inventoryBatches: product.inventoryBatches.filter((batch) => {
            const hasAvailableStock = batch.availableQuantity.gt(0);
            const isNotExpired = !batch.expirationDate || batch.expirationDate >= today;

            return hasAvailableStock && isNotExpired;
          })
        })
      ];
    });
  }

  async createCart(data: SavePendingCartData, items: PendingCartItemSnapshotData[]) {
    const now = new Date("2026-05-31T10:00:00.000Z");
    const id = `pending-cart-${this.cartRecords.size + 1}`;
    const cart = makeCart({
      id,
      createdAt: now,
      expiresAt: data.expiresAt,
      items: items.map((item, index) => makeCartItem({ ...item, id: `pending-cart-item-${index + 1}`, pendingCartId: id })),
      name: data.name ?? null,
      note: data.note ?? null,
      ownerUserId: data.ownerUserId,
      referenceTotalAmount: data.referenceTotalAmount,
      updatedAt: now
    });

    this.cartRecords.set(id, cloneCart(cart));

    return cloneCart(cart);
  }

  async replaceCartItems(id: string, data: UpdatePendingCartData, items: PendingCartItemSnapshotData[]) {
    const currentCart = requireRecord(this.cartRecords, id, "pending cart");
    const now = new Date("2026-05-31T10:05:00.000Z");
    const updatedCart = cloneCart({
      ...currentCart,
      items: items.map((item, index) => makeCartItem({ ...item, id: `pending-cart-item-updated-${index + 1}`, pendingCartId: id })),
      name: data.name ?? null,
      note: data.note ?? null,
      referenceTotalAmount: data.referenceTotalAmount,
      updatedAt: now
    });

    this.cartRecords.set(id, updatedCart);

    return cloneCart(updatedCart);
  }

  async markExpired(id: string, now: Date) {
    const currentCart = requireRecord(this.cartRecords, id, "pending cart");
    const updatedCart = cloneCart({
      ...currentCart,
      expiredAt: now,
      status: "expired",
      updatedAt: now
    });

    this.cartRecords.set(id, updatedCart);

    return cloneCart(updatedCart);
  }

  async discardCart(id: string, discardReason: string | undefined, discardedAt: Date) {
    const currentCart = requireRecord(this.cartRecords, id, "pending cart");
    const updatedCart = cloneCart({
      ...currentCart,
      discardReason: discardReason ?? null,
      discardedAt,
      status: "discarded",
      updatedAt: discardedAt
    });

    this.cartRecords.set(id, updatedCart);

    return cloneCart(updatedCart);
  }

  async convertCart(id: string, convertedSaleId: string, convertedAt: Date) {
    const currentCart = requireRecord(this.cartRecords, id, "pending cart");
    const updatedCart = cloneCart({
      ...currentCart,
      convertedAt,
      convertedSaleId,
      status: "converted",
      updatedAt: convertedAt
    });

    this.cartRecords.set(id, updatedCart);

    return cloneCart(updatedCart);
  }

  async createAuditLog(
    action: string,
    entityId: string,
    actorUserId: string | undefined,
    metadata: unknown,
    context: { ipAddress?: string; userAgent?: string }
  ) {
    this.auditLogs.push({ action, actorUserId, context, entityId, metadata });

    return { id: `audit-${this.auditLogs.length}` };
  }

  findCart(id: string) {
    const cart = this.cartRecords.get(id);

    return cart ? cloneCart(cart) : undefined;
  }

  seedCarts(carts: PendingCartRecord[]) {
    this.cartRecords = new Map(carts.map((cart) => [cart.id, cloneCart(cart)]));
  }

  seedProducts(products: PendingCartProductRecord[]) {
    this.productRecords = new Map(products.map((product) => [product.id, cloneProduct(product)]));
  }

  private createSnapshot() {
    return {
      auditLogs: this.auditLogs.map((auditLog) => ({ ...auditLog })),
      cartRecords: new Map([...this.cartRecords.entries()].map(([id, cart]) => [id, cloneCart(cart)])),
      productRecords: new Map([...this.productRecords.entries()].map(([id, product]) => [id, cloneProduct(product)]))
    };
  }

  private restoreSnapshot(snapshot: ReturnType<FakePendingCartsRepository["createSnapshot"]>) {
    this.auditLogs.splice(0, this.auditLogs.length, ...snapshot.auditLogs);
    this.cartRecords = snapshot.cartRecords;
    this.productRecords = snapshot.productRecords;
  }
}

class FakeSalesService {
  readonly createSaleCalls: Array<{
    context: unknown;
    input: unknown;
    tx: PendingCartsTransactionClient;
  }> = [];

  asSalesService() {
    return this as unknown as SalesService;
  }

  async createSaleInTransaction(input: unknown, context: unknown, tx: PendingCartsTransactionClient) {
    this.createSaleCalls.push({ context, input, tx });

    return makeSale();
  }
}

function makeProduct(overrides: Partial<PendingCartProductRecord> = {}): PendingCartProductRecord {
  return {
    id: "product-1",
    internalCode: "MED-001",
    barcode: "779000000001",
    commercialName: "Paracetamol 500 mg",
    genericName: "Paracetamol",
    baseUnitId: "unit-1",
    salePrice: decimal(10),
    status: "active",
    baseUnit: {
      id: "unit-1",
      name: "Unidad",
      abbreviation: "u"
    },
    inventoryBatches: [makeBatch()],
    ...overrides
  };
}

function makeBatch(overrides: {
  availableQuantity?: Prisma.Decimal.Value;
  createdAt?: Date;
  expirationDate?: Date | null;
} = {}) {
  return {
    availableQuantity: decimal(overrides.availableQuantity ?? 5),
    createdAt: overrides.createdAt ?? new Date("2026-01-01T00:00:00.000Z"),
    expirationDate: overrides.expirationDate ?? new Date("2027-01-01T00:00:00.000Z")
  };
}

function makeCart(overrides: Partial<PendingCartRecord> = {}): PendingCartRecord {
  const now = new Date("2026-05-31T10:00:00.000Z");
  const id = overrides.id ?? "pending-cart-1";
  const ownerUserId = overrides.ownerUserId ?? "seller-1";

  return {
    id,
    ownerUserId,
    ownerUser: {
      id: ownerUserId,
      fullName: ownerUserId === "seller-1" ? "Vendedor Caja" : "Vendedor Auxiliar",
      email: ownerUserId === "seller-1" ? "seller@example.com" : "seller2@example.com",
      status: "active"
    },
    status: "active",
    name: "Receta mostrador",
    note: null,
    referenceTotalAmount: decimal(10),
    expiresAt: new Date("2026-06-03T10:00:00.000Z"),
    expiredAt: null,
    discardedAt: null,
    discardReason: null,
    convertedAt: null,
    convertedSaleId: null,
    createdAt: now,
    updatedAt: now,
    items: [makeCartItem({ pendingCartId: id })],
    ...overrides
  };
}

function makeCartItem(
  overrides: Partial<PendingCartRecord["items"][number]> & Partial<PendingCartItemSnapshotData> = {}
): PendingCartRecord["items"][number] {
  const now = new Date("2026-05-31T10:00:00.000Z");

  return {
    id: overrides.id ?? "pending-cart-item-1",
    pendingCartId: overrides.pendingCartId ?? "pending-cart-1",
    productId: overrides.productId ?? "product-1",
    internalCode: overrides.internalCode ?? "MED-001",
    barcode: overrides.barcode ?? "779000000001",
    commercialName: overrides.commercialName ?? "Paracetamol 500 mg",
    genericName: overrides.genericName ?? "Paracetamol",
    baseUnitId: overrides.baseUnitId ?? "unit-1",
    baseUnitName: overrides.baseUnitName ?? "Unidad",
    baseUnitAbbreviation: overrides.baseUnitAbbreviation ?? "u",
    referenceUnitPrice: decimal(overrides.referenceUnitPrice ?? 10),
    quantity: overrides.quantity ?? 1,
    referenceSubtotal: decimal(overrides.referenceSubtotal ?? 10),
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now
  };
}

function makeSale(): Sale {
  const now = "2026-05-31T10:00:00.000Z";

  return {
    id: "sale-1",
    correlativeCode: "V-000001",
    sellerUserId: "seller-1",
    sellerUser: {
      id: "seller-1",
      fullName: "Vendedor Caja",
      email: "seller@example.com"
    },
    cashSessionId: "cash-session-1",
    cashSessionCorrelativeCode: "C-000001",
    status: "confirmed",
    items: [
      {
        id: "sale-item-1",
        saleId: "sale-1",
        productId: "product-1",
        internalCode: "MED-001",
        barcode: "779000000001",
        commercialName: "Paracetamol 500 mg",
        genericName: "Paracetamol",
        baseUnit: {
          id: "unit-1",
          name: "Unidad",
          abbreviation: "u"
        },
        unitPrice: 10,
        quantity: 1,
        subtotal: 10,
        totalCost: 4,
        margin: 6,
        consumptions: [
          {
            id: "consumption-1",
            saleItemId: "sale-item-1",
            batchId: "batch-1",
            batchNumber: "LOT-001",
            expirationDate: "2027-01-01",
            quantity: 1,
            unitCost: 4,
            totalCost: 4,
            inventoryMovementId: "movement-1"
          }
        ],
        createdAt: now,
        updatedAt: now
      }
    ],
    payment: {
      id: "payment-1",
      saleId: "sale-1",
      cashSessionId: "cash-session-1",
      method: "cash",
      saleTotal: 10,
      receivedAmount: 10,
      changeAmount: 0,
      status: "paid",
      paidAt: now,
      createdAt: now,
      updatedAt: now
    },
    totalAmount: 10,
    totalCost: 4,
    totalMargin: 6,
    receipt: {
      saleId: "sale-1",
      saleCorrelativeCode: "V-000001",
      cashSessionCorrelativeCode: "C-000001",
      sellerName: "Vendedor Caja",
      issuedAt: now,
      items: [
        {
          productName: "Paracetamol 500 mg",
          quantity: 1,
          unitPrice: 10,
          subtotal: 10
        }
      ],
      totalAmount: 10,
      receivedAmount: 10,
      changeAmount: 0
    },
    confirmedAt: now,
    createdAt: now,
    updatedAt: now
  };
}

function cloneCart(cart: PendingCartRecord): PendingCartRecord {
  return {
    ...cart,
    ownerUser: { ...cart.ownerUser },
    referenceTotalAmount: decimal(cart.referenceTotalAmount),
    expiresAt: new Date(cart.expiresAt),
    expiredAt: cart.expiredAt ? new Date(cart.expiredAt) : null,
    discardedAt: cart.discardedAt ? new Date(cart.discardedAt) : null,
    convertedAt: cart.convertedAt ? new Date(cart.convertedAt) : null,
    createdAt: new Date(cart.createdAt),
    updatedAt: new Date(cart.updatedAt),
    items: cart.items.map((item) => ({
      ...item,
      referenceUnitPrice: decimal(item.referenceUnitPrice),
      referenceSubtotal: decimal(item.referenceSubtotal),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }))
  };
}

function cloneProduct(product: PendingCartProductRecord): PendingCartProductRecord {
  return {
    ...product,
    salePrice: decimal(product.salePrice),
    baseUnit: { ...product.baseUnit },
    inventoryBatches: product.inventoryBatches.map((batch) => ({
      availableQuantity: decimal(batch.availableQuantity),
      createdAt: new Date(batch.createdAt),
      expirationDate: batch.expirationDate ? new Date(batch.expirationDate) : null
    }))
  };
}

function decimal(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value);
}

function requireRecord<TKey, TValue>(records: Map<TKey, TValue>, id: TKey, label: string) {
  const record = records.get(id);

  if (!record) {
    throw new Error(`${label} ${String(id)} does not exist in fake repository.`);
  }

  return record;
}
