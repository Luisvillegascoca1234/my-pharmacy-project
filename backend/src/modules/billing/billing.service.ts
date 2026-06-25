import type {
  CancelPreparedInvoice,
  InvoiceableSalesListResponse,
  InvoiceableSalesQuery,
  PrepareInvoiceFromSale,
  PreparedInvoice,
  PreparedInvoicesListResponse,
  PreparedInvoicesQuery
} from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { BillingRepository } from "./billing.repository.js";
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

const PREPARED_INVOICE_CORRELATIVE_PREFIX = "INV";
const PREPARED_INVOICE_CORRELATIVE_DIGITS = 6;

export type BillingRepositoryPort = {
  runInTransaction<T>(callback: (client: BillingTransactionClient) => Promise<T>): Promise<T>;
  listInvoiceableSales(
    filters: InvoiceableSalesQuery
  ): Promise<{ data: BillingSaleWithRelations[]; total: number }>;
  listPreparedInvoices(
    filters: PreparedInvoicesQuery
  ): Promise<{ data: BillingPreparedInvoiceWithRelations[]; total: number }>;
  findSaleWithRelations(id: string, client?: BillingTransactionClient): Promise<BillingSaleWithRelations | null>;
  findPreparedInvoiceById(id: string, client?: BillingTransactionClient): Promise<BillingPreparedInvoiceWithRelations | null>;
  markPreparedInvoiceCancelled(
    id: string,
    input: CancelPreparedInvoiceData,
    client?: BillingTransactionClient
  ): Promise<number>;
  getNextPreparedInvoiceCorrelativeNumber(client?: BillingTransactionClient): Promise<number>;
  createPreparedInvoice(
    input: CreatePreparedInvoiceData,
    items: CreatePreparedInvoiceItemData[],
    client?: BillingTransactionClient
  ): Promise<BillingPreparedInvoiceWithRelations>;
  findUserById(id: string): Promise<BillingUserRecord | null>;
  createAuditLog(
    action: string,
    entityId: string,
    metadata: unknown,
    context: BillingAuditContext,
    client?: BillingTransactionClient
  ): Promise<unknown>;
};

export class BillingService {
  constructor(private readonly billingRepository: BillingRepositoryPort = new BillingRepository()) {}

  async listInvoiceableSales(query: InvoiceableSalesQuery, context: BillingAuditContext): Promise<InvoiceableSalesListResponse> {
    await this.ensureActiveActor(context, "list invoiceable sales");

    const result = await this.billingRepository.listInvoiceableSales(query);

    return {
      data: result.data.map(toInvoiceableSaleSummary),
      pagination: buildPagination(query.page, query.pageSize, result.total)
    };
  }

  async listPreparedInvoices(query: PreparedInvoicesQuery, context: BillingAuditContext): Promise<PreparedInvoicesListResponse> {
    await this.ensureActiveActor(context, "list prepared invoices");

    const result = await this.billingRepository.listPreparedInvoices(query);

    return {
      data: result.data.map(toPreparedInvoiceSummary),
      pagination: buildPagination(query.page, query.pageSize, result.total)
    };
  }

  async prepareInvoiceFromSale(input: PrepareInvoiceFromSale, context: BillingAuditContext): Promise<PreparedInvoice> {
    await this.ensureActiveActor(context, "prepare invoices");

    const preparedInvoice = await this.billingRepository.runInTransaction(async (client) => {
      const sale = await this.billingRepository.findSaleWithRelations(input.saleId, client);

      this.ensureSaleCanPrepareInvoice(sale, input.saleId);

      const correlativeNumber = await this.billingRepository.getNextPreparedInvoiceCorrelativeNumber(client);
      const preparedAt = new Date();
      const preparedInvoice = await this.billingRepository.createPreparedInvoice(
        {
          correlativeNumber,
          correlativeCode: buildPreparedInvoiceCorrelativeCode(correlativeNumber),
          saleId: sale.id,
          sellerUserId: sale.sellerUserId,
          saleCorrelativeCode: sale.correlativeCode,
          cashSessionId: sale.cashSessionId,
          cashSessionCode: sale.cashSession.correlativeCode,
          sellerName: sale.sellerUser.fullName,
          sellerEmail: sale.sellerUser.email,
          customerNit: input.customerNit,
          customerBusinessName: input.customerBusinessName,
          fiscalNotes: input.fiscalNotes,
          totalAmount: sale.totalAmount,
          preparedAt
        },
        sale.items.map(toPreparedInvoiceItemData),
        client
      );

      await this.billingRepository.createAuditLog(
        "PREPARED_INVOICE_CREATED",
        preparedInvoice.id,
        buildPreparedInvoiceAuditMetadata(preparedInvoice),
        context,
        client
      );

      return preparedInvoice;
    });

    return toPreparedInvoice(preparedInvoice);
  }

  async getPreparedInvoiceById(id: string, context: BillingAuditContext): Promise<PreparedInvoice> {
    await this.ensureActiveActor(context, "get prepared invoices");

    const preparedInvoice = await this.billingRepository.findPreparedInvoiceById(id);

    if (!preparedInvoice) {
      throw new HttpError(404, "Prepared invoice was not found.", "PREPARED_INVOICE_NOT_FOUND");
    }

    return toPreparedInvoice(preparedInvoice);
  }

  async cancelPreparedInvoice(
    id: string,
    input: CancelPreparedInvoice,
    context: BillingAuditContext
  ): Promise<PreparedInvoice> {
    await this.ensureActiveActor(context, "cancel prepared invoices");

    const cancelledInvoice = await this.billingRepository.runInTransaction(async (client) => {
      const preparedInvoice = await this.billingRepository.findPreparedInvoiceById(id, client);

      if (!preparedInvoice) {
        throw new HttpError(404, "Prepared invoice was not found.", "PREPARED_INVOICE_NOT_FOUND");
      }

      if (preparedInvoice.status !== "prepared") {
        throw new HttpError(409, "Prepared invoice has already been cancelled.", "PREPARED_INVOICE_ALREADY_CANCELLED", {
          id: preparedInvoice.id,
          status: preparedInvoice.status,
          correlativeCode: preparedInvoice.correlativeCode
        });
      }

      const cancelReason = input.cancelReason.trim();
      const cancelledAt = new Date();
      const cancelledCount = await this.billingRepository.markPreparedInvoiceCancelled(
        id,
        {
          cancelReason,
          cancelledAt,
          cancelledByUserId: context.actorUserId!
        },
        client
      );

      if (cancelledCount === 0) {
        throw new HttpError(409, "Prepared invoice has already been cancelled.", "PREPARED_INVOICE_ALREADY_CANCELLED", {
          id: preparedInvoice.id,
          status: preparedInvoice.status,
          correlativeCode: preparedInvoice.correlativeCode
        });
      }

      const cancelledInvoice = await this.billingRepository.findPreparedInvoiceById(id, client);

      if (!cancelledInvoice) {
        throw new Error("Prepared invoice disappeared during cancellation transaction.");
      }

      await this.billingRepository.createAuditLog(
        "PREPARED_INVOICE_CANCELLED",
        cancelledInvoice.id,
        buildPreparedInvoiceCancellationAuditMetadata(preparedInvoice, cancelledInvoice, cancelReason, context.actorUserId!),
        context,
        client
      );

      return cancelledInvoice;
    });

    return toPreparedInvoice(cancelledInvoice);
  }

  private async ensureActiveActor(context: BillingAuditContext, action: string) {
    const actorUserId = context.actorUserId;

    if (!actorUserId) {
      throw new HttpError(401, `Authenticated user is required to ${action}.`, "AUTHENTICATED_USER_REQUIRED");
    }

    const actor = await this.billingRepository.findUserById(actorUserId);

    if (!actor) {
      throw new HttpError(401, "Authenticated user was not found.", "AUTHENTICATED_USER_NOT_FOUND");
    }

    if (actor.status !== "active") {
      throw new HttpError(403, "Authenticated user must be active.", "AUTHENTICATED_USER_NOT_ACTIVE");
    }
  }

  private ensureSaleCanPrepareInvoice(
    sale: BillingSaleWithRelations | null,
    saleId: string
  ): asserts sale is BillingSaleWithRelations {
    if (!sale) {
      throw new HttpError(404, "Sale was not found for prepared invoice creation.", "SALE_NOT_FOUND", {
        saleId,
        invoiceBlockedReason: "sale-not-found"
      });
    }

    const invoiceBlockedReason = getInvoiceBlockedReason(sale);

    if (!invoiceBlockedReason) {
      return;
    }

    if (invoiceBlockedReason === "active-invoice-exists") {
      throw new HttpError(409, "Sale already has an active prepared invoice.", "PREPARED_INVOICE_ACTIVE_EXISTS", {
        saleId: sale.id,
        activePreparedInvoiceId: sale.preparedInvoices[0]?.id,
        invoiceBlockedReason
      });
    }

    throw new HttpError(409, "Sale is not eligible for prepared invoice creation.", "SALE_NOT_INVOICEABLE", {
      saleId: sale.id,
      saleStatus: sale.status,
      invoiceBlockedReason
    });
  }
}

function toInvoiceableSaleSummary(sale: BillingSaleWithRelations) {
  const activePreparedInvoice = sale.preparedInvoices[0];
  const invoiceBlockedReason = getInvoiceBlockedReason(sale);

  return {
    id: sale.id,
    correlativeCode: sale.correlativeCode,
    cashSessionId: sale.cashSessionId,
    cashSessionCorrelativeCode: sale.cashSession.correlativeCode,
    sellerUserId: sale.sellerUserId,
    sellerUser: toAdministrativeUserSummary(sale.sellerUser),
    status: sale.status,
    totalAmount: Number(sale.totalAmount),
    confirmedAt: sale.confirmedAt.toISOString(),
    activePreparedInvoiceId: activePreparedInvoice?.id,
    canPrepareInvoice: !invoiceBlockedReason,
    invoiceBlockedReason
  };
}

function getInvoiceBlockedReason(sale: BillingSaleWithRelations) {
  if (sale.status === "cancelled") {
    return "sale-cancelled" as const;
  }

  if (sale.status === "returned" || sale.saleReturn) {
    return "sale-returned" as const;
  }

  if (sale.preparedInvoices.length > 0) {
    return "active-invoice-exists" as const;
  }

  if (sale.status !== "confirmed") {
    return "unknown" as const;
  }

  return undefined;
}

function toPreparedInvoice(preparedInvoice: BillingPreparedInvoiceWithRelations): PreparedInvoice {
  return {
    ...toPreparedInvoiceSummary(preparedInvoice),
    sellerUser: toAdministrativeUserSummary(preparedInvoice.sellerUser),
    items: preparedInvoice.items.map((item) => ({
      id: item.id,
      preparedInvoiceId: item.preparedInvoiceId,
      saleItemId: item.saleItemId,
      productId: item.productId,
      internalCode: item.internalCode,
      barcode: item.barcode ?? undefined,
      commercialName: item.commercialName,
      genericName: item.genericName ?? undefined,
      baseUnit: {
        id: item.baseUnitId,
        name: item.baseUnitName,
        abbreviation: item.baseUnitAbbreviation
      },
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }))
  };
}

function toPreparedInvoiceSummary(preparedInvoice: BillingPreparedInvoiceWithRelations) {
  return {
    id: preparedInvoice.id,
    correlativeCode: preparedInvoice.correlativeCode,
    saleId: preparedInvoice.saleId,
    saleCorrelativeCode: preparedInvoice.saleCorrelativeCode,
    cashSessionId: preparedInvoice.cashSessionId,
    cashSessionCode: preparedInvoice.cashSessionCode,
    sellerUserId: preparedInvoice.sellerUserId,
    sellerName: preparedInvoice.sellerName,
    sellerEmail: preparedInvoice.sellerEmail,
    status: preparedInvoice.status,
    customerNit: preparedInvoice.customerNit,
    customerBusinessName: preparedInvoice.customerBusinessName,
    fiscalNotes: preparedInvoice.fiscalNotes ?? undefined,
    totalAmount: Number(preparedInvoice.totalAmount),
    preparedAt: preparedInvoice.preparedAt.toISOString(),
    cancelledAt: preparedInvoice.cancelledAt?.toISOString(),
    cancelledByUserId: preparedInvoice.cancelledByUserId ?? undefined,
    cancelledByUser: preparedInvoice.cancelledByUser
      ? toAdministrativeUserSummary(preparedInvoice.cancelledByUser)
      : undefined,
    cancelReason: preparedInvoice.cancelReason ?? undefined,
    createdAt: preparedInvoice.createdAt.toISOString(),
    updatedAt: preparedInvoice.updatedAt.toISOString()
  };
}

function toAdministrativeUserSummary(user: BillingSaleWithRelations["sellerUser"]) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email
  };
}

function buildPagination(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize)
  };
}

function toPreparedInvoiceItemData(item: BillingSaleWithRelations["items"][number]): CreatePreparedInvoiceItemData {
  return {
    saleItemId: item.id,
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
    subtotal: item.subtotal
  };
}

function buildPreparedInvoiceCorrelativeCode(correlativeNumber: number) {
  return `${PREPARED_INVOICE_CORRELATIVE_PREFIX}-${correlativeNumber
    .toString()
    .padStart(PREPARED_INVOICE_CORRELATIVE_DIGITS, "0")}`;
}

function buildPreparedInvoiceAuditMetadata(preparedInvoice: BillingPreparedInvoiceWithRelations) {
  return {
    correlativeCode: preparedInvoice.correlativeCode,
    saleId: preparedInvoice.saleId,
    saleCorrelativeCode: preparedInvoice.saleCorrelativeCode,
    cashSessionId: preparedInvoice.cashSessionId,
    cashSessionCode: preparedInvoice.cashSessionCode,
    sellerUserId: preparedInvoice.sellerUserId,
    sellerName: preparedInvoice.sellerName,
    status: preparedInvoice.status,
    totalAmount: Number(preparedInvoice.totalAmount),
    customerNit: preparedInvoice.customerNit,
    customerBusinessName: preparedInvoice.customerBusinessName,
    fiscalNotes: preparedInvoice.fiscalNotes,
    itemCount: preparedInvoice.items.length,
    preparedAt: preparedInvoice.preparedAt.toISOString()
  };
}

function buildPreparedInvoiceCancellationAuditMetadata(
  before: BillingPreparedInvoiceWithRelations,
  after: BillingPreparedInvoiceWithRelations,
  cancelReason: string,
  actorUserId: string
) {
  return {
    correlativeCode: after.correlativeCode,
    saleId: after.saleId,
    saleCorrelativeCode: after.saleCorrelativeCode,
    cashSessionId: after.cashSessionId,
    cashSessionCode: after.cashSessionCode,
    actorUserId,
    cancelReason,
    before: {
      status: before.status,
      cancelledAt: before.cancelledAt?.toISOString(),
      cancelledByUserId: before.cancelledByUserId,
      cancelReason: before.cancelReason
    },
    after: {
      status: after.status,
      cancelledAt: after.cancelledAt?.toISOString(),
      cancelledByUserId: after.cancelledByUserId,
      cancelReason: after.cancelReason
    }
  };
}
