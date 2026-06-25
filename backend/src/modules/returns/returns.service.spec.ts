import { Prisma } from "@prisma/client";
import {
  CreateTotalSaleReturnSchema,
  SaleReturnSchema,
  SaleReturnsListResponseSchema
} from "@pharmacy-pos/shared";
import { describe, expect, it } from "vitest";
import { captureHttpError, expectHttpError } from "../../tests/utils/http-error.js";
import { canUseReturns } from "./returns.routes.js";
import { ReturnsService, type ReturnsRepositoryPort } from "./returns.service.js";
import type {
  ReturnableSaleListFilters,
  ReturnsAuditContext,
  ReturnsSaleReturnWithRelations,
  ReturnsSaleWithRelations,
  ReturnsTransactionClient,
  ReturnsUserRecord,
  SaleReturnListFilters
} from "./returns.types.js";

const testTransactionClient = {} as ReturnsTransactionClient;
const auditContext: ReturnsAuditContext = {
  actorUserId: "admin-1",
  ipAddress: "127.0.0.1",
  userAgent: "vitest"
};

describe("ReturnsService returnable sale eligibility", () => {
  it("lists return eligibility flags for cancelled, returned, open cash session, active invoice and unpaid sales", async () => {
    const returnsRepository = new FakeReturnsRepository();
    returnsRepository.seedSales([
      makeSale({ id: "eligible-sale", correlativeCode: "V-000001" }),
      makeSale({ id: "cancelled-sale", correlativeCode: "V-000002", status: "cancelled" }),
      makeSale({ id: "returned-sale", correlativeCode: "V-000003", status: "returned" }),
      makeSale({
        id: "returned-relation-sale",
        correlativeCode: "V-000004",
        saleReturn: { id: "sale-return-1" }
      }),
      makeSale({
        id: "open-cash-sale",
        correlativeCode: "V-000005",
        cashSession: makeCashSession({ status: "open", closedAt: null })
      }),
      makeSale({
        id: "active-invoice-sale",
        correlativeCode: "V-000006",
        preparedInvoices: [{ id: "prepared-invoice-1", status: "prepared" }]
      }),
      makeSale({
        id: "unpaid-sale",
        correlativeCode: "V-000007",
        payment: makePayment({ status: "cancelled" })
      }),
      makeSale({
        id: "cancelled-invoice-sale",
        correlativeCode: "V-000008",
        preparedInvoices: [{ id: "cancelled-prepared-invoice-1", status: "cancelled" }]
      })
    ]);
    const service = new ReturnsService(returnsRepository);

    const result = await service.listReturnableSales({ page: 1, pageSize: 20 }, auditContext);

    expect(result.data).toEqual([
      expect.objectContaining({ id: "eligible-sale", canReturn: true, returnBlockedReason: undefined }),
      expect.objectContaining({ id: "cancelled-sale", canReturn: false, returnBlockedReason: "sale-cancelled" }),
      expect.objectContaining({ id: "returned-sale", canReturn: false, returnBlockedReason: "already-returned" }),
      expect.objectContaining({ id: "returned-relation-sale", canReturn: false, returnBlockedReason: "already-returned" }),
      expect.objectContaining({ id: "open-cash-sale", canReturn: false, returnBlockedReason: "cash-session-open" }),
      expect.objectContaining({
        id: "active-invoice-sale",
        activePreparedInvoiceId: "prepared-invoice-1",
        canReturn: false,
        returnBlockedReason: "active-invoice-exists"
      }),
      expect.objectContaining({ id: "unpaid-sale", canReturn: false, returnBlockedReason: "payment-not-refundable" }),
      expect.objectContaining({
        id: "cancelled-invoice-sale",
        activePreparedInvoiceId: undefined,
        canReturn: true,
        returnBlockedReason: undefined
      })
    ]);
  });

  it("allows a confirmed paid sale from a closed cash session when previous prepared invoices are cancelled", async () => {
    const returnsRepository = new FakeReturnsRepository();
    returnsRepository.seedSales([
      makeSale({
        preparedInvoices: [{ id: "cancelled-prepared-invoice-1", status: "cancelled" }]
      })
    ]);
    const service = new ReturnsService(returnsRepository);

    const result = await service.listReturnableSales({ page: 1, pageSize: 10 }, auditContext);

    expect(result.data).toEqual([
      expect.objectContaining({
        id: "sale-1",
        canReturn: true,
        activePreparedInvoiceId: undefined,
        paymentStatus: "paid",
        returnBlockedReason: undefined,
        status: "confirmed"
      })
    ]);
  });

  it.each([
    { overrides: { status: "cancelled" as const }, reason: "sale-cancelled" },
    { overrides: { status: "returned" as const }, reason: "already-returned" },
    {
      overrides: { cashSession: makeCashSession({ status: "open", closedAt: null }) },
      reason: "cash-session-open"
    },
    {
      overrides: { preparedInvoices: [{ id: "prepared-invoice-1", status: "prepared" as const }] },
      reason: "active-invoice-exists"
    },
    {
      overrides: { payment: makePayment({ status: "reverted" }) },
      reason: "payment-not-refundable"
    }
  ])("blocks return creation with $reason", async ({ overrides, reason }) => {
    const returnsRepository = new FakeReturnsRepository();
    returnsRepository.seedSales([makeSale(overrides)]);
    const service = new ReturnsService(returnsRepository);

    const error = await captureHttpError(() =>
      service.createTotalSaleReturn({ saleId: "sale-1", reason: "Devolucion administrativa total" }, auditContext)
    );

    expectHttpError(error, {
      code: "SALE_NOT_RETURNABLE",
      statusCode: 409
    });
    expect(error?.details).toEqual(expect.objectContaining({ returnBlockedReason: reason }));
    expect(returnsRepository.saleReturns).toHaveLength(0);
  });

  it("blocks missing sales with sale-not-found metadata", async () => {
    const service = new ReturnsService(new FakeReturnsRepository());

    const error = await captureHttpError(() =>
      service.createTotalSaleReturn({ saleId: "missing-sale", reason: "Devolucion administrativa total" }, auditContext)
    );

    expectHttpError(error, {
      code: "SALE_NOT_FOUND",
      statusCode: 404
    });
    expect(error?.details).toEqual(expect.objectContaining({ returnBlockedReason: "sale-not-found" }));
  });

  it("creates a total return with refunded payment, lot restoration, movement snapshot and audit", async () => {
    const returnsRepository = new FakeReturnsRepository();
    returnsRepository.seedSales([makeSale()]);
    const service = new ReturnsService(returnsRepository);

    const saleReturn = await service.createTotalSaleReturn(
      { saleId: "sale-1", reason: "Devolucion administrativa total" },
      auditContext
    );

    const returnedSale = returnsRepository.getSeededSale("sale-1");

    expect(returnedSale.status).toBe("returned");
    expect(returnedSale.payment).toEqual(
      expect.objectContaining({
        refundAmount: decimal(20),
        status: "refunded"
      })
    );
    expect(returnedSale.cashSession.expectedAmount).toEqual(decimal(20));
    expect(returnsRepository.batchUpdates).toEqual([
      {
        id: "batch-1",
        availableQuantity: decimal(5)
      }
    ]);
    expect(returnsRepository.returnMovements).toEqual([
      expect.objectContaining({
        batchId: "batch-1",
        productId: "product-1",
        quantityBase: decimal(2),
        referenceId: "sale-return-1",
        referenceItemId: "consumption-1",
        unitCostBase: decimal(4)
      })
    ]);
    expect(saleReturn).toEqual(
      expect.objectContaining({
        id: "sale-return-1",
        paymentId: "payment-1",
        refundAmount: 20,
        saleId: "sale-1"
      })
    );
    expect(saleReturn.items).toEqual([
      expect.objectContaining({
        batchId: "batch-1",
        batchNumber: "LOT-001",
        inventoryMovementId: "return-movement-1",
        productId: "product-1",
        quantity: 2,
        refundSubtotal: 20,
        refundUnitPrice: 10,
        saleItemBatchId: "consumption-1",
        unitCostBase: 4
      })
    ]);
    expect(returnsRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "SALE_RETURNED",
        entityId: "sale-return-1",
        metadata: expect.objectContaining({
          cashSessionId: "cash-session-1",
          operationSource: "administrative-returns",
          operationType: "administrative-total-sale-return",
          originalPaymentStatus: "paid",
          originalSaleStatus: "confirmed",
          paymentId: "payment-1",
          paymentMethod: "cash",
          paymentStatus: "refunded",
          refundAmount: 20,
          restoredConsumptions: [
            expect.objectContaining({
              batchId: "batch-1",
              inventoryMovementId: "return-movement-1",
              quantity: 2,
              refundSubtotal: 20,
              saleItemBatchId: "consumption-1"
            })
          ],
          saleId: "sale-1",
          saleStatus: "returned"
        })
      })
    ]);

    const secondReturnError = await captureHttpError(() =>
      service.createTotalSaleReturn({ saleId: "sale-1", reason: "Segunda devolucion total" }, auditContext)
    );

    expectHttpError(secondReturnError, {
      code: "SALE_NOT_RETURNABLE",
      statusCode: 409
    });
    expect(returnsRepository.saleReturns).toHaveLength(1);
    expect(returnsRepository.batchUpdates).toHaveLength(1);
  });

  it.each([
    {
      failure: "movement" as const,
      expectedMessage: "Simulated inventory movement failure."
    },
    {
      failure: "return-item" as const,
      expectedMessage: "Simulated sale return item failure."
    }
  ])("rolls back sale, payment and inventory traceability when $failure creation fails", async ({ failure, expectedMessage }) => {
    const returnsRepository = new FakeReturnsRepository();
    returnsRepository.seedSales([makeSale()]);
    returnsRepository.failOn = failure;
    const service = new ReturnsService(returnsRepository);

    await expect(
      service.createTotalSaleReturn({ saleId: "sale-1", reason: "Devolucion administrativa total" }, auditContext)
    ).rejects.toThrow(expectedMessage);

    const sale = returnsRepository.getSeededSale("sale-1");

    expect(sale.status).toBe("confirmed");
    expect(sale.payment).toEqual(
      expect.objectContaining({
        refundAmount: null,
        status: "paid"
      })
    );
    expect(sale.items[0]?.consumptions[0]?.batch.availableQuantity).toEqual(decimal(3));
    expect(sale.saleReturn).toBeNull();
    expect(returnsRepository.saleReturns).toHaveLength(0);
    expect(returnsRepository.batchUpdates).toHaveLength(0);
    expect(returnsRepository.returnMovements).toHaveLength(0);
    expect(returnsRepository.auditLogs).toHaveLength(0);
  });

  it("validates invalid total return reasons with the shared schema", () => {
    const result = CreateTotalSaleReturnSchema.safeParse({ saleId: "sale-1", reason: "no" });

    expect(result.success).toBe(false);
  });

  it("returns sale return list and detail payloads that satisfy shared schemas", async () => {
    const returnsRepository = new FakeReturnsRepository();
    returnsRepository.seedSales([makeSale()]);
    const service = new ReturnsService(returnsRepository);

    const saleReturn = await service.createTotalSaleReturn(
      { saleId: "sale-1", reason: "Devolucion administrativa total" },
      auditContext
    );
    const list = await service.listSaleReturns({ page: 1, pageSize: 10 }, auditContext);
    const detail = await service.getSaleReturnById(saleReturn.id, auditContext);

    expect(() => SaleReturnsListResponseSchema.parse(list)).not.toThrow();
    expect(() => SaleReturnSchema.parse(detail)).not.toThrow();
    expect(list.data).toEqual([expect.objectContaining({ id: saleReturn.id, refundAmount: 20 })]);
    expect(detail.items).toHaveLength(1);
  });
});

describe("Returns routes permissions", () => {
  it.each(["admin", "superadmin"])("allows %s to operate return routes", (roleName) => {
    const request = makeRoleRequest(roleName);
    const next = createNextSpy();

    canUseReturns(request, {} as never, next);

    expect(next.calls).toEqual([undefined]);
  });

  it("blocks seller from return routes before controller execution", () => {
    const request = makeRoleRequest("seller");
    const next = createNextSpy();

    canUseReturns(request, {} as never, next);

    expect(next.calls).toHaveLength(1);
    expectHttpError(next.calls[0], {
      code: "FORBIDDEN",
      statusCode: 403
    });
  });
});

class FakeReturnsRepository implements ReturnsRepositoryPort {
  readonly auditLogs: Array<{
    action: string;
    entityId: string;
    metadata: unknown;
    context: ReturnsAuditContext;
  }> = [];
  readonly batchUpdates: Array<{
    id: string;
    availableQuantity: Prisma.Decimal;
  }> = [];
  readonly returnMovements: Array<Parameters<ReturnsRepositoryPort["createReturnInventoryMovement"]>[0]> = [];
  readonly saleReturns: ReturnsSaleReturnWithRelations[] = [];
  failOn?: "movement" | "return-item";
  private sales = new Map<string, ReturnsSaleWithRelations>();
  private users = new Map<string, ReturnsUserRecord>([
    [
      "admin-1",
      {
        id: "admin-1",
        fullName: "Administrador",
        email: "admin@example.com",
        status: "active"
      }
    ]
  ]);

  async runInTransaction<T>(callback: (client: ReturnsTransactionClient) => Promise<T>) {
    const salesSnapshot = new Map([...this.sales.entries()].map(([id, sale]) => [id, cloneSale(sale)]));
    const saleReturnsSnapshot = this.saleReturns.map(cloneSaleReturn);
    const auditLogsSnapshot = [...this.auditLogs];
    const batchUpdatesSnapshot = [...this.batchUpdates];
    const returnMovementsSnapshot = [...this.returnMovements];

    try {
      return await callback(testTransactionClient);
    } catch (error) {
      this.sales = salesSnapshot;
      this.saleReturns.splice(0, this.saleReturns.length, ...saleReturnsSnapshot);
      this.auditLogs.splice(0, this.auditLogs.length, ...auditLogsSnapshot);
      this.batchUpdates.splice(0, this.batchUpdates.length, ...batchUpdatesSnapshot);
      this.returnMovements.splice(0, this.returnMovements.length, ...returnMovementsSnapshot);
      throw error;
    }
  }

  async listReturnableSales(filters: ReturnableSaleListFilters) {
    const data = [...this.sales.values()].filter((sale) => {
      if (filters.sellerUserId && sale.sellerUserId !== filters.sellerUserId) {
        return false;
      }

      return true;
    });

    return {
      data,
      total: data.length
    };
  }

  async findSaleWithRelations(id: string) {
    const sale = this.sales.get(id);

    return sale ? cloneSale(sale) : null;
  }

  async listSaleReturns(_filters: SaleReturnListFilters) {
    return {
      data: this.saleReturns,
      total: this.saleReturns.length
    };
  }

  async findSaleReturnById(id: string) {
    const saleReturn = this.saleReturns.find((currentSaleReturn) => currentSaleReturn.id === id);

    return saleReturn ? cloneSaleReturn(saleReturn) : null;
  }

  async createSaleReturn(input: Parameters<ReturnsRepositoryPort["createSaleReturn"]>[0]) {
    const sale = requireRecord(this.sales, input.saleId, "sale");
    const actorUser = requireRecord(this.users, input.actorUserId, "user");
    const saleReturn: ReturnsSaleReturnWithRelations = {
      id: `sale-return-${this.saleReturns.length + 1}`,
      saleId: input.saleId,
      sale: {
        correlativeCode: sale.correlativeCode
      },
      paymentId: input.paymentId,
      payment: {
        id: input.paymentId,
        method: sale.payment?.method ?? "cash",
        status: sale.payment?.status ?? "refunded",
        refundAmount: input.refundAmount,
        reversedAt: input.returnedAt
      },
      actorUserId: input.actorUserId,
      actorUser,
      reason: input.reason,
      refundAmount: input.refundAmount,
      returnedAt: input.returnedAt,
      items: [],
      createdAt: input.returnedAt,
      updatedAt: input.returnedAt
    };

    sale.saleReturn = { id: saleReturn.id };
    this.saleReturns.push(saleReturn);

    return saleReturn;
  }

  async createSaleReturnItem(input: Parameters<ReturnsRepositoryPort["createSaleReturnItem"]>[0]) {
    if (this.failOn === "return-item") {
      throw new Error("Simulated sale return item failure.");
    }

    const saleReturn = requireRecord(
      new Map(this.saleReturns.map((currentSaleReturn) => [currentSaleReturn.id, currentSaleReturn])),
      input.saleReturnId,
      "sale return"
    );
    const sale = requireRecord(this.sales, saleReturn.saleId, "sale");
    const saleItem = sale.items.find((item) => item.id === input.saleItemId);

    if (!saleItem) {
      throw new Error(`sale item ${input.saleItemId} does not exist in fake repository.`);
    }

    saleReturn.items.push({
      id: `sale-return-item-${saleReturn.items.length + 1}`,
      ...input,
      batchNumber: input.batchNumber ?? null,
      expirationDate: input.expirationDate ?? null,
      inventoryMovementId: input.inventoryMovementId,
      saleItem: {
        id: saleItem.id,
        internalCode: saleItem.internalCode,
        commercialName: saleItem.commercialName,
        genericName: saleItem.genericName
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return { id: `sale-return-item-${saleReturn.items.length}` };
  }

  async markSaleReturned(id: string) {
    const sale = this.sales.get(id);

    if (!sale || sale.status !== "confirmed") {
      return 0;
    }

    sale.status = "returned";

    return 1;
  }

  async markPaymentRefunded(id: string, refundAmount: Prisma.Decimal, refundedAt: Date) {
    const sale = [...this.sales.values()].find((currentSale) => currentSale.payment?.id === id);

    if (!sale?.payment || sale.payment.status !== "paid") {
      return 0;
    }

    sale.payment.status = "refunded";
    sale.payment.refundAmount = refundAmount;
    sale.payment.reversedAt = refundedAt;

    return 1;
  }

  async updateBatchQuantity(id: string, availableQuantity: Prisma.Decimal) {
    this.batchUpdates.push({ id, availableQuantity });

    return { id };
  }

  async createReturnInventoryMovement(input: Parameters<ReturnsRepositoryPort["createReturnInventoryMovement"]>[0]) {
    if (this.failOn === "movement") {
      throw new Error("Simulated inventory movement failure.");
    }

    this.returnMovements.push(input);

    return { id: `return-movement-${this.returnMovements.length}` };
  }

  async findUserById(id: string) {
    return this.users.get(id) ?? null;
  }

  async createAuditLog(action: string, entityId: string, metadata: unknown, context: ReturnsAuditContext) {
    this.auditLogs.push({ action, entityId, metadata, context });

    return { id: `audit-${this.auditLogs.length}` };
  }

  seedSales(sales: ReturnsSaleWithRelations[]) {
    this.sales = new Map(sales.map((sale) => [sale.id, cloneSale(sale)]));
  }

  getSeededSale(id: string) {
    return requireRecord(this.sales, id, "sale");
  }
}

function makeSale(overrides: Partial<ReturnsSaleWithRelations> = {}): ReturnsSaleWithRelations {
  const now = new Date("2026-05-31T10:00:00.000Z");
  const saleId = overrides.id ?? "sale-1";

  return {
    id: saleId,
    correlativeNumber: 1,
    correlativeCode: "V-000001",
    sellerUserId: "seller-1",
    sellerUser: {
      id: "seller-1",
      fullName: "Vendedor Caja",
      email: "seller@example.com",
      status: "active"
    },
    cancelledByUserId: null,
    cashSessionId: "cash-session-1",
    cashSession: makeCashSession(),
    status: "confirmed",
    totalAmount: decimal(20),
    totalCost: decimal(8),
    totalMargin: decimal(12),
    confirmedAt: now,
    cancelledAt: null,
    cancelReason: null,
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
        quantity: 2,
        subtotal: decimal(20),
        totalCost: decimal(8),
        margin: decimal(12),
        consumptions: [
          {
            id: "consumption-1",
            saleItemId: "sale-item-1",
            batchId: "batch-1",
            quantity: decimal(2),
            unitCostBase: decimal(4),
            totalCost: decimal(8),
            inventoryMovementId: "movement-1",
            batch: {
              id: "batch-1",
              availableQuantity: decimal(3),
              batchNumber: "LOT-001",
              expirationDate: new Date("2027-01-01T00:00:00.000Z"),
              status: "active"
            }
          }
        ],
        createdAt: now,
        updatedAt: now
      }
    ],
    payment: makePayment({ saleId }),
    preparedInvoices: [],
    saleReturn: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function makeCashSession(
  overrides: Partial<ReturnsSaleWithRelations["cashSession"]> = {}
): ReturnsSaleWithRelations["cashSession"] {
  return {
    id: "cash-session-1",
    correlativeCode: "C-000001",
    openedByUserId: "seller-1",
    status: "closed",
    closedAt: new Date("2026-05-31T12:00:00.000Z"),
    expectedAmount: decimal(20),
    ...overrides
  };
}

function makePayment(
  overrides: Partial<NonNullable<ReturnsSaleWithRelations["payment"]>> = {}
): NonNullable<ReturnsSaleWithRelations["payment"]> {
  const now = new Date("2026-05-31T10:00:00.000Z");

  return {
    id: "payment-1",
    saleId: "sale-1",
    cashSessionId: "cash-session-1",
    method: "cash",
    saleTotal: decimal(20),
    receivedAmount: decimal(20),
    changeAmount: decimal(0),
    refundAmount: null,
    status: "paid",
    paidAt: now,
    reversedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function cloneSale(sale: ReturnsSaleWithRelations): ReturnsSaleWithRelations {
  return {
    ...sale,
    sellerUser: { ...sale.sellerUser },
    cashSession: {
      ...sale.cashSession,
      closedAt: sale.cashSession.closedAt ? new Date(sale.cashSession.closedAt) : null,
      expectedAmount: decimal(sale.cashSession.expectedAmount)
    },
    totalAmount: decimal(sale.totalAmount),
    totalCost: decimal(sale.totalCost),
    totalMargin: decimal(sale.totalMargin),
    confirmedAt: new Date(sale.confirmedAt),
    cancelledAt: sale.cancelledAt ? new Date(sale.cancelledAt) : null,
    payment: sale.payment ? clonePayment(sale.payment) : null,
    items: sale.items.map((item) => ({
      ...item,
      unitPrice: decimal(item.unitPrice),
      subtotal: decimal(item.subtotal),
      totalCost: decimal(item.totalCost),
      margin: decimal(item.margin),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      consumptions: item.consumptions.map((consumption) => ({
        ...consumption,
        quantity: decimal(consumption.quantity),
        unitCostBase: decimal(consumption.unitCostBase),
        totalCost: decimal(consumption.totalCost),
        batch: {
          ...consumption.batch,
          availableQuantity: decimal(consumption.batch.availableQuantity),
          expirationDate: consumption.batch.expirationDate ? new Date(consumption.batch.expirationDate) : null
        }
      }))
    })),
    preparedInvoices: sale.preparedInvoices.map((preparedInvoice) => ({ ...preparedInvoice })),
    saleReturn: sale.saleReturn ? { ...sale.saleReturn } : null,
    createdAt: new Date(sale.createdAt),
    updatedAt: new Date(sale.updatedAt)
  };
}

function clonePayment(payment: NonNullable<ReturnsSaleWithRelations["payment"]>) {
  return {
    ...payment,
    saleTotal: decimal(payment.saleTotal),
    receivedAmount: decimal(payment.receivedAmount),
    changeAmount: decimal(payment.changeAmount),
    refundAmount: payment.refundAmount ? decimal(payment.refundAmount) : null,
    paidAt: new Date(payment.paidAt),
    reversedAt: payment.reversedAt ? new Date(payment.reversedAt) : null,
    createdAt: new Date(payment.createdAt),
    updatedAt: new Date(payment.updatedAt)
  };
}

function cloneSaleReturn(saleReturn: ReturnsSaleReturnWithRelations): ReturnsSaleReturnWithRelations {
  return {
    ...saleReturn,
    actorUser: { ...saleReturn.actorUser },
    refundAmount: decimal(saleReturn.refundAmount),
    returnedAt: new Date(saleReturn.returnedAt),
    items: saleReturn.items.map((item) => ({
      ...item,
      quantity: decimal(item.quantity),
      unitCostBase: decimal(item.unitCostBase),
      refundUnitPrice: decimal(item.refundUnitPrice),
      refundSubtotal: decimal(item.refundSubtotal),
      saleItem: { ...item.saleItem },
      expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    })),
    createdAt: new Date(saleReturn.createdAt),
    updatedAt: new Date(saleReturn.updatedAt)
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
