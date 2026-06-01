import { Prisma } from "@prisma/client";
import {
  CancelableSaleSchema,
  SaleSchema,
  type CancelSale,
  type CancelableSale,
  type CancelableSaleSummary,
  type CreateSale,
  type Sale,
  type SalesListResponse,
  type SalesQuery
} from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { SalesRepository } from "./sales.repository.js";
import type {
  AllocateSaleInventoryInput,
  AuditContext,
  CreateCashPaymentData,
  CreateConfirmedSaleData,
  CreateConfirmedSaleItemData,
  SaleActorRecord,
  SaleCashSessionRecord,
  SaleFefoBatchRecord,
  SaleInventoryAllocationResult,
  SaleInventoryConsumptionRecord,
  SalesListFilters,
  SalesListResult,
  SaleProductRecord,
  SaleWithRelations,
  SalesTransactionClient
} from "./sales.types.js";

const ZERO_DECIMAL = new Prisma.Decimal(0);
const SALE_CORRELATIVE_PREFIX = "V";
const SALE_CORRELATIVE_DIGITS = 6;
const ADMIN_ROLE_NAMES = new Set(["admin", "superadmin"]);

type MutableSaleFefoBatch = SaleFefoBatchRecord & {
  remainingQuantity: Prisma.Decimal;
};

type SaleAccessContext = AuditContext & {
  actorRoleName?: string;
};

export type SalesRepositoryPort = {
  runInTransaction<T>(callback: (client: SalesTransactionClient) => Promise<T>): Promise<T>;
  listSales(filters: SalesListFilters, client?: SalesTransactionClient): Promise<SalesListResult>;
  findUserById(id: string, client?: SalesTransactionClient): Promise<SaleActorRecord | null>;
  findOpenCashSessionByUserId(userId: string, client?: SalesTransactionClient): Promise<SaleCashSessionRecord | null>;
  findProductsByIds(productIds: string[], client?: SalesTransactionClient): Promise<SaleProductRecord[]>;
  getNextSaleCorrelativeNumber(client?: SalesTransactionClient): Promise<number>;
  createConfirmedSale(
    input: CreateConfirmedSaleData,
    items: CreateConfirmedSaleItemData[],
    client?: SalesTransactionClient
  ): Promise<SaleWithRelations>;
  updateSaleItemFinancials(
    id: string,
    input: {
      totalCost: Prisma.Decimal;
      margin: Prisma.Decimal;
    },
    client?: SalesTransactionClient
  ): Promise<unknown>;
  updateSaleTotals(
    id: string,
    input: {
      totalCost: Prisma.Decimal;
      totalMargin: Prisma.Decimal;
    },
    client?: SalesTransactionClient
  ): Promise<unknown>;
  createCashPayment(data: CreateCashPaymentData, client?: SalesTransactionClient): Promise<unknown>;
  incrementCashSessionExpectedAmount(id: string, amount: Prisma.Decimal, client?: SalesTransactionClient): Promise<unknown>;
  getSaleById(id: string, client?: SalesTransactionClient): Promise<SaleWithRelations | null>;
  markSaleCancelled(
    id: string,
    input: {
      cancelReason: string;
      cancelledAt: Date;
      cancelledByUserId: string;
    },
    client?: SalesTransactionClient
  ): Promise<number>;
  markPaymentReverted(id: string, reversedAt: Date, client?: SalesTransactionClient): Promise<unknown>;
  createAuditLog(
    action: string,
    entityId: string,
    metadata: unknown,
    context: AuditContext,
    client?: SalesTransactionClient
  ): Promise<unknown>;
  listSaleableBatchesByProductIds(
    productIds: string[],
    today: Date,
    client: SalesTransactionClient
  ): Promise<SaleFefoBatchRecord[]>;
  updateBatchQuantity(id: string, availableQuantity: Prisma.Decimal, client: SalesTransactionClient): Promise<unknown>;
  createSaleInventoryMovement(
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
    client: SalesTransactionClient
  ): Promise<{ id: string }>;
  createSaleCancellationInventoryMovement(
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
    client: SalesTransactionClient
  ): Promise<{ id: string }>;
  createSaleItemBatch(
    data: {
      saleItemId: string;
      batchId: string;
      quantity: Prisma.Decimal;
      unitCostBase: Prisma.Decimal;
      totalCost: Prisma.Decimal;
      inventoryMovementId: string;
    },
    client: SalesTransactionClient
  ): Promise<SaleInventoryConsumptionRecord>;
};

export type SalesServicePort = Pick<SalesService, "allocateSaleInventory">;

export class SalesService {
  constructor(private readonly salesRepository: SalesRepositoryPort = new SalesRepository()) {}

  async listSales(query: SalesQuery, context: SaleAccessContext): Promise<SalesListResponse> {
    const actorUserId = this.getAuthenticatedUserId(context);
    const isAdmin = ADMIN_ROLE_NAMES.has(context.actorRoleName ?? "");
    const page = query.page;
    const pageSize = query.pageSize;
    const result = await this.salesRepository.listSales({
      cashSessionId: query.cashSessionId,
      fromDate: query.fromDate,
      page,
      pageSize,
      search: query.search,
      sellerUserId: isAdmin ? query.sellerUserId : actorUserId,
      status: query.status,
      toDate: query.toDate
    });

    return {
      data: result.data.map((sale) => toCancelableSaleSummary(sale, actorUserId, context.actorRoleName)),
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize)
      }
    };
  }

  async getSale(id: string, context: SaleAccessContext): Promise<CancelableSale> {
    const actorUserId = this.getAuthenticatedUserId(context);
    const sale = await this.salesRepository.getSaleById(id);

    if (!sale) {
      throw new HttpError(404, "Sale was not found.", "SALE_NOT_FOUND", { id });
    }

    this.ensureCanReadSale(sale, actorUserId, context.actorRoleName);

    return toCancelableSale(sale, actorUserId, context.actorRoleName);
  }

  async createSale(input: CreateSale, context: AuditContext): Promise<Sale> {
    return this.salesRepository.runInTransaction((tx) => this.createSaleInTransaction(input, context, tx));
  }

  async cancelSale(id: string, input: CancelSale, context: SaleAccessContext): Promise<CancelableSale> {
    const actorUserId = this.getAuthenticatedUserId(context);
    const cancelReason = input.cancelReason.trim();

    if (cancelReason.length < 3) {
      throw new HttpError(400, "Sale cancellation reason is required.", "SALE_CANCEL_REASON_REQUIRED");
    }

    return this.salesRepository.runInTransaction(async (tx) => {
      const [actor, sale] = await Promise.all([
        this.salesRepository.findUserById(actorUserId, tx),
        this.salesRepository.getSaleById(id, tx)
      ]);

      this.ensureActiveActor(actor);

      if (!sale) {
        throw new HttpError(404, "Sale was not found.", "SALE_NOT_FOUND", { id });
      }

      this.ensureCanCancelSale(sale, actorUserId, context.actorRoleName);

      if (!sale.payment) {
        throw new HttpError(409, "Sale cannot be cancelled because its payment is missing.", "SALE_PAYMENT_REQUIRED", { id });
      }

      if (sale.payment.status !== "paid") {
        throw new HttpError(409, "Sale payment has already been reverted.", "SALE_PAYMENT_ALREADY_REVERTED", {
          saleId: sale.id,
          paymentId: sale.payment.id
        });
      }

      const cancelledAt = new Date();
      const cancelledCount = await this.salesRepository.markSaleCancelled(
        sale.id,
        {
          cancelReason,
          cancelledAt,
          cancelledByUserId: actorUserId
        },
        tx
      );

      if (cancelledCount === 0) {
        throw new HttpError(409, "Sale has already been cancelled.", "SALE_ALREADY_CANCELLED", { id: sale.id });
      }

      const restoredBatchQuantities = new Map<string, Prisma.Decimal>();

      for (const item of sale.items) {
        for (const consumption of item.consumptions) {
          const currentAvailableQuantity = restoredBatchQuantities.get(consumption.batchId) ?? consumption.batch.availableQuantity;
          const nextAvailableQuantity = currentAvailableQuantity.add(consumption.quantity);

          restoredBatchQuantities.set(consumption.batchId, nextAvailableQuantity);
          await this.salesRepository.updateBatchQuantity(consumption.batchId, nextAvailableQuantity, tx);
          await this.salesRepository.createSaleCancellationInventoryMovement(
            {
              actorUserId,
              batchId: consumption.batchId,
              productId: item.productId,
              quantityBase: consumption.quantity,
              referenceId: sale.id,
              referenceItemId: item.id,
              reason: `Sale cancelled: ${cancelReason}`,
              unitCostBase: consumption.unitCostBase
            },
            tx
          );
        }
      }

      await this.salesRepository.markPaymentReverted(sale.payment.id, cancelledAt, tx);
      await this.salesRepository.incrementCashSessionExpectedAmount(sale.cashSessionId, sale.totalAmount.negated(), tx);

      const cancelledSale = await this.salesRepository.getSaleById(sale.id, tx);

      if (!cancelledSale) {
        throw new Error("Sale disappeared during cancellation transaction.");
      }

      await this.salesRepository.createAuditLog(
        "SALE_CANCELLED",
        cancelledSale.id,
        buildCancelledSaleAuditMetadata(cancelledSale, cancelReason),
        context,
        tx
      );

      return toCancelableSale(cancelledSale, actorUserId, context.actorRoleName);
    });
  }

  async createSaleInTransaction(input: CreateSale, context: AuditContext, tx: SalesTransactionClient): Promise<Sale> {
    const actorUserId = this.getAuthenticatedUserId(context);
    const normalizedItems = normalizeSaleItems(input.items);
    const receivedAmount = toMoney(input.payment.receivedAmount, "SALE_PAYMENT_RECEIVED_AMOUNT_INVALID");

    const [actor, cashSession] = await Promise.all([
      this.salesRepository.findUserById(actorUserId, tx),
      this.salesRepository.findOpenCashSessionByUserId(actorUserId, tx)
    ]);

    this.ensureActiveActor(actor);
    this.ensureOwnOpenCashSession(cashSession, actorUserId);

    const saleItems = await this.buildConfirmedSaleItems(normalizedItems, tx);
    const totalAmount = sumSaleItemSubtotals(saleItems);

    if (receivedAmount.lessThan(totalAmount)) {
      throw new HttpError(409, "Received cash amount must be equal to or greater than sale total.", "SALE_PAYMENT_INSUFFICIENT", {
        totalAmount: Number(totalAmount),
        receivedAmount: Number(receivedAmount)
      });
    }

    const changeAmount = toMoney(receivedAmount.minus(totalAmount));
    const correlativeNumber = await this.salesRepository.getNextSaleCorrelativeNumber(tx);
    const confirmedAt = new Date();
    const createdSale = await this.salesRepository.createConfirmedSale(
      {
        cashSessionId: cashSession.id,
        confirmedAt,
        correlativeCode: buildSaleCorrelativeCode(correlativeNumber),
        correlativeNumber,
        sellerUserId: actorUserId,
        totalAmount,
        totalCost: ZERO_DECIMAL,
        totalMargin: ZERO_DECIMAL
      },
      saleItems,
      tx
    );

    const allocation = await this.allocateSaleInventory(
      {
        actorUserId,
        saleId: createdSale.id,
        items: createdSale.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          saleItemId: item.id
        }))
      },
      tx
    );
    const allocationBySaleItemId = new Map(allocation.items.map((item) => [item.saleItemId, item]));

    for (const item of createdSale.items) {
      const allocatedItem = allocationBySaleItemId.get(item.id);
      const totalCost = toMoney(allocatedItem?.totalCost ?? ZERO_DECIMAL);
      const margin = toMoney(item.subtotal.minus(totalCost));

      await this.salesRepository.updateSaleItemFinancials(
        item.id,
        {
          totalCost,
          margin
        },
        tx
      );
    }

    const totalCost = toMoney(allocation.totalCost);
    const totalMargin = toMoney(totalAmount.minus(totalCost));

    await this.salesRepository.updateSaleTotals(
      createdSale.id,
      {
        totalCost,
        totalMargin
      },
      tx
    );
    await this.salesRepository.createCashPayment(
      {
        cashSessionId: cashSession.id,
        changeAmount,
        paidAt: confirmedAt,
        receivedAmount,
        saleId: createdSale.id,
        saleTotal: totalAmount
      },
      tx
    );
    await this.salesRepository.incrementCashSessionExpectedAmount(cashSession.id, totalAmount, tx);

    const completedSale = await this.salesRepository.getSaleById(createdSale.id, tx);

    if (!completedSale) {
      throw new Error("Sale disappeared during transaction.");
    }

    await this.salesRepository.createAuditLog(
      "SALE_CONFIRMED",
      completedSale.id,
      buildConfirmedSaleAuditMetadata(completedSale),
      context,
      tx
    );

    return toSale(completedSale);
  }

  async allocateSaleInventory(
    input: AllocateSaleInventoryInput,
    client: SalesTransactionClient
  ): Promise<SaleInventoryAllocationResult> {
    const items = input.items.map((item) => ({
      ...item,
      quantity: toSaleQuantity(item.quantity)
    }));

    if (items.length === 0) {
      throw new HttpError(400, "Sale must contain at least one item.", "SALE_ITEMS_REQUIRED");
    }

    const productIds = Array.from(new Set(items.map((item) => item.productId)));
    const batches = await this.salesRepository.listSaleableBatchesByProductIds(
      productIds,
      toDateOnlyStart(new Date()),
      client
    );
    const batchesByProductId = groupBatchesByProductId(batches);

    ensureEnoughSaleableStock(items, batchesByProductId);

    const allocatedItems = [];

    for (const item of items) {
      let remainingQuantity = item.quantity;
      let itemTotalCost = ZERO_DECIMAL;
      const consumptions: SaleInventoryConsumptionRecord[] = [];
      const productBatches = batchesByProductId.get(item.productId) ?? [];

      for (const batch of productBatches) {
        if (remainingQuantity.equals(0)) {
          break;
        }

        if (batch.remainingQuantity.lessThanOrEqualTo(0)) {
          continue;
        }

        const consumedQuantity = batch.remainingQuantity.lessThan(remainingQuantity)
          ? batch.remainingQuantity
          : remainingQuantity;
        const nextAvailableQuantity = batch.remainingQuantity.minus(consumedQuantity);
        const consumptionCost = toMoney(consumedQuantity.mul(batch.baseUnitCost));

        await this.salesRepository.updateBatchQuantity(batch.id, nextAvailableQuantity, client);

        const movement = await this.salesRepository.createSaleInventoryMovement(
          {
            actorUserId: input.actorUserId,
            batchId: batch.id,
            productId: item.productId,
            quantityBase: consumedQuantity.negated(),
            unitCostBase: batch.baseUnitCost,
            referenceId: input.saleId,
            referenceItemId: item.saleItemId,
            reason: "Sale confirmed"
          },
          client
        );

        const consumption = await this.salesRepository.createSaleItemBatch(
          {
            batchId: batch.id,
            inventoryMovementId: movement.id,
            quantity: consumedQuantity,
            saleItemId: item.saleItemId,
            totalCost: consumptionCost,
            unitCostBase: batch.baseUnitCost
          },
          client
        );

        batch.remainingQuantity = nextAvailableQuantity;
        remainingQuantity = remainingQuantity.minus(consumedQuantity);
        itemTotalCost = toMoney(itemTotalCost.add(consumptionCost));
        consumptions.push(consumption);
      }

      allocatedItems.push({
        saleItemId: item.saleItemId,
        productId: item.productId,
        requestedQuantity: item.quantity,
        totalCost: itemTotalCost,
        consumptions
      });
    }

    return {
      saleId: input.saleId,
      totalCost: toMoney(allocatedItems.reduce((total, item) => total.add(item.totalCost), ZERO_DECIMAL)),
      items: allocatedItems
    };
  }

  private getAuthenticatedUserId(context: AuditContext) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Authenticated user is required to create a sale.", "AUTHENTICATED_USER_REQUIRED");
    }

    return context.actorUserId;
  }

  private ensureActiveActor(actor: SaleActorRecord | null): asserts actor is SaleActorRecord {
    if (!actor) {
      throw new HttpError(401, "Authenticated user was not found.", "AUTHENTICATED_USER_NOT_FOUND");
    }

    if (actor.status !== "active") {
      throw new HttpError(403, "Authenticated user must be active.", "AUTHENTICATED_USER_NOT_ACTIVE");
    }
  }

  private ensureOwnOpenCashSession(
    cashSession: SaleCashSessionRecord | null,
    actorUserId: string
  ): asserts cashSession is SaleCashSessionRecord {
    if (!cashSession) {
      throw new HttpError(409, "User must have an open cash session to create a sale.", "SALE_CASH_SESSION_REQUIRED");
    }

    if (cashSession.openedByUserId !== actorUserId || cashSession.status !== "open" || cashSession.closedAt) {
      throw new HttpError(409, "Sale must use the authenticated user's open cash session.", "SALE_CASH_SESSION_INVALID");
    }
  }

  private async buildConfirmedSaleItems(
    items: Array<{ productId: string; quantity: number }>,
    client: SalesTransactionClient
  ): Promise<CreateConfirmedSaleItemData[]> {
    const productIds = Array.from(new Set(items.map((item) => item.productId)));
    const products = await this.salesRepository.findProductsByIds(productIds, client);
    const productsById = new Map(products.map((product) => [product.id, product]));

    return items.map((item) => {
      const product = productsById.get(item.productId);

      this.ensureSaleableProduct(product, item.productId);

      const unitPrice = toMoney(product.salePrice, "SALE_ITEM_PRICE_INVALID");
      const subtotal = toMoney(unitPrice.mul(item.quantity));

      return {
        productId: product.id,
        internalCode: product.internalCode,
        barcode: product.barcode,
        commercialName: product.commercialName,
        genericName: product.genericName,
        baseUnitId: product.baseUnitId,
        baseUnitName: product.baseUnit.name,
        baseUnitAbbreviation: product.baseUnit.abbreviation,
        unitPrice,
        quantity: item.quantity,
        subtotal,
        totalCost: ZERO_DECIMAL,
        margin: ZERO_DECIMAL
      };
    });
  }

  private ensureSaleableProduct(
    product: SaleProductRecord | undefined,
    productId: string
  ): asserts product is SaleProductRecord {
    if (!product) {
      throw new HttpError(400, "Sale item product was not found.", "SALE_ITEM_PRODUCT_NOT_FOUND", { productId });
    }

    if (product.status !== "active") {
      throw new HttpError(400, "Sale item product must be active.", "SALE_ITEM_PRODUCT_NOT_ACTIVE", { productId });
    }
  }

  private ensureCanReadSale(sale: SaleWithRelations, actorUserId: string, actorRoleName?: string) {
    if (sale.sellerUserId === actorUserId || actorRoleName === "admin" || actorRoleName === "superadmin") {
      return;
    }

    throw new HttpError(403, "Seller users can only read their own sales.", "SALE_ACCESS_FORBIDDEN", {
      saleId: sale.id
    });
  }

  private ensureCanCancelSale(sale: SaleWithRelations, actorUserId: string, actorRoleName?: string) {
    if (sale.status === "cancelled") {
      throw new HttpError(409, "Sale has already been cancelled.", "SALE_ALREADY_CANCELLED", { id: sale.id });
    }

    if (sale.status !== "confirmed") {
      throw new HttpError(409, "Sale status cannot be cancelled.", "SALE_NOT_CANCELABLE", {
        id: sale.id,
        status: sale.status
      });
    }

    if (sale.cashSession.status !== "open" || sale.cashSession.closedAt) {
      throw new HttpError(409, "Sale cannot be cancelled because its cash session is closed.", "SALE_CASH_SESSION_CLOSED", {
        saleId: sale.id,
        cashSessionId: sale.cashSessionId
      });
    }

    if (ADMIN_ROLE_NAMES.has(actorRoleName ?? "")) {
      return;
    }

    if (sale.sellerUserId !== actorUserId) {
      throw new HttpError(403, "Seller users can only cancel their own sales.", "SALE_CANCEL_FORBIDDEN", {
        saleId: sale.id
      });
    }

    if (!isSameUtcDate(sale.confirmedAt, new Date())) {
      throw new HttpError(403, "Seller users can only cancel current-day sales.", "SALE_CANCEL_NOT_CURRENT_DAY", {
        saleId: sale.id,
        confirmedAt: sale.confirmedAt.toISOString()
      });
    }
  }
}

function normalizeSaleItems(items: CreateSale["items"]) {
  if (items.length === 0) {
    throw new HttpError(400, "Sale must contain at least one item.", "SALE_ITEMS_REQUIRED");
  }

  return items.map((item) => ({
    productId: item.productId,
    quantity: Number(toSaleQuantity(item.quantity))
  }));
}

function sumSaleItemSubtotals(items: CreateConfirmedSaleItemData[]) {
  return toMoney(items.reduce((total, item) => total.add(item.subtotal), ZERO_DECIMAL));
}

function buildSaleCorrelativeCode(correlativeNumber: number) {
  return `${SALE_CORRELATIVE_PREFIX}-${correlativeNumber.toString().padStart(SALE_CORRELATIVE_DIGITS, "0")}`;
}

function buildConfirmedSaleAuditMetadata(sale: SaleWithRelations) {
  return {
    correlativeCode: sale.correlativeCode,
    cashSessionId: sale.cashSessionId,
    cashSessionCorrelativeCode: sale.cashSession.correlativeCode,
    sellerUserId: sale.sellerUserId,
    status: sale.status,
    totalAmount: Number(sale.totalAmount),
    totalCost: Number(sale.totalCost),
    totalMargin: Number(sale.totalMargin),
    receivedAmount: sale.payment ? Number(sale.payment.receivedAmount) : null,
    changeAmount: sale.payment ? Number(sale.payment.changeAmount) : null,
    itemCount: sale.items.length,
    confirmedAt: sale.confirmedAt.toISOString()
  };
}

function buildCancelledSaleAuditMetadata(sale: SaleWithRelations, cancelReason: string) {
  return {
    correlativeCode: sale.correlativeCode,
    cashSessionId: sale.cashSessionId,
    cashSessionCorrelativeCode: sale.cashSession.correlativeCode,
    sellerUserId: sale.sellerUserId,
    cancelledByUserId: sale.cancelledByUserId,
    cancelReason,
    status: sale.status,
    paymentStatus: sale.payment?.status ?? null,
    totalAmount: Number(sale.totalAmount),
    restoredConsumptions: sale.items.flatMap((item) =>
      item.consumptions.map((consumption) => ({
        saleItemId: item.id,
        productId: item.productId,
        batchId: consumption.batchId,
        quantity: Number(consumption.quantity),
        unitCostBase: Number(consumption.unitCostBase)
      }))
    ),
    cancelledAt: sale.cancelledAt?.toISOString()
  };
}

function toSale(sale: SaleWithRelations): Sale {
  return SaleSchema.parse(toSalePayload(sale));
}

function toCancelableSale(sale: SaleWithRelations, actorUserId: string, actorRoleName?: string): CancelableSale {
  return CancelableSaleSchema.parse({
    ...toSalePayload(sale),
    canCancel: getCanCancelSale(sale, actorUserId, actorRoleName),
    cancellationBlockedReason: getCancellationBlockedReason(sale, actorUserId, actorRoleName),
    cancelReason: sale.cancelReason ?? undefined,
    cancelledAt: sale.cancelledAt?.toISOString(),
    cancelledByUser: sale.cancelledByUser ? toSaleUser(sale.cancelledByUser) : undefined,
    cancelledByUserId: sale.cancelledByUserId ?? undefined,
    payment: {
      ...toPayment(sale),
      reversedAt: sale.payment?.reversedAt?.toISOString()
    },
    status: sale.status
  });
}

function toCancelableSaleSummary(
  sale: SaleWithRelations,
  actorUserId: string,
  actorRoleName?: string
): CancelableSaleSummary {
  const salePayload = toSalePayload(sale);

  return {
    id: salePayload.id,
    canCancel: getCanCancelSale(sale, actorUserId, actorRoleName),
    cancellationBlockedReason: getCancellationBlockedReason(sale, actorUserId, actorRoleName),
    cancelReason: sale.cancelReason ?? undefined,
    cancelledAt: sale.cancelledAt?.toISOString(),
    cashSessionCorrelativeCode: salePayload.cashSessionCorrelativeCode,
    cashSessionId: salePayload.cashSessionId,
    confirmedAt: salePayload.confirmedAt,
    correlativeCode: salePayload.correlativeCode,
    createdAt: salePayload.createdAt,
    sellerUser: salePayload.sellerUser,
    sellerUserId: salePayload.sellerUserId,
    status: sale.status,
    totalAmount: salePayload.totalAmount,
    totalMargin: salePayload.totalMargin,
    updatedAt: salePayload.updatedAt
  };
}

function toSalePayload(sale: SaleWithRelations) {
  if (!sale.payment) {
    throw new Error("Sale is missing its payment.");
  }

  return {
    id: sale.id,
    correlativeCode: sale.correlativeCode,
    sellerUserId: sale.sellerUserId,
    sellerUser: toSaleUser(sale.sellerUser),
    cashSessionId: sale.cashSessionId,
    cashSessionCorrelativeCode: sale.cashSession.correlativeCode,
    status: sale.status,
    items: sale.items.map(toSaleItem),
    payment: toPayment(sale),
    totalAmount: Number(sale.totalAmount),
    totalCost: Number(sale.totalCost),
    totalMargin: Number(sale.totalMargin),
    receipt: {
      saleId: sale.id,
      saleCorrelativeCode: sale.correlativeCode,
      cashSessionCorrelativeCode: sale.cashSession.correlativeCode,
      sellerName: sale.sellerUser.fullName,
      issuedAt: sale.confirmedAt.toISOString(),
      items: sale.items.map((item) => ({
        productName: item.commercialName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal)
      })),
      totalAmount: Number(sale.totalAmount),
      receivedAmount: Number(sale.payment.receivedAmount),
      changeAmount: Number(sale.payment.changeAmount)
    },
    confirmedAt: sale.confirmedAt.toISOString(),
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString()
  };
}

function toPayment(sale: SaleWithRelations) {
  if (!sale.payment) {
    throw new Error("Sale is missing its payment.");
  }

  return {
    id: sale.payment.id,
    saleId: sale.payment.saleId,
    cashSessionId: sale.payment.cashSessionId,
    method: sale.payment.method,
    saleTotal: Number(sale.payment.saleTotal),
    receivedAmount: Number(sale.payment.receivedAmount),
    changeAmount: Number(sale.payment.changeAmount),
    status: sale.payment.status,
    paidAt: sale.payment.paidAt.toISOString(),
    createdAt: sale.payment.createdAt.toISOString(),
    updatedAt: sale.payment.updatedAt.toISOString()
  };
}

function toSaleUser(user: SaleActorRecord) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email
  };
}

function getCanCancelSale(sale: SaleWithRelations, actorUserId: string, actorRoleName?: string) {
  return !getCancellationBlockedReason(sale, actorUserId, actorRoleName);
}

function getCancellationBlockedReason(sale: SaleWithRelations, actorUserId: string, actorRoleName?: string) {
  if (sale.status === "cancelled") {
    return "already-cancelled";
  }

  if (sale.cashSession.status !== "open" || sale.cashSession.closedAt) {
    return "cash-session-closed";
  }

  if (ADMIN_ROLE_NAMES.has(actorRoleName ?? "")) {
    return undefined;
  }

  if (sale.sellerUserId !== actorUserId) {
    return "forbidden";
  }

  if (!isSameUtcDate(sale.confirmedAt, new Date())) {
    return "not-current-day";
  }

  return undefined;
}

function toSaleItem(item: SaleWithRelations["items"][number]) {
  return {
    id: item.id,
    saleId: item.saleId,
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
    totalCost: Number(item.totalCost),
    margin: Number(item.margin),
    consumptions: item.consumptions.map((consumption) => ({
      id: consumption.id,
      saleItemId: consumption.saleItemId,
      batchId: consumption.batchId,
      batchNumber: consumption.batch.batchNumber ?? undefined,
      expirationDate: consumption.batch.expirationDate ? toDateOnly(consumption.batch.expirationDate) : undefined,
      quantity: Number(consumption.quantity),
      unitCost: Number(consumption.unitCostBase),
      totalCost: Number(consumption.totalCost),
      inventoryMovementId: consumption.inventoryMovementId ?? undefined
    })),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  };
}

function ensureEnoughSaleableStock(
  items: Array<{ productId: string; quantity: Prisma.Decimal }>,
  batchesByProductId: Map<string, MutableSaleFefoBatch[]>
) {
  const requestedByProductId = new Map<string, Prisma.Decimal>();

  for (const item of items) {
    requestedByProductId.set(item.productId, (requestedByProductId.get(item.productId) ?? ZERO_DECIMAL).add(item.quantity));
  }

  for (const [productId, requestedQuantity] of requestedByProductId) {
    const availableQuantity = (batchesByProductId.get(productId) ?? []).reduce(
      (total, batch) => total.add(batch.remainingQuantity),
      ZERO_DECIMAL
    );

    if (availableQuantity.lessThan(requestedQuantity)) {
      throw new HttpError(409, "Saleable stock is not enough for the requested item.", "SALE_STOCK_INSUFFICIENT", {
        productId,
        requestedQuantity: Number(requestedQuantity),
        availableQuantity: Number(availableQuantity)
      });
    }
  }
}

function groupBatchesByProductId(batches: SaleFefoBatchRecord[]) {
  const batchesByProductId = new Map<string, MutableSaleFefoBatch[]>();

  for (const batch of batches) {
    const productBatches = batchesByProductId.get(batch.productId) ?? [];

    productBatches.push({
      ...batch,
      remainingQuantity: batch.availableQuantity
    });
    batchesByProductId.set(batch.productId, productBatches);
  }

  return batchesByProductId;
}

function toSaleQuantity(value: Prisma.Decimal.Value) {
  const quantity = new Prisma.Decimal(value);

  if (!quantity.isFinite() || quantity.lessThanOrEqualTo(0) || !quantity.isInteger()) {
    throw new HttpError(400, "Sale item quantity must be a positive integer.", "SALE_ITEM_QUANTITY_INVALID");
  }

  return quantity;
}

function toMoney(value: Prisma.Decimal.Value, errorCode?: string) {
  const amount = new Prisma.Decimal(value);

  if (!amount.isFinite() || (errorCode && (amount.lessThan(0) || !hasMaxDecimalPlaces(amount, 2)))) {
    throw new HttpError(400, "Sale amounts must be zero or greater with at most 2 decimal places.", errorCode ?? "SALE_AMOUNT_INVALID");
  }

  return amount.toDecimalPlaces(2);
}

function hasMaxDecimalPlaces(value: Prisma.Decimal, places: number) {
  const [, decimals = ""] = value.toString().split(".");

  return decimals.length <= places;
}

function toDateOnlyStart(value: Date) {
  return new Date(`${toDateOnly(value)}T00:00:00.000Z`);
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function isSameUtcDate(left: Date, right: Date) {
  return toDateOnly(left) === toDateOnly(right);
}
