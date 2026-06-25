import { Prisma } from "@prisma/client";
import { CancelPreparedInvoiceSchema } from "@pharmacy-pos/shared";
import { describe, expect, it } from "vitest";
import { captureHttpError, expectHttpError } from "../../tests/utils/http-error.js";
import { canUseBilling } from "./billing.routes.js";
import { BillingService, type BillingRepositoryPort } from "./billing.service.js";
import type {
  BillingAuditContext,
  BillingPreparedInvoiceWithRelations,
  BillingSaleWithRelations,
  BillingTransactionClient,
  BillingUserRecord,
  CancelPreparedInvoiceData,
  CreatePreparedInvoiceData,
  CreatePreparedInvoiceItemData
} from "./billing.types.js";

const testTransactionClient = {} as BillingTransactionClient;
const auditContext: BillingAuditContext = {
  actorUserId: "admin-1",
  ipAddress: "127.0.0.1",
  userAgent: "vitest"
};

describe("BillingService prepared invoice creation", () => {
  it("creates a prepared invoice from a confirmed sale snapshot and audits it", async () => {
    const billingRepository = new FakeBillingRepository();
    billingRepository.seedSales([makeSale()]);
    const service = new BillingService(billingRepository);

    const preparedInvoice = await service.prepareInvoiceFromSale(
      {
        saleId: "sale-1",
        customerNit: "123456",
        customerBusinessName: "Farmacia Cliente",
        fiscalNotes: "Factura administrativa"
      },
      auditContext
    );

    expect(preparedInvoice).toEqual(
      expect.objectContaining({
        correlativeCode: "INV-000001",
        saleId: "sale-1",
        saleCorrelativeCode: "V-000001",
        cashSessionId: "cash-session-1",
        cashSessionCode: "C-000001",
        sellerUserId: "seller-1",
        sellerName: "Vendedor Caja",
        sellerEmail: "seller@example.com",
        status: "prepared",
        customerNit: "123456",
        customerBusinessName: "Farmacia Cliente",
        fiscalNotes: "Factura administrativa",
        totalAmount: 20
      })
    );
    expect(preparedInvoice.items).toEqual([
      expect.objectContaining({
        saleItemId: "sale-item-1",
        productId: "product-1",
        internalCode: "MED-001",
        commercialName: "Paracetamol 500 mg",
        quantity: 2,
        subtotal: 20
      })
    ]);
    expect(billingRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "PREPARED_INVOICE_CREATED",
        entityId: preparedInvoice.id,
        context: auditContext,
        metadata: expect.objectContaining({
          correlativeCode: "INV-000001",
          saleId: "sale-1",
          totalAmount: 20,
          customerNit: "123456",
          customerBusinessName: "Farmacia Cliente",
          itemCount: 1
        })
      })
    ]);
    expect(billingRepository.nonBillingSnapshot()).toEqual(billingRepository.initialNonBillingSnapshot);
  });

  it("uses fiscal defaults when customer data is omitted", async () => {
    const billingRepository = new FakeBillingRepository();
    billingRepository.seedSales([makeSale()]);
    const service = new BillingService(billingRepository);

    const preparedInvoice = await service.prepareInvoiceFromSale(
      {
        saleId: "sale-1",
        customerNit: "0",
        customerBusinessName: "Consumidor final"
      },
      auditContext
    );

    expect(preparedInvoice).toEqual(
      expect.objectContaining({
        customerNit: "0",
        customerBusinessName: "Consumidor final",
        fiscalNotes: undefined
      })
    );
  });

  it("blocks missing sales with a clear domain error", async () => {
    const service = new BillingService(new FakeBillingRepository());

    const error = await captureHttpError(() =>
      service.prepareInvoiceFromSale(
        {
          saleId: "missing-sale",
          customerNit: "0",
          customerBusinessName: "Consumidor final"
        },
        auditContext
      )
    );

    expectHttpError(error, {
      code: "SALE_NOT_FOUND",
      statusCode: 404
    });
  });

  it.each([
    { status: "cancelled" as const, code: "SALE_NOT_INVOICEABLE", reason: "sale-cancelled" },
    { status: "returned" as const, code: "SALE_NOT_INVOICEABLE", reason: "sale-returned" }
  ])("blocks $status sales", async ({ status, code, reason }) => {
    const billingRepository = new FakeBillingRepository();
    billingRepository.seedSales([makeSale({ status })]);
    const service = new BillingService(billingRepository);

    const error = await captureHttpError(() =>
      service.prepareInvoiceFromSale(
        {
          saleId: "sale-1",
          customerNit: "0",
          customerBusinessName: "Consumidor final"
        },
        auditContext
      )
    );

    expectHttpError(error, {
      code,
      statusCode: 409
    });
    expect(error?.details).toEqual(expect.objectContaining({ invoiceBlockedReason: reason }));
    expect(billingRepository.preparedInvoices).toHaveLength(0);
  });

  it("blocks a sale with an active prepared invoice", async () => {
    const billingRepository = new FakeBillingRepository();
    billingRepository.seedSales([
      makeSale({
        preparedInvoices: [{ id: "prepared-invoice-1", status: "prepared" }]
      })
    ]);
    const service = new BillingService(billingRepository);

    const error = await captureHttpError(() =>
      service.prepareInvoiceFromSale(
        {
          saleId: "sale-1",
          customerNit: "0",
          customerBusinessName: "Consumidor final"
        },
        auditContext
      )
    );

    expectHttpError(error, {
      code: "PREPARED_INVOICE_ACTIVE_EXISTS",
      statusCode: 409
    });
    expect(error?.details).toEqual(expect.objectContaining({ invoiceBlockedReason: "active-invoice-exists" }));
    expect(billingRepository.preparedInvoices).toHaveLength(0);
  });

  it("allows a new prepared invoice when previous invoices are cancelled", async () => {
    const billingRepository = new FakeBillingRepository();
    billingRepository.seedSales([makeSale()]);
    billingRepository.seedPreparedInvoices([makePreparedInvoice({ status: "cancelled" })]);
    const service = new BillingService(billingRepository);

    const preparedInvoice = await service.prepareInvoiceFromSale(
      {
        saleId: "sale-1",
        customerNit: "0",
        customerBusinessName: "Consumidor final"
      },
      auditContext
    );

    expect(preparedInvoice).toEqual(
      expect.objectContaining({
        correlativeCode: "INV-000002",
        status: "prepared",
        saleId: "sale-1"
      })
    );
    expect(billingRepository.preparedInvoices).toHaveLength(2);
  });

  it("marks returned sales as not invoiceable even when the sale status was not updated yet", async () => {
    const billingRepository = new FakeBillingRepository();
    billingRepository.seedSales([makeSale({ saleReturn: { id: "sale-return-1" } })]);
    const service = new BillingService(billingRepository);

    const error = await captureHttpError(() =>
      service.prepareInvoiceFromSale(
        {
          saleId: "sale-1",
          customerNit: "0",
          customerBusinessName: "Consumidor final"
        },
        auditContext
      )
    );

    expectHttpError(error, {
      code: "SALE_NOT_INVOICEABLE",
      statusCode: 409
    });
    expect(error?.details).toEqual(expect.objectContaining({ invoiceBlockedReason: "sale-returned" }));
    expect(billingRepository.preparedInvoices).toHaveLength(0);
    expect(billingRepository.auditLogs).toHaveLength(0);
    expect(billingRepository.nonBillingSnapshot()).toEqual(billingRepository.initialNonBillingSnapshot);
  });
});

describe("BillingService prepared invoice listing and detail", () => {
  it("lists eligibility flags for eligible, cancelled, returned and active-invoice sales", async () => {
    const billingRepository = new FakeBillingRepository();
    billingRepository.seedSales([
      makeSale({ id: "eligible-sale", correlativeCode: "V-000001" }),
      makeSale({ id: "cancelled-sale", correlativeCode: "V-000002", status: "cancelled" }),
      makeSale({ id: "returned-sale", correlativeCode: "V-000003", status: "returned" }),
      makeSale({
        id: "active-invoice-sale",
        correlativeCode: "V-000004",
        preparedInvoices: [{ id: "prepared-invoice-1", status: "prepared" }]
      })
    ]);
    const service = new BillingService(billingRepository);

    const result = await service.listInvoiceableSales({ page: 1, pageSize: 10 }, auditContext);

    expect(result.data).toEqual([
      expect.objectContaining({ id: "eligible-sale", canPrepareInvoice: true, invoiceBlockedReason: undefined }),
      expect.objectContaining({ id: "cancelled-sale", canPrepareInvoice: false, invoiceBlockedReason: "sale-cancelled" }),
      expect.objectContaining({ id: "returned-sale", canPrepareInvoice: false, invoiceBlockedReason: "sale-returned" }),
      expect.objectContaining({
        id: "active-invoice-sale",
        canPrepareInvoice: false,
        activePreparedInvoiceId: "prepared-invoice-1",
        invoiceBlockedReason: "active-invoice-exists"
      })
    ]);
  });

  it("returns prepared invoice history with cancelled invoices and detail", async () => {
    const billingRepository = new FakeBillingRepository();
    billingRepository.seedPreparedInvoices([
      makePreparedInvoice({ id: "prepared-invoice-1", status: "cancelled", cancelReason: "Error de datos" }),
      makePreparedInvoice({ id: "prepared-invoice-2", correlativeNumber: 2, correlativeCode: "INV-000002" })
    ]);
    const service = new BillingService(billingRepository);

    const list = await service.listPreparedInvoices({ page: 1, pageSize: 10 }, auditContext);
    const detail = await service.getPreparedInvoiceById("prepared-invoice-1", auditContext);

    expect(list.data).toEqual([
      expect.objectContaining({ id: "prepared-invoice-1", status: "cancelled", cancelReason: "Error de datos" }),
      expect.objectContaining({ id: "prepared-invoice-2", status: "prepared" })
    ]);
    expect(detail).toEqual(expect.objectContaining({ id: "prepared-invoice-1", status: "cancelled" }));
  });
});

describe("BillingService prepared invoice cancellation", () => {
  it("rejects invalid cancellation reasons through the HTTP contract schema", () => {
    expect(() => CancelPreparedInvoiceSchema.parse({ cancelReason: " abc " })).toThrow();
    expect(CancelPreparedInvoiceSchema.parse({ cancelReason: " Motivo valido " })).toEqual({
      cancelReason: "Motivo valido"
    });
  });

  it("cancels a prepared invoice with trimmed reason and audit metadata without touching sale, payment, cash or inventory", async () => {
    const billingRepository = new FakeBillingRepository();
    billingRepository.seedSales([makeSale()]);
    billingRepository.seedPreparedInvoices([makePreparedInvoice()]);
    const service = new BillingService(billingRepository);

    const cancelledInvoice = await service.cancelPreparedInvoice(
      "prepared-invoice-1",
      { cancelReason: "  Cliente solicito cambio de datos fiscales  " },
      auditContext
    );

    expect(cancelledInvoice).toEqual(
      expect.objectContaining({
        id: "prepared-invoice-1",
        status: "cancelled",
        cancelReason: "Cliente solicito cambio de datos fiscales",
        cancelledByUserId: "admin-1"
      })
    );
    expect(billingRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "PREPARED_INVOICE_CANCELLED",
        entityId: "prepared-invoice-1",
        context: auditContext,
        metadata: expect.objectContaining({
          correlativeCode: "INV-000001",
          saleId: "sale-1",
          actorUserId: "admin-1",
          cancelReason: "Cliente solicito cambio de datos fiscales",
          before: expect.objectContaining({ status: "prepared", cancelledAt: undefined }),
          after: expect.objectContaining({
            status: "cancelled",
            cancelledByUserId: "admin-1",
            cancelReason: "Cliente solicito cambio de datos fiscales"
          })
        })
      })
    ]);
    expect(billingRepository.markCancelledCalls).toHaveLength(1);
    expect(billingRepository.nonBillingSnapshot()).toEqual(billingRepository.initialNonBillingSnapshot);
  });

  it("blocks duplicate cancellation without writing audit", async () => {
    const billingRepository = new FakeBillingRepository();
    billingRepository.seedPreparedInvoices([
      makePreparedInvoice({
        status: "cancelled",
        cancelledAt: new Date("2026-05-31T12:00:00.000Z"),
        cancelledByUserId: "admin-1",
        cancelReason: "Datos incorrectos"
      })
    ]);
    const service = new BillingService(billingRepository);

    const error = await captureHttpError(() =>
      service.cancelPreparedInvoice("prepared-invoice-1", { cancelReason: "Nueva cancelacion" }, auditContext)
    );

    expectHttpError(error, {
      code: "PREPARED_INVOICE_ALREADY_CANCELLED",
      statusCode: 409
    });
    expect(billingRepository.markCancelledCalls).toHaveLength(0);
    expect(billingRepository.auditLogs).toHaveLength(0);
  });

  it("blocks missing prepared invoices", async () => {
    const service = new BillingService(new FakeBillingRepository());

    const error = await captureHttpError(() =>
      service.cancelPreparedInvoice("missing-invoice", { cancelReason: "No corresponde" }, auditContext)
    );

    expectHttpError(error, {
      code: "PREPARED_INVOICE_NOT_FOUND",
      statusCode: 404
    });
  });
});

describe("Billing routes permissions", () => {
  it.each(["admin", "superadmin"])("allows %s to operate prepared billing routes", (roleName) => {
    const request = makeRoleRequest(roleName);
    const next = createNextSpy();

    canUseBilling(request, {} as never, next);

    expect(next.calls).toEqual([undefined]);
  });

  it("blocks seller from prepared billing routes before controller execution", () => {
    const request = makeRoleRequest("seller");
    const next = createNextSpy();

    canUseBilling(request, {} as never, next);

    expect(next.calls).toHaveLength(1);
    expectHttpError(next.calls[0], {
      code: "FORBIDDEN",
      statusCode: 403
    });
  });
});

class FakeBillingRepository implements BillingRepositoryPort {
  readonly auditLogs: Array<{
    action: string;
    entityId: string;
    metadata: unknown;
    context: BillingAuditContext;
  }> = [];
  readonly preparedInvoices: BillingPreparedInvoiceWithRelations[] = [];
  readonly markCancelledCalls: Array<{ id: string; input: CancelPreparedInvoiceData }> = [];
  initialNonBillingSnapshot: unknown;
  private sales = new Map<string, BillingSaleWithRelations>();
  private users = new Map<string, BillingUserRecord>([
    [
      "admin-1",
      {
        id: "admin-1",
        fullName: "Administrador",
        email: "admin@example.com",
        status: "active",
        role: { name: "admin" }
      }
    ]
  ]);

  constructor() {
    this.initialNonBillingSnapshot = this.nonBillingSnapshot();
  }

  async runInTransaction<T>(callback: (client: BillingTransactionClient) => Promise<T>) {
    return callback(testTransactionClient);
  }

  async listInvoiceableSales() {
    return {
      data: [...this.sales.values()],
      total: this.sales.size
    };
  }

  async listPreparedInvoices() {
    return {
      data: this.preparedInvoices,
      total: this.preparedInvoices.length
    };
  }

  async findSaleWithRelations(id: string) {
    const sale = this.sales.get(id);

    return sale ? cloneSale(sale) : null;
  }

  async findPreparedInvoiceById(id: string) {
    const preparedInvoice = this.preparedInvoices.find((currentPreparedInvoice) => currentPreparedInvoice.id === id);

    return preparedInvoice ? clonePreparedInvoice(preparedInvoice) : null;
  }

  async markPreparedInvoiceCancelled(id: string, input: CancelPreparedInvoiceData) {
    this.markCancelledCalls.push({ id, input: { ...input } });
    const preparedInvoice = this.preparedInvoices.find(
      (currentPreparedInvoice) => currentPreparedInvoice.id === id && currentPreparedInvoice.status === "prepared"
    );

    if (!preparedInvoice) {
      return 0;
    }

    const cancelledByUser = this.users.get(input.cancelledByUserId);
    preparedInvoice.status = "cancelled";
    preparedInvoice.cancelledAt = input.cancelledAt;
    preparedInvoice.cancelledByUserId = input.cancelledByUserId;
    preparedInvoice.cancelledByUser = cancelledByUser
      ? {
          id: cancelledByUser.id,
          fullName: cancelledByUser.fullName,
          email: cancelledByUser.email,
          status: cancelledByUser.status
        }
      : null;
    preparedInvoice.cancelReason = input.cancelReason;
    preparedInvoice.updatedAt = input.cancelledAt;

    return 1;
  }

  async getNextPreparedInvoiceCorrelativeNumber() {
    const lastCorrelativeNumber = this.preparedInvoices.reduce(
      (maxCorrelativeNumber, preparedInvoice) => Math.max(maxCorrelativeNumber, preparedInvoice.correlativeNumber),
      0
    );

    return lastCorrelativeNumber + 1;
  }

  async createPreparedInvoice(input: CreatePreparedInvoiceData, items: CreatePreparedInvoiceItemData[]) {
    const sale = requireRecord(this.sales, input.saleId, "sale");
    const now = input.preparedAt;
    const preparedInvoice: BillingPreparedInvoiceWithRelations = {
      id: `prepared-invoice-${this.preparedInvoices.length + 1}`,
      correlativeNumber: input.correlativeNumber,
      correlativeCode: input.correlativeCode,
      saleId: input.saleId,
      sellerUserId: input.sellerUserId,
      sellerUser: sale.sellerUser,
      status: "prepared",
      saleCorrelativeCode: input.saleCorrelativeCode,
      cashSessionId: input.cashSessionId,
      cashSessionCode: input.cashSessionCode,
      sellerName: input.sellerName,
      sellerEmail: input.sellerEmail,
      customerNit: input.customerNit,
      customerBusinessName: input.customerBusinessName,
      fiscalNotes: input.fiscalNotes ?? null,
      totalAmount: input.totalAmount,
      preparedAt: input.preparedAt,
      cancelledAt: null,
      cancelledByUserId: null,
      cancelledByUser: null,
      cancelReason: null,
      items: items.map((item, index) => ({
        id: `prepared-invoice-item-${this.preparedInvoices.length + 1}-${index + 1}`,
        preparedInvoiceId: `prepared-invoice-${this.preparedInvoices.length + 1}`,
        saleItemId: item.saleItemId,
        productId: item.productId,
        internalCode: item.internalCode,
        barcode: item.barcode ?? null,
        commercialName: item.commercialName,
        genericName: item.genericName ?? null,
        baseUnitId: item.baseUnitId,
        baseUnitName: item.baseUnitName,
        baseUnitAbbreviation: item.baseUnitAbbreviation,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
        createdAt: now,
        updatedAt: now
      })),
      createdAt: now,
      updatedAt: now
    };

    this.preparedInvoices.push(preparedInvoice);

    return preparedInvoice;
  }

  async findUserById(id: string) {
    return this.users.get(id) ?? null;
  }

  async createAuditLog(action: string, entityId: string, metadata: unknown, context: BillingAuditContext) {
    this.auditLogs.push({ action, entityId, metadata, context });

    return { id: `audit-${this.auditLogs.length}` };
  }

  seedSales(sales: BillingSaleWithRelations[]) {
    this.sales = new Map(sales.map((sale) => [sale.id, cloneSale(sale)]));
    this.initialNonBillingSnapshot = this.nonBillingSnapshot();
  }

  seedPreparedInvoices(preparedInvoices: BillingPreparedInvoiceWithRelations[]) {
    this.preparedInvoices.splice(0, this.preparedInvoices.length, ...preparedInvoices.map(clonePreparedInvoice));
    this.initialNonBillingSnapshot = this.nonBillingSnapshot();
  }

  nonBillingSnapshot() {
    return [...this.sales.values()].map((sale) => ({
      id: sale.id,
      status: sale.status,
      cancelledAt: sale.cancelledAt?.toISOString() ?? null,
      cancelledByUserId: sale.cancelledByUserId,
      cancelReason: sale.cancelReason,
      totalAmount: sale.totalAmount.toString(),
      totalCost: sale.totalCost.toString(),
      totalMargin: sale.totalMargin.toString(),
      payment: sale.payment
        ? {
            status: sale.payment.status,
            saleTotal: sale.payment.saleTotal.toString(),
            receivedAmount: sale.payment.receivedAmount.toString(),
            changeAmount: sale.payment.changeAmount.toString(),
            reversedAt: sale.payment.reversedAt?.toISOString() ?? null
          }
        : null,
      cashSession: {
        status: sale.cashSession.status,
        expectedAmount: sale.cashSession.expectedAmount.toString(),
        closedAt: sale.cashSession.closedAt?.toISOString() ?? null
      },
      items: sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        subtotal: item.subtotal.toString()
      }))
    }));
  }
}

function makeSale(overrides: Partial<BillingSaleWithRelations> = {}): BillingSaleWithRelations {
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
    cashSessionId: "cash-session-1",
    cashSession: {
      id: "cash-session-1",
      correlativeCode: "C-000001",
      openedByUserId: "seller-1",
      status: "closed",
      closedAt: now,
      expectedAmount: decimal(20)
    },
    cancelledAt: null,
    cancelledByUserId: null,
    cancelReason: null,
    status: "confirmed",
    totalAmount: decimal(20),
    totalCost: decimal(8),
    totalMargin: decimal(12),
    confirmedAt: now,
    payment: {
      id: "payment-1",
      saleId,
      cashSessionId: "cash-session-1",
      method: "cash",
      saleTotal: decimal(20),
      receivedAmount: decimal(25),
      changeAmount: decimal(5),
      refundAmount: null,
      status: "paid",
      paidAt: now,
      reversedAt: null,
      createdAt: now,
      updatedAt: now
    },
    items: [
      {
        id: "sale-item-1",
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
        createdAt: now,
        updatedAt: now
      }
    ],
    preparedInvoices: [],
    saleReturn: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function makePreparedInvoice(
  overrides: Partial<BillingPreparedInvoiceWithRelations> = {}
): BillingPreparedInvoiceWithRelations {
  const now = new Date("2026-05-31T11:00:00.000Z");

  return {
    id: "prepared-invoice-1",
    correlativeNumber: 1,
    correlativeCode: "INV-000001",
    saleId: "sale-1",
    sellerUserId: "seller-1",
    sellerUser: {
      id: "seller-1",
      fullName: "Vendedor Caja",
      email: "seller@example.com",
      status: "active"
    },
    status: "prepared",
    saleCorrelativeCode: "V-000001",
    cashSessionId: "cash-session-1",
    cashSessionCode: "C-000001",
    sellerName: "Vendedor Caja",
    sellerEmail: "seller@example.com",
    customerNit: "0",
    customerBusinessName: "Consumidor final",
    fiscalNotes: null,
    totalAmount: decimal(20),
    preparedAt: now,
    cancelledAt: null,
    cancelledByUserId: null,
    cancelledByUser: null,
    cancelReason: null,
    items: [],
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function cloneSale(sale: BillingSaleWithRelations): BillingSaleWithRelations {
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
    payment: sale.payment
      ? {
          ...sale.payment,
          saleTotal: decimal(sale.payment.saleTotal),
          receivedAmount: decimal(sale.payment.receivedAmount),
          changeAmount: decimal(sale.payment.changeAmount),
          paidAt: new Date(sale.payment.paidAt),
          reversedAt: sale.payment.reversedAt ? new Date(sale.payment.reversedAt) : null,
          createdAt: new Date(sale.payment.createdAt),
          updatedAt: new Date(sale.payment.updatedAt)
        }
      : null,
    items: sale.items.map((item) => ({
      ...item,
      unitPrice: decimal(item.unitPrice),
      subtotal: decimal(item.subtotal),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    })),
    preparedInvoices: sale.preparedInvoices.map((preparedInvoice) => ({ ...preparedInvoice })),
    saleReturn: sale.saleReturn ? { ...sale.saleReturn } : null,
    createdAt: new Date(sale.createdAt),
    updatedAt: new Date(sale.updatedAt)
  };
}

function clonePreparedInvoice(
  preparedInvoice: BillingPreparedInvoiceWithRelations
): BillingPreparedInvoiceWithRelations {
  return {
    ...preparedInvoice,
    sellerUser: { ...preparedInvoice.sellerUser },
    cancelledByUser: preparedInvoice.cancelledByUser ? { ...preparedInvoice.cancelledByUser } : null,
    totalAmount: decimal(preparedInvoice.totalAmount),
    preparedAt: new Date(preparedInvoice.preparedAt),
    cancelledAt: preparedInvoice.cancelledAt ? new Date(preparedInvoice.cancelledAt) : null,
    items: preparedInvoice.items.map((item) => ({
      ...item,
      unitPrice: decimal(item.unitPrice),
      subtotal: decimal(item.subtotal),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    })),
    createdAt: new Date(preparedInvoice.createdAt),
    updatedAt: new Date(preparedInvoice.updatedAt)
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
