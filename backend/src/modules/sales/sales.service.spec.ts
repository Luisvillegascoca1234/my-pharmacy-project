import { Prisma } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { captureHttpError, expectHttpError } from "../../tests/utils/http-error.js";
import { SalesService, type SalesRepositoryPort } from "./sales.service.js";
import type {
  AuditContext,
  CreateCashPaymentData,
  CreateConfirmedSaleData,
  CreateConfirmedSaleItemData,
  SaleActorRecord,
  SaleCashSessionRecord,
  SaleFefoBatchRecord,
  SaleInventoryConsumptionRecord,
  SaleInventoryMovementRecord,
  SaleProductRecord,
  SaleWithRelations,
  SalesTransactionClient
} from "./sales.types.js";

const testTransactionClient = {} as Prisma.TransactionClient;
const auditContext: AuditContext = {
  actorUserId: "seller-1",
  ipAddress: "127.0.0.1",
  userAgent: "vitest"
};

afterEach(() => {
  vi.useRealTimers();
});

describe("SalesService payment and FEFO rules", () => {
  it("rejects sale creation when the seller has no open cash session", async () => {
    const salesRepository = new FakeSalesRepository();
    salesRepository.seedUsers([makeActor()]);
    const service = new SalesService(salesRepository);

    const error = await captureHttpError(() =>
      service.createSale(
        {
          items: [{ productId: "product-1", quantity: 1 }],
          payment: { method: "cash", receivedAmount: 10 }
        },
        auditContext
      )
    );

    expectHttpError(error, {
      code: "SALE_CASH_SESSION_REQUIRED",
      statusCode: 409
    });
    expect(salesRepository.sales).toHaveLength(0);
    expect(salesRepository.payments).toHaveLength(0);
    expect(salesRepository.inventoryMovements).toHaveLength(0);
  });

  it("rejects sale creation when the seller cash session is closed", async () => {
    const salesRepository = new FakeSalesRepository();
    salesRepository.seedUsers([makeActor()]);
    salesRepository.seedCashSessions([
      makeCashSession({
        status: "closed",
        closedAt: new Date("2026-05-31T12:00:00.000Z")
      })
    ]);
    salesRepository.seedProducts([makeProduct({ salePrice: decimal(10) })]);
    salesRepository.seedBatches([makeBatch({ availableQuantity: 3 })]);
    const service = new SalesService(salesRepository);

    const error = await captureHttpError(() =>
      service.createSale(
        {
          items: [{ productId: "product-1", quantity: 1 }],
          payment: { method: "cash", receivedAmount: 10 }
        },
        auditContext
      )
    );

    expectHttpError(error, {
      code: "SALE_CASH_SESSION_REQUIRED",
      statusCode: 409
    });
    expect(salesRepository.sales).toHaveLength(0);
    expect(salesRepository.payments).toHaveLength(0);
    expect(salesRepository.inventoryMovements).toHaveLength(0);
    expect(salesRepository.batches[0].availableQuantity).toEqual(decimal(3));
  });

  it("rejects insufficient cash before creating sale, payment or inventory output", async () => {
    const salesRepository = makeRepositoryWithOpenSessionAndProduct({
      salePrice: 12.5,
      batches: [makeBatch({ availableQuantity: 5 })]
    });
    const service = new SalesService(salesRepository);

    const error = await captureHttpError(() =>
      service.createSale(
        {
          items: [{ productId: "product-1", quantity: 2 }],
          payment: { method: "cash", receivedAmount: 20 }
        },
        auditContext
      )
    );

    expectHttpError(error, {
      code: "SALE_PAYMENT_INSUFFICIENT",
      statusCode: 409
    });
    expect(salesRepository.sales).toHaveLength(0);
    expect(salesRepository.payments).toHaveLength(0);
    expect(salesRepository.inventoryMovements).toHaveLength(0);
    expect(salesRepository.batches[0].availableQuantity).toEqual(decimal(5));
  });

  it("creates a valid cash sale from one FEFO batch with payment, movement and margin", async () => {
    const salesRepository = makeRepositoryWithOpenSessionAndProduct({
      salePrice: 10,
      batches: [makeBatch({ id: "batch-1", availableQuantity: 5, baseUnitCost: 3.5 })]
    });
    const service = new SalesService(salesRepository);

    const sale = await service.createSale(
      {
        items: [{ productId: "product-1", quantity: 2 }],
        payment: { method: "cash", receivedAmount: 25 }
      },
      auditContext
    );

    expect(sale).toEqual(
      expect.objectContaining({
        correlativeCode: "V-000001",
        sellerUserId: "seller-1",
        cashSessionId: "cash-session-1",
        totalAmount: 20,
        totalCost: 7,
        totalMargin: 13
      })
    );
    expect(sale.payment).toEqual(
      expect.objectContaining({
        method: "cash",
        saleTotal: 20,
        receivedAmount: 25,
        changeAmount: 5,
        status: "paid"
      })
    );
    expect(sale.items[0]).toEqual(
      expect.objectContaining({
        productId: "product-1",
        quantity: 2,
        subtotal: 20,
        totalCost: 7,
        margin: 13
      })
    );
    expect(sale.items[0].consumptions).toEqual([
      expect.objectContaining({
        batchId: "batch-1",
        quantity: 2,
        unitCost: 3.5,
        totalCost: 7
      })
    ]);
    expect(salesRepository.batches[0].availableQuantity).toEqual(decimal(3));
    expect(salesRepository.inventoryMovements).toEqual([
      expect.objectContaining({
        batchId: "batch-1",
        productId: "product-1",
        quantityBase: decimal(-2),
        unitCostBase: decimal(3.5),
        referenceId: "sale-1",
        referenceItemId: "sale-item-1-1",
        actorUserId: "seller-1",
        reason: "Sale confirmed"
      })
    ]);
    expect(salesRepository.cashSessions[0].expectedAmount).toEqual(decimal(120));
    expect(salesRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "SALE_CONFIRMED",
        entityId: sale.id,
        context: auditContext,
        metadata: expect.objectContaining({
          totalAmount: 20,
          totalCost: 7,
          totalMargin: 13,
          receivedAmount: 25,
          changeAmount: 5
        })
      })
    ]);
  });

  it("splits a sale across several FEFO batches and uses each consumed layer cost", async () => {
    const salesRepository = makeRepositoryWithOpenSessionAndProduct({
      salePrice: 5,
      batches: [
        makeBatch({
          id: "batch-late",
          batchNumber: "LOT-LATE",
          availableQuantity: 10,
          baseUnitCost: 3,
          expirationDate: new Date("2027-02-01T00:00:00.000Z"),
          createdAt: new Date("2026-01-02T00:00:00.000Z")
        }),
        makeBatch({
          id: "batch-early",
          batchNumber: "LOT-EARLY",
          availableQuantity: 2,
          baseUnitCost: 1,
          expirationDate: new Date("2026-08-01T00:00:00.000Z"),
          createdAt: new Date("2026-01-01T00:00:00.000Z")
        })
      ]
    });
    const service = new SalesService(salesRepository);

    const sale = await service.createSale(
      {
        items: [{ productId: "product-1", quantity: 6 }],
        payment: { method: "cash", receivedAmount: 30 }
      },
      auditContext
    );

    expect(sale.totalAmount).toBe(30);
    expect(sale.totalCost).toBe(14);
    expect(sale.totalMargin).toBe(16);
    expect(sale.items[0].consumptions).toEqual([
      expect.objectContaining({
        batchId: "batch-early",
        batchNumber: "LOT-EARLY",
        quantity: 2,
        unitCost: 1,
        totalCost: 2
      }),
      expect.objectContaining({
        batchId: "batch-late",
        batchNumber: "LOT-LATE",
        quantity: 4,
        unitCost: 3,
        totalCost: 12
      })
    ]);
    expect(salesRepository.findBatch("batch-early")?.availableQuantity).toEqual(decimal(0));
    expect(salesRepository.findBatch("batch-late")?.availableQuantity).toEqual(decimal(6));
    expect(salesRepository.inventoryMovements).toEqual([
      expect.objectContaining({
        batchId: "batch-early",
        quantityBase: decimal(-2),
        referenceId: "sale-1",
        referenceItemId: "sale-item-1-1",
        actorUserId: "seller-1"
      }),
      expect.objectContaining({
        batchId: "batch-late",
        quantityBase: decimal(-4),
        referenceId: "sale-1",
        referenceItemId: "sale-item-1-1",
        actorUserId: "seller-1"
      })
    ]);
  });

  it("rolls back sale, payment, movements and partial stock discounts when stock is insufficient", async () => {
    const salesRepository = makeRepositoryWithOpenSessionAndProduct({
      salePrice: 10,
      batches: [makeBatch({ id: "batch-1", availableQuantity: 5, baseUnitCost: 4 })]
    });
    const service = new SalesService(salesRepository);

    const error = await captureHttpError(() =>
      service.createSale(
        {
          items: [{ productId: "product-1", quantity: 6 }],
          payment: { method: "cash", receivedAmount: 60 }
        },
        auditContext
      )
    );

    expectHttpError(error, {
      code: "SALE_STOCK_INSUFFICIENT",
      statusCode: 409
    });
    expect(salesRepository.sales).toHaveLength(0);
    expect(salesRepository.payments).toHaveLength(0);
    expect(salesRepository.inventoryMovements).toHaveLength(0);
    expect(salesRepository.saleItemBatches).toHaveLength(0);
    expect(salesRepository.batches).toEqual([
      expect.objectContaining({
        id: "batch-1",
        availableQuantity: decimal(5)
      })
    ]);
    expect(salesRepository.cashSessions[0].expectedAmount).toEqual(decimal(100));
  });
});

describe("SalesService sale detail access", () => {
  it.each([
    { actorUserId: "seller-1", actorRoleName: "seller" },
    { actorUserId: "admin-1", actorRoleName: "admin" },
    { actorUserId: "superadmin-1", actorRoleName: "superadmin" }
  ])("allows $actorRoleName users to read an authorized sale detail", async (context) => {
    const salesRepository = new FakeSalesRepository();
    salesRepository.seedSales([makeSale()]);
    const service = new SalesService(salesRepository);

    const sale = await service.getSale("sale-1", context);

    expect(sale).toEqual(
      expect.objectContaining({
        id: "sale-1",
        sellerUserId: "seller-1",
        payment: expect.objectContaining({
          method: "cash",
          status: "paid"
        })
      })
    );
  });

  it("blocks sellers from reading another seller's sale detail", async () => {
    const salesRepository = new FakeSalesRepository();
    salesRepository.seedSales([makeSale({ sellerUserId: "seller-2" })]);
    const service = new SalesService(salesRepository);

    const error = await captureHttpError(() =>
      service.getSale("sale-1", {
        actorUserId: "seller-1",
        actorRoleName: "seller"
      })
    );

    expectHttpError(error, {
      code: "SALE_ACCESS_FORBIDDEN",
      statusCode: 403
    });
  });
});

describe("SalesService sale list access", () => {
  it("lists only own sales for sellers even when another seller filter is sent", async () => {
    const salesRepository = new FakeSalesRepository();
    salesRepository.seedSales([
      makeSale({ id: "sale-1", sellerUserId: "seller-1" }),
      makeSale({ id: "sale-2", correlativeCode: "V-000002", sellerUserId: "seller-2" })
    ]);
    const service = new SalesService(salesRepository);

    const result = await service.listSales(
      { page: 1, pageSize: 20, sellerUserId: "seller-2" },
      { actorUserId: "seller-1", actorRoleName: "seller" }
    );

    expect(salesRepository.listSalesCalls).toEqual([
      expect.objectContaining({
        sellerUserId: "seller-1"
      })
    ]);
    expect(result.data).toEqual([
      expect.objectContaining({
        id: "sale-1",
        sellerUserId: "seller-1"
      })
    ]);
  });

  it.each(["admin", "superadmin"])("lists all sales with operational filters for %s users", async (roleName) => {
    const salesRepository = new FakeSalesRepository();
    salesRepository.seedSales([
      makeSale({ id: "sale-1", sellerUserId: "seller-1", cashSessionId: "cash-session-1" }),
      makeSale({ id: "sale-2", correlativeCode: "V-000002", sellerUserId: "seller-2", cashSessionId: "cash-session-2" })
    ]);
    const service = new SalesService(salesRepository);

    const result = await service.listSales(
      { page: 1, pageSize: 20, cashSessionId: "cash-session-2", sellerUserId: "seller-2", status: "confirmed" },
      { actorUserId: "admin-1", actorRoleName: roleName }
    );

    expect(salesRepository.listSalesCalls).toEqual([
      expect.objectContaining({
        cashSessionId: "cash-session-2",
        sellerUserId: "seller-2",
        status: "confirmed"
      })
    ]);
    expect(result.data).toEqual([
      expect.objectContaining({
        id: "sale-2",
        sellerUserId: "seller-2"
      })
    ]);
  });
});

describe("SalesService sale cancellation reversal", () => {
  it("rejects cancellation without a meaningful reason before mutating the sale", async () => {
    const salesRepository = new FakeSalesRepository();
    const service = new SalesService(salesRepository);

    const error = await captureHttpError(() =>
      service.cancelSale(
        "sale-1",
        { cancelReason: "  " },
        {
          actorUserId: "admin-1",
          actorRoleName: "admin"
        }
      )
    );

    expectHttpError(error, {
      code: "SALE_CANCEL_REASON_REQUIRED",
      statusCode: 400
    });
    expect(salesRepository.auditLogs).toHaveLength(0);
    expect(salesRepository.inventoryMovements).toHaveLength(0);
  });

  it("cancels an authorized confirmed sale and reverses stock, payment, cash expected and audit", async () => {
    const salesRepository = new FakeSalesRepository();
    const sale = makeSale();

    sale.items[0].consumptions = [
      {
        id: "consumption-1",
        saleItemId: "sale-item-1",
        batchId: "batch-1",
        quantity: decimal(2),
        unitCostBase: decimal(4),
        totalCost: decimal(8),
        inventoryMovementId: "movement-1",
        batch: {
          availableQuantity: decimal(3),
          batchNumber: "LOT-001",
          expirationDate: new Date("2027-01-01T00:00:00.000Z"),
          status: "active"
        }
      }
    ];
    sale.items[0].quantity = 2;
    sale.items[0].subtotal = decimal(20);
    sale.totalAmount = decimal(20);

    salesRepository.seedUsers([makeActor(), makeActor({ id: "admin-1", email: "admin@example.com" })]);
    salesRepository.seedCashSessions([makeCashSession({ expectedAmount: decimal(120) })]);
    salesRepository.seedBatches([makeBatch({ availableQuantity: 3 })]);
    salesRepository.seedSales([sale]);
    const service = new SalesService(salesRepository);

    const cancelledSale = await service.cancelSale(
      "sale-1",
      { cancelReason: "Error de registro en caja" },
      {
        actorUserId: "admin-1",
        actorRoleName: "admin",
        ipAddress: "127.0.0.1",
        userAgent: "vitest"
      }
    );

    expect(cancelledSale).toEqual(
      expect.objectContaining({
        id: "sale-1",
        status: "cancelled",
        cancelReason: "Error de registro en caja",
        cancelledByUserId: "admin-1",
        payment: expect.objectContaining({
          id: "payment-1",
          status: "reverted"
        })
      })
    );
    expect(salesRepository.findBatch("batch-1")?.availableQuantity).toEqual(decimal(5));
    expect(salesRepository.cashSessions[0].expectedAmount).toEqual(decimal(100));
    expect(salesRepository.inventoryMovements).toEqual([
      expect.objectContaining({
        batchId: "batch-1",
        productId: "product-1",
        quantityBase: decimal(2),
        referenceId: "sale-1",
        referenceItemId: "sale-item-1",
        actorUserId: "admin-1",
        reason: "Sale cancelled: Error de registro en caja"
      })
    ]);
    expect(salesRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "SALE_CANCELLED",
        entityId: "sale-1",
        metadata: expect.objectContaining({
          cancelReason: "Error de registro en caja",
          paymentStatus: "reverted",
          totalAmount: 20
        })
      })
    ]);
  });

  it("allows a seller to cancel only their own current-day sale", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T15:00:00.000Z"));
    const salesRepository = new FakeSalesRepository();
    const sale = makeSale();

    sale.items[0].consumptions = [
      {
        id: "consumption-1",
        saleItemId: "sale-item-1",
        batchId: "batch-1",
        quantity: decimal(1),
        unitCostBase: decimal(4),
        totalCost: decimal(4),
        inventoryMovementId: "movement-1",
        batch: {
          availableQuantity: decimal(9),
          batchNumber: "LOT-001",
          expirationDate: new Date("2027-01-01T00:00:00.000Z"),
          status: "active"
        }
      }
    ];
    salesRepository.seedUsers([makeActor()]);
    salesRepository.seedCashSessions([makeCashSession({ expectedAmount: decimal(110) })]);
    salesRepository.seedBatches([makeBatch({ availableQuantity: 9 })]);
    salesRepository.seedSales([sale]);
    const service = new SalesService(salesRepository);

    const cancelledSale = await service.cancelSale(
      "sale-1",
      { cancelReason: "Cliente solicita anulacion" },
      {
        actorUserId: "seller-1",
        actorRoleName: "seller"
      }
    );

    expect(cancelledSale).toEqual(
      expect.objectContaining({
        cancelledByUserId: "seller-1",
        status: "cancelled"
      })
    );
    expect(salesRepository.findBatch("batch-1")?.availableQuantity).toEqual(decimal(10));
    expect(salesRepository.cashSessions[0].expectedAmount).toEqual(decimal(100));
  });

  it("blocks sellers from cancelling another seller's sale", async () => {
    const salesRepository = new FakeSalesRepository();

    salesRepository.seedUsers([makeActor()]);
    salesRepository.seedSales([makeSale({ sellerUserId: "seller-2" })]);
    const service = new SalesService(salesRepository);

    const error = await captureHttpError(() =>
      service.cancelSale(
        "sale-1",
        { cancelReason: "Operacion ajena" },
        {
          actorUserId: "seller-1",
          actorRoleName: "seller"
        }
      )
    );

    expectHttpError(error, {
      code: "SALE_CANCEL_FORBIDDEN",
      statusCode: 403
    });
    expect(salesRepository.auditLogs).toHaveLength(0);
    expect(salesRepository.inventoryMovements).toHaveLength(0);
  });

  it("rejects cancellation when the source cash session is closed", async () => {
    const salesRepository = new FakeSalesRepository();

    salesRepository.seedUsers([makeActor({ id: "admin-1", email: "admin@example.com" })]);
    salesRepository.seedSales([
      makeSale({
        cashSession: {
          id: "cash-session-1",
          correlativeCode: "C-000001",
          openedByUserId: "seller-1",
          status: "closed",
          closedAt: new Date("2026-05-31T12:00:00.000Z"),
          expectedAmount: decimal(110)
        }
      })
    ]);
    const service = new SalesService(salesRepository);

    const error = await captureHttpError(() =>
      service.cancelSale(
        "sale-1",
        { cancelReason: "Caja ya cerrada" },
        {
          actorUserId: "admin-1",
          actorRoleName: "admin"
        }
      )
    );

    expectHttpError(error, {
      code: "SALE_CASH_SESSION_CLOSED",
      statusCode: 409
    });
    expect(salesRepository.auditLogs).toHaveLength(0);
    expect(salesRepository.inventoryMovements).toHaveLength(0);
  });

  it("allows superadmin cancellation supervision", async () => {
    const salesRepository = new FakeSalesRepository();
    const sale = makeSale();

    sale.items[0].consumptions = [
      {
        id: "consumption-1",
        saleItemId: "sale-item-1",
        batchId: "batch-1",
        quantity: decimal(1),
        unitCostBase: decimal(4),
        totalCost: decimal(4),
        inventoryMovementId: "movement-1",
        batch: {
          availableQuantity: decimal(9),
          batchNumber: "LOT-001",
          expirationDate: new Date("2027-01-01T00:00:00.000Z"),
          status: "active"
        }
      }
    ];
    salesRepository.seedUsers([makeActor({ id: "superadmin-1", email: "superadmin@example.com" })]);
    salesRepository.seedCashSessions([makeCashSession({ expectedAmount: decimal(110) })]);
    salesRepository.seedBatches([makeBatch({ availableQuantity: 9 })]);
    salesRepository.seedSales([sale]);
    const service = new SalesService(salesRepository);

    const cancelledSale = await service.cancelSale(
      "sale-1",
      { cancelReason: "Supervision administrativa" },
      {
        actorUserId: "superadmin-1",
        actorRoleName: "superadmin"
      }
    );

    expect(cancelledSale).toEqual(
      expect.objectContaining({
        cancelledByUserId: "superadmin-1",
        status: "cancelled"
      })
    );
    expect(salesRepository.findBatch("batch-1")?.availableQuantity).toEqual(decimal(10));
    expect(salesRepository.cashSessions[0].expectedAmount).toEqual(decimal(100));
  });

  it("rejects cancelling an already cancelled sale", async () => {
    const salesRepository = new FakeSalesRepository();

    salesRepository.seedUsers([makeActor()]);
    salesRepository.seedSales([
      makeSale({
        status: "cancelled",
        cancelledAt: new Date("2026-05-31T11:00:00.000Z"),
        cancelReason: "Venta duplicada",
        cancelledByUserId: "seller-1",
        cancelledByUser: makeActor()
      })
    ]);
    const service = new SalesService(salesRepository);

    const error = await captureHttpError(() =>
      service.cancelSale(
        "sale-1",
        { cancelReason: "Venta duplicada" },
        {
          actorUserId: "seller-1",
          actorRoleName: "seller"
        }
      )
    );

    expectHttpError(error, {
      code: "SALE_ALREADY_CANCELLED",
      statusCode: 409
    });
  });
});

class FakeSalesRepository implements SalesRepositoryPort {
  readonly auditLogs: Array<{
    action: string;
    context: AuditContext;
    entityId: string;
    metadata: unknown;
  }> = [];
  readonly inventoryMovements: Array<CreateSaleInventoryMovementData & SaleInventoryMovementRecord> = [];
  readonly payments: PaymentRecord[] = [];
  readonly saleItemBatches: SaleInventoryConsumptionRecord[] = [];
  readonly listSalesCalls: Parameters<SalesRepositoryPort["listSales"]>[0][] = [];

  nextSaleCorrelativeNumber = 1;

  private batchRecords = new Map<string, SaleFefoBatchRecord>();
  private cashSessionRecords = new Map<string, SaleCashSessionRecord>();
  private productRecords = new Map<string, SaleProductRecord>();
  private saleRecords = new Map<string, SaleWithRelations>();
  private userRecords = new Map<string, SaleActorRecord>();

  get batches() {
    return [...this.batchRecords.values()];
  }

  get cashSessions() {
    return [...this.cashSessionRecords.values()];
  }

  get sales() {
    return [...this.saleRecords.values()];
  }

  async runInTransaction<T>(callback: (client: SalesTransactionClient) => Promise<T>) {
    const snapshot = this.createSnapshot();

    try {
      return await callback(testTransactionClient);
    } catch (error) {
      this.restoreSnapshot(snapshot);
      throw error;
    }
  }

  async findUserById(id: string) {
    return this.userRecords.get(id) ?? null;
  }

  async listSales(filters: Parameters<SalesRepositoryPort["listSales"]>[0]) {
    this.listSalesCalls.push(filters);

    const data = [...this.saleRecords.values()].filter((sale) => {
      if (filters.cashSessionId && sale.cashSessionId !== filters.cashSessionId) {
        return false;
      }

      if (filters.sellerUserId && sale.sellerUserId !== filters.sellerUserId) {
        return false;
      }

      if (filters.status && sale.status !== filters.status) {
        return false;
      }

      return true;
    });

    return {
      data,
      total: data.length
    };
  }

  async findOpenCashSessionByUserId(userId: string) {
    return (
      [...this.cashSessionRecords.values()]
        .filter((cashSession) => cashSession.openedByUserId === userId && cashSession.status === "open" && !cashSession.closedAt)
        .sort((left, right) => right.id.localeCompare(left.id))[0] ?? null
    );
  }

  async findProductsByIds(productIds: string[]) {
    return productIds.flatMap((productId) => {
      const product = this.productRecords.get(productId);

      return product ? [product] : [];
    });
  }

  async getNextSaleCorrelativeNumber() {
    const correlativeNumber = this.nextSaleCorrelativeNumber;
    this.nextSaleCorrelativeNumber += 1;

    return correlativeNumber;
  }

  async createConfirmedSale(input: CreateConfirmedSaleData, items: CreateConfirmedSaleItemData[]) {
    const sellerUser = requireRecord(this.userRecords, input.sellerUserId, "user");
    const cashSession = requireRecord(this.cashSessionRecords, input.cashSessionId, "cash session");
    const saleId = `sale-${this.saleRecords.size + 1}`;
    const sale: SaleWithRelations = {
      id: saleId,
      correlativeNumber: input.correlativeNumber,
      correlativeCode: input.correlativeCode,
      sellerUserId: input.sellerUserId,
      sellerUser,
      cashSessionId: input.cashSessionId,
      cashSession: {
        id: cashSession.id,
        correlativeCode: cashSession.correlativeCode,
        openedByUserId: cashSession.openedByUserId,
        status: cashSession.status,
        closedAt: cashSession.closedAt,
        expectedAmount: cashSession.expectedAmount
      },
      cancelledAt: null,
      cancelledByUser: null,
      cancelledByUserId: null,
      cancelReason: null,
      status: "confirmed",
      items: items.map((item, index) => ({
        id: `sale-item-${this.saleRecords.size + 1}-${index + 1}`,
        saleId,
        productId: item.productId,
        internalCode: item.internalCode,
        barcode: item.barcode,
        commercialName: item.commercialName,
        genericName: item.genericName,
        baseUnitId: item.baseUnitId,
        baseUnitName: item.baseUnitName,
        baseUnitAbbreviation: item.baseUnitAbbreviation,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
        totalCost: item.totalCost,
        margin: item.margin,
        consumptions: [],
        createdAt: input.confirmedAt,
        updatedAt: input.confirmedAt
      })),
      payment: null,
      totalAmount: input.totalAmount,
      totalCost: input.totalCost,
      totalMargin: input.totalMargin,
      confirmedAt: input.confirmedAt,
      createdAt: input.confirmedAt,
      updatedAt: input.confirmedAt
    };

    this.saleRecords.set(sale.id, sale);

    return sale;
  }

  async updateSaleItemFinancials(
    id: string,
    input: {
      totalCost: Prisma.Decimal;
      margin: Prisma.Decimal;
    }
  ) {
    const saleItem = this.requireSaleItem(id);

    saleItem.totalCost = input.totalCost;
    saleItem.margin = input.margin;

    return { id };
  }

  async updateSaleTotals(
    id: string,
    input: {
      totalCost: Prisma.Decimal;
      totalMargin: Prisma.Decimal;
    }
  ) {
    const sale = requireRecord(this.saleRecords, id, "sale");

    sale.totalCost = input.totalCost;
    sale.totalMargin = input.totalMargin;

    return { id };
  }

  async createCashPayment(data: CreateCashPaymentData) {
    const now = data.paidAt;
    const payment: PaymentRecord = {
      id: `payment-${this.payments.length + 1}`,
      saleId: data.saleId,
      cashSessionId: data.cashSessionId,
      method: "cash",
      saleTotal: data.saleTotal,
      receivedAmount: data.receivedAmount,
      changeAmount: data.changeAmount,
      refundAmount: null,
      status: "paid",
      paidAt: data.paidAt,
      reversedAt: null,
      createdAt: now,
      updatedAt: now
    };
    const sale = requireRecord(this.saleRecords, data.saleId, "sale");

    sale.payment = payment;
    this.payments.push(payment);

    return { id: payment.id };
  }

  async incrementCashSessionExpectedAmount(id: string, amount: Prisma.Decimal) {
    const cashSession = requireRecord(this.cashSessionRecords, id, "cash session");

    cashSession.expectedAmount = cashSession.expectedAmount.add(amount);

    return { id };
  }

  async getSaleById(id: string) {
    return this.saleRecords.get(id) ?? null;
  }

  async markSaleCancelled(
    id: string,
    input: {
      cancelReason: string;
      cancelledAt: Date;
      cancelledByUserId: string;
    }
  ) {
    const sale = this.saleRecords.get(id);

    if (!sale || sale.status !== "confirmed") {
      return 0;
    }

    sale.status = "cancelled";
    sale.cancelReason = input.cancelReason;
    sale.cancelledAt = input.cancelledAt;
    sale.cancelledByUserId = input.cancelledByUserId;
    sale.cancelledByUser = this.userRecords.get(input.cancelledByUserId) ?? null;

    return 1;
  }

  async markPaymentReverted(id: string, reversedAt: Date) {
    const payment = this.payments.find((currentPayment) => currentPayment.id === id) ??
      [...this.saleRecords.values()].map((sale) => sale.payment).find((currentPayment) => currentPayment?.id === id);

    if (payment) {
      payment.status = "reverted";
      payment.reversedAt = reversedAt;
      payment.updatedAt = reversedAt;
    const sale = this.saleRecords.get(payment.saleId);

    if (sale?.payment?.id === payment.id) {
      sale.payment = payment;
    }
    }

    return { id };
  }

  async createAuditLog(action: string, entityId: string, metadata: unknown, context: AuditContext) {
    this.auditLogs.push({ action, entityId, metadata, context });

    return { id: `audit-${this.auditLogs.length}` };
  }

  async listSaleableBatchesByProductIds(productIds: string[], today: Date) {
    return [...this.batchRecords.values()]
      .filter((batch) => {
        const hasSaleableStock = batch.availableQuantity.greaterThan(0);
        const isNotExpired = !batch.expirationDate || batch.expirationDate >= today;

        return productIds.includes(batch.productId) && hasSaleableStock && isNotExpired;
      })
      .sort(compareFefoBatches);
  }

  async updateBatchQuantity(id: string, availableQuantity: Prisma.Decimal) {
    const batch = requireRecord(this.batchRecords, id, "batch");

    this.batchRecords.set(id, {
      ...batch,
      availableQuantity,
      status: availableQuantity.equals(0) ? "depleted" : "active"
    });

    return { id };
  }

  async createSaleInventoryMovement(
    data: CreateSaleInventoryMovementData
  ): Promise<SaleInventoryMovementRecord> {
    const movement = {
      ...data,
      id: `movement-${this.inventoryMovements.length + 1}`
    };

    this.inventoryMovements.push(movement);

    return { id: movement.id };
  }

  async createSaleCancellationInventoryMovement(
    data: CreateSaleInventoryMovementData
  ): Promise<SaleInventoryMovementRecord> {
    const movement = {
      ...data,
      id: `movement-${this.inventoryMovements.length + 1}`
    };

    this.inventoryMovements.push(movement);

    return { id: movement.id };
  }

  async createSaleItemBatch(data: CreateSaleItemBatchData) {
    const batch = requireRecord(this.batchRecords, data.batchId, "batch");
    const consumption: SaleInventoryConsumptionRecord = {
      id: `consumption-${this.saleItemBatches.length + 1}`,
      saleItemId: data.saleItemId,
      batchId: data.batchId,
      quantity: data.quantity,
      unitCostBase: data.unitCostBase,
      totalCost: data.totalCost,
      inventoryMovementId: data.inventoryMovementId,
      batch: {
        availableQuantity: batch.availableQuantity,
        batchNumber: batch.batchNumber,
        expirationDate: batch.expirationDate,
        status: batch.status
      }
    };
    const saleItem = this.requireSaleItem(data.saleItemId);

    saleItem.consumptions.push(consumption);
    this.saleItemBatches.push(consumption);

    return consumption;
  }

  findBatch(id: string) {
    return this.batchRecords.get(id);
  }

  seedBatches(batches: SaleFefoBatchRecord[]) {
    this.batchRecords = new Map(batches.map((batch) => [batch.id, cloneBatch(batch)]));
  }

  seedCashSessions(cashSessions: SaleCashSessionRecord[]) {
    this.cashSessionRecords = new Map(cashSessions.map((cashSession) => [cashSession.id, cloneCashSession(cashSession)]));
  }

  seedProducts(products: SaleProductRecord[]) {
    this.productRecords = new Map(products.map((product) => [product.id, cloneProduct(product)]));
  }

  seedSales(sales: SaleWithRelations[]) {
    this.saleRecords = new Map(sales.map((sale) => [sale.id, cloneSale(sale)]));
  }

  seedUsers(users: SaleActorRecord[]) {
    this.userRecords = new Map(users.map((user) => [user.id, { ...user }]));
  }

  private requireSaleItem(id: string) {
    for (const sale of this.saleRecords.values()) {
      const saleItem = sale.items.find((item) => item.id === id);

      if (saleItem) {
        return saleItem;
      }
    }

    throw new Error(`Sale item ${id} does not exist in fake repository.`);
  }

  private createSnapshot() {
    return {
      auditLogs: [...this.auditLogs],
      batchRecords: new Map([...this.batchRecords.entries()].map(([id, batch]) => [id, cloneBatch(batch)])),
      cashSessionRecords: new Map([...this.cashSessionRecords.entries()].map(([id, cashSession]) => [id, cloneCashSession(cashSession)])),
      inventoryMovements: this.inventoryMovements.map((movement) => ({ ...movement })),
      nextSaleCorrelativeNumber: this.nextSaleCorrelativeNumber,
      payments: this.payments.map((payment) => clonePayment(payment)),
      saleItemBatches: this.saleItemBatches.map((consumption) => cloneConsumption(consumption)),
      saleRecords: new Map([...this.saleRecords.entries()].map(([id, sale]) => [id, cloneSale(sale)]))
    };
  }

  private restoreSnapshot(snapshot: ReturnType<FakeSalesRepository["createSnapshot"]>) {
    this.auditLogs.splice(0, this.auditLogs.length, ...snapshot.auditLogs);
    this.batchRecords = snapshot.batchRecords;
    this.cashSessionRecords = snapshot.cashSessionRecords;
    this.inventoryMovements.splice(0, this.inventoryMovements.length, ...snapshot.inventoryMovements);
    this.nextSaleCorrelativeNumber = snapshot.nextSaleCorrelativeNumber;
    this.payments.splice(0, this.payments.length, ...snapshot.payments);
    this.saleItemBatches.splice(0, this.saleItemBatches.length, ...snapshot.saleItemBatches);
    this.saleRecords = snapshot.saleRecords;
  }
}

type CreateSaleInventoryMovementData = Parameters<SalesRepositoryPort["createSaleInventoryMovement"]>[0];
type CreateSaleItemBatchData = Parameters<SalesRepositoryPort["createSaleItemBatch"]>[0];
type PaymentRecord = NonNullable<SaleWithRelations["payment"]>;

function makeRepositoryWithOpenSessionAndProduct(input: {
  batches: SaleFefoBatchRecord[];
  salePrice: Prisma.Decimal.Value;
}) {
  const salesRepository = new FakeSalesRepository();

  salesRepository.seedUsers([makeActor()]);
  salesRepository.seedCashSessions([
    makeCashSession({
      expectedAmount: decimal(100)
    })
  ]);
  salesRepository.seedProducts([
    makeProduct({
      salePrice: decimal(input.salePrice)
    })
  ]);
  salesRepository.seedBatches(input.batches);

  return salesRepository;
}

function makeActor(overrides: Partial<SaleActorRecord> = {}): SaleActorRecord {
  return {
    id: "seller-1",
    fullName: "Vendedor Caja",
    email: "seller@example.com",
    status: "active",
    ...overrides
  };
}

function makeCashSession(overrides: Partial<SaleCashSessionRecord> = {}): SaleCashSessionRecord {
  return {
    id: "cash-session-1",
    correlativeCode: "C-000001",
    openedByUserId: "seller-1",
    status: "open",
    closedAt: null,
    expectedAmount: decimal(0),
    ...overrides
  };
}

function makeProduct(overrides: Partial<SaleProductRecord> = {}): SaleProductRecord {
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
    ...overrides
  };
}

function makeBatch(overrides: Omit<Partial<SaleFefoBatchRecord>, "availableQuantity" | "baseUnitCost"> & {
  availableQuantity?: Prisma.Decimal.Value;
  baseUnitCost?: Prisma.Decimal.Value;
} = {}): SaleFefoBatchRecord {
  const {
    availableQuantity = 10,
    baseUnitCost = 1,
    ...rest
  } = overrides;

  return {
    id: "batch-1",
    productId: "product-1",
    availableQuantity: decimal(availableQuantity),
    baseUnitCost: decimal(baseUnitCost),
    batchNumber: "LOT-001",
    expirationDate: new Date("2027-01-01T00:00:00.000Z"),
    status: "active",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...rest
  };
}

function makeSale(overrides: Partial<SaleWithRelations> = {}): SaleWithRelations {
  const now = new Date("2026-05-31T10:00:00.000Z");
  const sellerUserId = overrides.sellerUserId ?? "seller-1";
  const saleId = overrides.id ?? "sale-1";
  const sale: SaleWithRelations = {
    id: saleId,
    correlativeNumber: 1,
    correlativeCode: "V-000001",
    sellerUserId,
    sellerUser: makeActor({ id: sellerUserId }),
    cashSessionId: "cash-session-1",
    cashSession: {
      id: "cash-session-1",
      correlativeCode: "C-000001",
      openedByUserId: "seller-1",
      status: "open",
      closedAt: null,
      expectedAmount: decimal(100)
    },
    cancelledAt: null,
    cancelledByUser: null,
    cancelledByUserId: null,
    cancelReason: null,
    status: "confirmed",
    items: [
      {
        id: "sale-item-1",
        saleId,
        productId: "product-1",
        internalCode: "MED-001",
        barcode: "779000000001",
        commercialName: "Paracetamol 500 mg",
        genericName: "Paracetamol",
        baseUnitId: "unit-1",
        baseUnitName: "Unidad",
        baseUnitAbbreviation: "u",
        unitPrice: decimal(10),
        quantity: 1,
        subtotal: decimal(10),
        totalCost: decimal(4),
        margin: decimal(6),
        consumptions: [],
        createdAt: now,
        updatedAt: now
      }
    ],
    payment: {
      id: "payment-1",
      saleId,
      cashSessionId: "cash-session-1",
      method: "cash",
      saleTotal: decimal(10),
      receivedAmount: decimal(10),
      changeAmount: decimal(0),
      refundAmount: null,
      status: "paid",
      paidAt: now,
      reversedAt: null,
      createdAt: now,
      updatedAt: now
    },
    totalAmount: decimal(10),
    totalCost: decimal(4),
    totalMargin: decimal(6),
    confirmedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };

  return sale;
}

function cloneBatch(batch: SaleFefoBatchRecord): SaleFefoBatchRecord {
  return {
    ...batch,
    availableQuantity: decimal(batch.availableQuantity),
    baseUnitCost: decimal(batch.baseUnitCost),
    expirationDate: batch.expirationDate ? new Date(batch.expirationDate) : null,
    status: batch.status,
    createdAt: new Date(batch.createdAt)
  };
}

function cloneCashSession(cashSession: SaleCashSessionRecord): SaleCashSessionRecord {
  return {
    ...cashSession,
    expectedAmount: decimal(cashSession.expectedAmount),
    closedAt: cashSession.closedAt ? new Date(cashSession.closedAt) : null
  };
}

function cloneProduct(product: SaleProductRecord): SaleProductRecord {
  return {
    ...product,
    salePrice: decimal(product.salePrice),
    baseUnit: {
      ...product.baseUnit
    }
  };
}

function clonePayment(payment: PaymentRecord): PaymentRecord {
  return {
    ...payment,
    saleTotal: decimal(payment.saleTotal),
    receivedAmount: decimal(payment.receivedAmount),
    changeAmount: decimal(payment.changeAmount),
    paidAt: new Date(payment.paidAt),
    reversedAt: payment.reversedAt ? new Date(payment.reversedAt) : null,
    createdAt: new Date(payment.createdAt),
    updatedAt: new Date(payment.updatedAt)
  };
}

function cloneConsumption(consumption: SaleInventoryConsumptionRecord): SaleInventoryConsumptionRecord {
  return {
    ...consumption,
    quantity: decimal(consumption.quantity),
    unitCostBase: decimal(consumption.unitCostBase),
    totalCost: decimal(consumption.totalCost),
    batch: {
      ...consumption.batch,
      availableQuantity: decimal(consumption.batch.availableQuantity),
      expirationDate: consumption.batch.expirationDate ? new Date(consumption.batch.expirationDate) : null
    }
  };
}

function cloneSale(sale: SaleWithRelations): SaleWithRelations {
  return {
    ...sale,
    sellerUser: { ...sale.sellerUser },
    cancelledAt: sale.cancelledAt ? new Date(sale.cancelledAt) : null,
    cancelledByUser: sale.cancelledByUser ? { ...sale.cancelledByUser } : null,
    cashSession: {
      ...sale.cashSession,
      closedAt: sale.cashSession.closedAt ? new Date(sale.cashSession.closedAt) : null,
      expectedAmount: decimal(sale.cashSession.expectedAmount)
    },
    totalAmount: decimal(sale.totalAmount),
    totalCost: decimal(sale.totalCost),
    totalMargin: decimal(sale.totalMargin),
    confirmedAt: new Date(sale.confirmedAt),
    createdAt: new Date(sale.createdAt),
    updatedAt: new Date(sale.updatedAt),
    items: sale.items.map((item) => ({
      ...item,
      unitPrice: decimal(item.unitPrice),
      subtotal: decimal(item.subtotal),
      totalCost: decimal(item.totalCost),
      margin: decimal(item.margin),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      consumptions: item.consumptions.map(cloneConsumption)
    })),
    payment: sale.payment ? clonePayment(sale.payment) : null
  };
}

function compareFefoBatches(firstBatch: SaleFefoBatchRecord, secondBatch: SaleFefoBatchRecord) {
  const firstExpirationTime = firstBatch.expirationDate?.getTime() ?? Number.POSITIVE_INFINITY;
  const secondExpirationTime = secondBatch.expirationDate?.getTime() ?? Number.POSITIVE_INFINITY;

  if (firstExpirationTime !== secondExpirationTime) {
    return firstExpirationTime - secondExpirationTime;
  }

  const createdAtComparison = firstBatch.createdAt.getTime() - secondBatch.createdAt.getTime();

  if (createdAtComparison !== 0) {
    return createdAtComparison;
  }

  return firstBatch.id.localeCompare(secondBatch.id);
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
