import { Prisma } from "@prisma/client";
import type {
  CreateTotalSaleReturn,
  ReturnableSalesListResponse,
  ReturnableSalesQuery,
  SaleReturn,
  SaleReturnsListResponse,
  SaleReturnsQuery
} from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { ReturnsRepository } from "./returns.repository.js";
import type {
  ReturnableSaleListFilters,
  ReturnableSaleListResult,
  ReturnsAuditContext,
  ReturnsSaleReturnWithRelations,
  ReturnsSaleWithRelations,
  ReturnsTransactionClient,
  ReturnsUserRecord,
  ReturnsSaleUserRecord,
  SaleReturnListFilters,
  SaleReturnListResult
} from "./returns.types.js";

export type ReturnsRepositoryPort = {
  runInTransaction<T>(callback: (client: ReturnsTransactionClient) => Promise<T>): Promise<T>;
  listReturnableSales(
    filters: ReturnableSaleListFilters,
    client?: ReturnsTransactionClient
  ): Promise<ReturnableSaleListResult>;
  findSaleWithRelations(id: string, client?: ReturnsTransactionClient): Promise<ReturnsSaleWithRelations | null>;
  listSaleReturns(filters: SaleReturnListFilters, client?: ReturnsTransactionClient): Promise<SaleReturnListResult>;
  findSaleReturnById(id: string, client?: ReturnsTransactionClient): Promise<ReturnsSaleReturnWithRelations | null>;
  createSaleReturn(
    input: {
      saleId: string;
      paymentId: string;
      actorUserId: string;
      reason: string;
      refundAmount: Prisma.Decimal;
      returnedAt: Date;
    },
    client?: ReturnsTransactionClient
  ): Promise<ReturnsSaleReturnWithRelations>;
  createSaleReturnItem(
    input: {
      saleReturnId: string;
      saleItemId: string;
      saleItemBatchId: string;
      batchId: string;
      productId: string;
      inventoryMovementId: string;
      quantity: Prisma.Decimal;
      unitCostBase: Prisma.Decimal;
      refundUnitPrice: Prisma.Decimal;
      refundSubtotal: Prisma.Decimal;
      batchNumber?: string | null;
      expirationDate?: Date | null;
    },
    client?: ReturnsTransactionClient
  ): Promise<unknown>;
  markSaleReturned(id: string, client?: ReturnsTransactionClient): Promise<number>;
  markPaymentRefunded(
    id: string,
    refundAmount: Prisma.Decimal,
    refundedAt: Date,
    client?: ReturnsTransactionClient
  ): Promise<number>;
  updateBatchQuantity(id: string, availableQuantity: Prisma.Decimal, client?: ReturnsTransactionClient): Promise<unknown>;
  createReturnInventoryMovement(
    data: {
      batchId: string;
      productId: string;
      quantityBase: Prisma.Decimal;
      unitCostBase: Prisma.Decimal;
      referenceId: string;
      referenceItemId: string;
      actorUserId?: string;
      reason: string;
    },
    client?: ReturnsTransactionClient
  ): Promise<{ id: string }>;
  findUserById(id: string, client?: ReturnsTransactionClient): Promise<ReturnsUserRecord | null>;
  createAuditLog(
    action: string,
    entityId: string,
    metadata: unknown,
    context: ReturnsAuditContext,
    client?: ReturnsTransactionClient
  ): Promise<unknown>;
};

export class ReturnsService {
  constructor(private readonly returnsRepository: ReturnsRepositoryPort = new ReturnsRepository()) {}

  async listReturnableSales(
    query: ReturnableSalesQuery,
    context: ReturnsAuditContext
  ): Promise<ReturnableSalesListResponse> {
    await this.ensureActiveActor(context, "list returnable sales");

    const result = await this.returnsRepository.listReturnableSales(query);

    return {
      data: result.data.map(toReturnableSaleSummary),
      pagination: buildPagination(query.page, query.pageSize, result.total)
    };
  }

  async listSaleReturns(query: SaleReturnsQuery, context: ReturnsAuditContext): Promise<SaleReturnsListResponse> {
    await this.ensureActiveActor(context, "list sale returns");

    const result = await this.returnsRepository.listSaleReturns(query);

    return {
      data: result.data.map(toSaleReturnSummary),
      pagination: buildPagination(query.page, query.pageSize, result.total)
    };
  }

  async createTotalSaleReturn(input: CreateTotalSaleReturn, context: ReturnsAuditContext): Promise<SaleReturn> {
    const actorUserId = await this.ensureActiveActor(context, "create sale returns");
    const reason = input.reason.trim();

    const saleReturn = await this.returnsRepository.runInTransaction(async (client) => {
      const sale = await this.returnsRepository.findSaleWithRelations(input.saleId, client);

      this.ensureSaleCanBeReturned(sale, input.saleId);

      const paymentId = sale.payment.id;
      const returnedAt = new Date();
      const saleReturnedCount = await this.returnsRepository.markSaleReturned(sale.id, client);

      if (saleReturnedCount === 0) {
        throw new HttpError(409, "Sale has already been returned or is no longer confirmed.", "SALE_RETURN_CONFLICT", {
          saleId: sale.id
        });
      }

      const paymentRefundedCount = await this.returnsRepository.markPaymentRefunded(
        paymentId,
        sale.totalAmount,
        returnedAt,
        client
      );

      if (paymentRefundedCount === 0) {
        throw new HttpError(409, "Sale payment cannot be refunded.", "SALE_PAYMENT_NOT_REFUNDABLE", {
          saleId: sale.id,
          paymentId
        });
      }

      const createdSaleReturn = await this.returnsRepository.createSaleReturn(
        {
          actorUserId,
          paymentId,
          reason,
          refundAmount: sale.totalAmount,
          returnedAt,
          saleId: sale.id
        },
        client
      );
      const restoredBatchQuantities = new Map<string, Prisma.Decimal>();

      for (const item of sale.items) {
        for (const consumption of item.consumptions) {
          const currentAvailableQuantity =
            restoredBatchQuantities.get(consumption.batchId) ?? consumption.batch.availableQuantity;
          const nextAvailableQuantity = currentAvailableQuantity.add(consumption.quantity);

          restoredBatchQuantities.set(consumption.batchId, nextAvailableQuantity);
          await this.returnsRepository.updateBatchQuantity(consumption.batchId, nextAvailableQuantity, client);

          const movement = await this.returnsRepository.createReturnInventoryMovement(
            {
              actorUserId,
              batchId: consumption.batchId,
              productId: item.productId,
              quantityBase: consumption.quantity,
              referenceId: createdSaleReturn.id,
              referenceItemId: consumption.id,
              reason: `Sale returned: ${reason}`,
              unitCostBase: consumption.unitCostBase
            },
            client
          );

          await this.returnsRepository.createSaleReturnItem(
            {
              batchId: consumption.batchId,
              batchNumber: consumption.batch.batchNumber,
              expirationDate: consumption.batch.expirationDate,
              inventoryMovementId: movement.id,
              productId: item.productId,
              quantity: consumption.quantity,
              refundSubtotal: toMoney(item.unitPrice.mul(consumption.quantity)),
              refundUnitPrice: item.unitPrice,
              saleItemBatchId: consumption.id,
              saleItemId: item.id,
              saleReturnId: createdSaleReturn.id,
              unitCostBase: consumption.unitCostBase
            },
            client
          );
        }
      }

      const completedSaleReturn = await this.returnsRepository.findSaleReturnById(createdSaleReturn.id, client);

      if (!completedSaleReturn) {
        throw new Error("Sale return disappeared during transaction.");
      }

      await this.returnsRepository.createAuditLog(
        "SALE_RETURNED",
        completedSaleReturn.id,
        buildSaleReturnAuditMetadata(completedSaleReturn, sale),
        context,
        client
      );

      return completedSaleReturn;
    });

    return toSaleReturn(saleReturn);
  }

  async getSaleReturnById(id: string, context: ReturnsAuditContext): Promise<SaleReturn> {
    await this.ensureActiveActor(context, "get sale returns");

    const saleReturn = await this.returnsRepository.findSaleReturnById(id);

    if (!saleReturn) {
      throw new HttpError(404, "Sale return was not found.", "SALE_RETURN_NOT_FOUND", { id });
    }

    return toSaleReturn(saleReturn);
  }

  private async ensureActiveActor(context: ReturnsAuditContext, action: string) {
    const actorUserId = context.actorUserId;

    if (!actorUserId) {
      throw new HttpError(401, `Authenticated user is required to ${action}.`, "AUTHENTICATED_USER_REQUIRED");
    }

    const actor = await this.returnsRepository.findUserById(actorUserId);

    if (!actor) {
      throw new HttpError(401, "Authenticated user was not found.", "AUTHENTICATED_USER_NOT_FOUND");
    }

    if (actor.status !== "active") {
      throw new HttpError(403, "Authenticated user must be active.", "AUTHENTICATED_USER_NOT_ACTIVE");
    }

    return actorUserId;
  }

  private ensureSaleCanBeReturned(
    sale: ReturnsSaleWithRelations | null,
    saleId: string
  ): asserts sale is ReturnsSaleWithRelations & { payment: NonNullable<ReturnsSaleWithRelations["payment"]> } {
    if (!sale) {
      throw new HttpError(404, "Sale was not found for return creation.", "SALE_NOT_FOUND", {
        saleId,
        returnBlockedReason: "sale-not-found"
      });
    }

    const returnBlockedReason = getReturnBlockedReason(sale);

    if (!returnBlockedReason) {
      return;
    }

    throw new HttpError(409, "Sale is not eligible for total return.", "SALE_NOT_RETURNABLE", {
      saleId: sale.id,
      saleStatus: sale.status,
      returnBlockedReason
    });
  }
}

function toReturnableSaleSummary(sale: ReturnsSaleWithRelations) {
  const activePreparedInvoice = sale.preparedInvoices.find((preparedInvoice) => preparedInvoice.status === "prepared");
  const returnBlockedReason = getReturnBlockedReason(sale);

  return {
    id: sale.id,
    activePreparedInvoiceId: activePreparedInvoice?.id,
    canReturn: !returnBlockedReason,
    cashSessionCorrelativeCode: sale.cashSession.correlativeCode,
    cashSessionId: sale.cashSessionId,
    confirmedAt: sale.confirmedAt.toISOString(),
    correlativeCode: sale.correlativeCode,
    paymentStatus: sale.payment?.status ?? "cancelled",
    returnBlockedReason,
    sellerUser: toAdministrativeUserSummary(sale.sellerUser),
    sellerUserId: sale.sellerUserId,
    status: sale.status,
    totalAmount: Number(sale.totalAmount)
  };
}

function getReturnBlockedReason(sale: ReturnsSaleWithRelations) {
  if (sale.status === "cancelled") {
    return "sale-cancelled" as const;
  }

  if (sale.status === "returned" || sale.saleReturn) {
    return "already-returned" as const;
  }

  if (sale.cashSession.status === "open" || !sale.cashSession.closedAt) {
    return "cash-session-open" as const;
  }

  if (sale.preparedInvoices.some((preparedInvoice) => preparedInvoice.status === "prepared")) {
    return "active-invoice-exists" as const;
  }

  if (!sale.payment || sale.payment.status !== "paid") {
    return "payment-not-refundable" as const;
  }

  if (sale.status !== "confirmed") {
    return "unknown" as const;
  }

  return undefined;
}

function toSaleReturn(saleReturn: ReturnsSaleReturnWithRelations): SaleReturn {
  return {
    ...toSaleReturnSummary(saleReturn),
    items: saleReturn.items.map(toSaleReturnItem)
  };
}

function toSaleReturnSummary(saleReturn: ReturnsSaleReturnWithRelations) {
  return {
    id: saleReturn.id,
    actorUser: toAdministrativeUserSummary(saleReturn.actorUser),
    actorUserId: saleReturn.actorUserId,
    createdAt: saleReturn.createdAt.toISOString(),
    paymentId: saleReturn.paymentId,
    reason: saleReturn.reason,
    refundAmount: Number(saleReturn.refundAmount),
    returnedAt: saleReturn.returnedAt.toISOString(),
    saleCorrelativeCode: saleReturn.sale.correlativeCode,
    saleId: saleReturn.saleId,
    updatedAt: saleReturn.updatedAt.toISOString()
  };
}

function toSaleReturnItem(item: ReturnsSaleReturnWithRelations["items"][number]) {
  return {
    id: item.id,
    batchId: item.batchId,
    batchNumber: item.batchNumber ?? undefined,
    commercialName: item.saleItem.commercialName,
    createdAt: item.createdAt.toISOString(),
    expirationDate: item.expirationDate ? toDateOnly(item.expirationDate) : undefined,
    genericName: item.saleItem.genericName ?? undefined,
    internalCode: item.saleItem.internalCode,
    inventoryMovementId: item.inventoryMovementId ?? undefined,
    productId: item.productId,
    quantity: Number(item.quantity),
    refundSubtotal: Number(item.refundSubtotal),
    refundUnitPrice: Number(item.refundUnitPrice),
    saleItemBatchId: item.saleItemBatchId,
    saleItemId: item.saleItemId,
    saleReturnId: item.saleReturnId,
    unitCostBase: Number(item.unitCostBase),
    updatedAt: item.updatedAt.toISOString()
  };
}

function toAdministrativeUserSummary(user: ReturnsSaleUserRecord) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName
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

function buildSaleReturnAuditMetadata(
  saleReturn: ReturnsSaleReturnWithRelations,
  sale: ReturnsSaleWithRelations
) {
  return {
    actorUserId: saleReturn.actorUserId,
    cashSessionCorrelativeCode: sale.cashSession.correlativeCode,
    cashSessionId: sale.cashSessionId,
    itemCount: saleReturn.items.length,
    operationSource: "administrative-returns",
    operationType: "administrative-total-sale-return",
    originalPaymentStatus: sale.payment?.status ?? null,
    originalSaleStatus: sale.status,
    paymentId: saleReturn.paymentId,
    paymentMethod: saleReturn.payment.method,
    paymentStatus: saleReturn.payment.status,
    reason: saleReturn.reason,
    refundAmount: Number(saleReturn.refundAmount),
    returnedAt: saleReturn.returnedAt.toISOString(),
    restoredConsumptions: saleReturn.items.map((item) => ({
      batchId: item.batchId,
      batchNumber: item.batchNumber ?? null,
      expirationDate: item.expirationDate ? toDateOnly(item.expirationDate) : null,
      inventoryMovementId: item.inventoryMovementId ?? null,
      productId: item.productId,
      quantity: Number(item.quantity),
      refundSubtotal: Number(item.refundSubtotal),
      refundUnitPrice: Number(item.refundUnitPrice),
      saleItemBatchId: item.saleItemBatchId,
      saleItemId: item.saleItemId,
      unitCostBase: Number(item.unitCostBase)
    })),
    saleCorrelativeCode: sale.correlativeCode,
    saleId: sale.id,
    saleStatus: "returned",
    sellerUserId: sale.sellerUserId
  };
}

function toMoney(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}
