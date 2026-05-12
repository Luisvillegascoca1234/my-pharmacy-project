import { Prisma } from "@prisma/client";
import type {
  CancelPurchase,
  CreatePurchase,
  Purchase,
  PurchaseItemInput,
  PurchaseSummary,
  PurchasesListResponse,
  PurchasesQuery,
  ReceivePurchase,
  UpdatePurchase
} from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { InventoryService, type InventoryServicePort } from "../inventory/inventory.service.js";
import { PurchasesRepository } from "./purchases.repository.js";
import type {
  AuditContext,
  ProductWithPurchaseRelations,
  PurchaseDraftData,
  PurchaseDraftItemData,
  PurchaseDraftUpdateData,
  PurchasesListFilters,
  PurchasesListResult,
  PurchaseSummaryRecord,
  PurchaseWithRelations,
  SupplierRecord,
  UserRecord
} from "./purchases.types.js";

const ZERO_MONEY = new Prisma.Decimal(0);

export type PurchasesRepositoryPort = {
  runInTransaction<T>(callback: (client: Prisma.TransactionClient) => Promise<T>): Promise<T>;
  listPurchases(filters: PurchasesListFilters): Promise<PurchasesListResult>;
  getPurchase(id: string, client?: Prisma.TransactionClient): Promise<PurchaseWithRelations | null>;
  findSupplierById(id: string, client?: Prisma.TransactionClient): Promise<SupplierRecord | null>;
  findUserById(id: string, client?: Prisma.TransactionClient): Promise<UserRecord | null>;
  findProductById(id: string, client?: Prisma.TransactionClient): Promise<ProductWithPurchaseRelations | null>;
  createDraftPurchase(
    input: PurchaseDraftData,
    items: PurchaseDraftItemData[],
    context: AuditContext
  ): Promise<PurchaseWithRelations>;
  replaceDraftPurchase(
    id: string,
    input: PurchaseDraftUpdateData,
    items: PurchaseDraftItemData[],
    context: AuditContext
  ): Promise<PurchaseWithRelations>;
  markPurchaseReceived(
    id: string,
    input: {
      receivedByUserId: string;
      receivedAt: Date;
      receiveNotes: string | null;
    },
    client?: Prisma.TransactionClient
  ): Promise<PurchaseWithRelations>;
  markPurchaseCancelled(
    id: string,
    input: {
      cancelledAt: Date;
      cancelReason: string;
    },
    client?: Prisma.TransactionClient
  ): Promise<PurchaseWithRelations>;
  createAuditLog(
    action: string,
    entityId: string,
    metadata: unknown,
    context: AuditContext,
    client?: Prisma.TransactionClient
  ): Promise<unknown>;
};

export class PurchasesService {
  constructor(
    private readonly purchasesRepository: PurchasesRepositoryPort = new PurchasesRepository(),
    private readonly inventoryService: InventoryServicePort = new InventoryService()
  ) {}

  async listPurchases(query: PurchasesQuery): Promise<PurchasesListResponse> {
    const page = query.page;
    const pageSize = query.pageSize;
    const result = await this.purchasesRepository.listPurchases({
      search: query.search,
      status: query.status,
      supplierId: query.supplierId,
      fromDate: query.fromDate,
      toDate: query.toDate,
      page,
      pageSize
    });

    return {
      data: result.data.map(toPurchaseSummary),
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize)
      }
    };
  }

  async getPurchase(id: string): Promise<Purchase> {
    const purchase = await this.purchasesRepository.getPurchase(id);

    if (!purchase) {
      throw new HttpError(404, "Purchase was not found.", "PURCHASE_NOT_FOUND");
    }

    return toPurchase(purchase);
  }

  async createPurchase(input: CreatePurchase, context: AuditContext): Promise<Purchase> {
    const createdByUserId = this.getAuthenticatedUserId(context);
    const [supplier, createdByUser] = await Promise.all([
      this.purchasesRepository.findSupplierById(input.supplierId),
      this.purchasesRepository.findUserById(createdByUserId)
    ]);

    this.ensureActiveSupplier(supplier);
    this.ensureValidActor(createdByUser);

    const normalizedInput = normalizePurchaseInput(input);
    const items = await this.buildDraftItems(input.items);
    const totalAmount = sumLineTotals(items);

    const purchase = await this.purchasesRepository.createDraftPurchase(
      {
        supplierId: normalizedInput.supplierId,
        purchaseDate: normalizedInput.purchaseDate,
        totalAmount,
        createdByUserId,
        notes: normalizedInput.notes
      },
      items,
      context
    );

    return toPurchase(purchase);
  }

  async updatePurchase(id: string, input: UpdatePurchase, context: AuditContext): Promise<Purchase> {
    const currentPurchase = await this.purchasesRepository.getPurchase(id);

    if (!currentPurchase) {
      throw new HttpError(404, "Purchase was not found.", "PURCHASE_NOT_FOUND");
    }

    if (currentPurchase.status !== "draft") {
      throw new HttpError(409, "Only draft purchases can be updated.", "PURCHASE_NOT_DRAFT");
    }

    const supplier = await this.purchasesRepository.findSupplierById(input.supplierId);
    this.ensureActiveSupplier(supplier);

    const normalizedInput = normalizePurchaseInput(input);
    const items = await this.buildDraftItems(input.items);
    const totalAmount = sumLineTotals(items);

    const purchase = await this.purchasesRepository.replaceDraftPurchase(
      id,
      {
        supplierId: normalizedInput.supplierId,
        purchaseDate: normalizedInput.purchaseDate,
        totalAmount,
        notes: normalizedInput.notes
      },
      items,
      context
    );

    return toPurchase(purchase);
  }

  async receivePurchase(id: string, input: ReceivePurchase, context: AuditContext): Promise<Purchase> {
    const receivedByUserId = this.getAuthenticatedUserId(context, "receive a purchase");
    const receiveNotes = normalizeOptionalText(input.receiveNotes) ?? null;

    const purchase = await this.purchasesRepository.runInTransaction(async (tx) => {
      const currentPurchase = await this.purchasesRepository.getPurchase(id, tx);

      if (!currentPurchase) {
        throw new HttpError(404, "Purchase was not found.", "PURCHASE_NOT_FOUND");
      }

      if (currentPurchase.status !== "draft") {
        throw new HttpError(409, "Only draft purchases can be received.", "PURCHASE_NOT_DRAFT");
      }

      const [supplier, receivedByUser] = await Promise.all([
        this.purchasesRepository.findSupplierById(currentPurchase.supplierId, tx),
        this.purchasesRepository.findUserById(receivedByUserId, tx)
      ]);

      this.ensureActiveSupplier(supplier);
      this.ensureValidActor(receivedByUser);
      await this.ensurePurchaseItemsCanBeReceived(currentPurchase, tx);

      await this.inventoryService.createPurchaseReceiptLayers(
        {
          purchaseId: currentPurchase.id,
          actorUserId: receivedByUserId,
          items: currentPurchase.items
        },
        tx
      );

      const receivedPurchase = await this.purchasesRepository.markPurchaseReceived(
        currentPurchase.id,
        {
          receivedByUserId,
          receivedAt: new Date(),
          receiveNotes
        },
        tx
      );

      await this.purchasesRepository.createAuditLog(
        "PURCHASE_RECEIVED",
        receivedPurchase.id,
        buildReceiveAuditMetadata(receivedPurchase),
        context,
        tx
      );

      return receivedPurchase;
    });

    return toPurchase(purchase);
  }

  async cancelPurchase(id: string, input: CancelPurchase, context: AuditContext): Promise<Purchase> {
    const actorUserId = this.getAuthenticatedUserId(context, "cancel a purchase");
    const cancelReason = normalizeRequiredText(input.cancelReason);

    const purchase = await this.purchasesRepository.runInTransaction(async (tx) => {
      const currentPurchase = await this.purchasesRepository.getPurchase(id, tx);

      if (!currentPurchase) {
        throw new HttpError(404, "Purchase was not found.", "PURCHASE_NOT_FOUND");
      }

      if (currentPurchase.status === "cancelled") {
        throw new HttpError(409, "Purchase is already cancelled.", "PURCHASE_ALREADY_CANCELLED");
      }

      this.ensureValidActor(await this.purchasesRepository.findUserById(actorUserId, tx));

      if (currentPurchase.status === "received") {
        await this.inventoryService.cancelPurchaseReceiptLayers(
          {
            purchaseId: currentPurchase.id,
            actorUserId,
            items: currentPurchase.items
          },
          tx
        );
      } else if (currentPurchase.status !== "draft") {
        throw new HttpError(409, "Purchase cannot be cancelled from its current status.", "PURCHASE_STATUS_INVALID");
      }

      const cancelledPurchase = await this.purchasesRepository.markPurchaseCancelled(
        currentPurchase.id,
        {
          cancelledAt: new Date(),
          cancelReason
        },
        tx
      );

      await this.purchasesRepository.createAuditLog(
        "PURCHASE_CANCELLED",
        cancelledPurchase.id,
        buildCancelAuditMetadata(cancelledPurchase),
        context,
        tx
      );

      return cancelledPurchase;
    });

    return toPurchase(purchase);
  }

  private getAuthenticatedUserId(context: AuditContext, action = "create a purchase") {
    if (!context.actorUserId) {
      throw new HttpError(401, `Authenticated user is required to ${action}.`, "AUTHENTICATED_USER_REQUIRED");
    }

    return context.actorUserId;
  }

  private ensureValidActor(user: UserRecord | null) {
    if (!user) {
      throw new HttpError(400, "Authenticated user was not found.", "AUTHENTICATED_USER_NOT_FOUND");
    }
  }

  private ensureActiveSupplier(supplier: SupplierRecord | null) {
    if (!supplier) {
      throw new HttpError(400, "Supplier does not exist.", "SUPPLIER_NOT_FOUND");
    }

    if (supplier.status !== "active") {
      throw new HttpError(400, "Supplier must be active.", "SUPPLIER_NOT_ACTIVE");
    }
  }

  private async buildDraftItems(items: PurchaseItemInput[]): Promise<PurchaseDraftItemData[]> {
    if (items.length === 0) {
      throw new HttpError(400, "Purchase must contain at least one item.", "PURCHASE_ITEMS_REQUIRED");
    }

    const duplicates = new Set<string>();
    const draftItems: PurchaseDraftItemData[] = [];

    for (const item of items) {
      const purchaseItemReferences = this.ensurePurchasableProductUnit(
        await this.purchasesRepository.findProductById(item.productId),
        item.unitId
      );
      const normalizedItem = buildDraftItem(item, purchaseItemReferences.product, purchaseItemReferences.productUnit);
      const duplicateKey = buildDuplicateKey(normalizedItem);

      if (duplicates.has(duplicateKey)) {
        throw new HttpError(409, "Purchase items cannot contain equivalent duplicates.", "DUPLICATED_PURCHASE_ITEM");
      }

      duplicates.add(duplicateKey);
      draftItems.push(normalizedItem);
    }

    return draftItems;
  }

  private ensurePurchasableProductUnit(product: ProductWithPurchaseRelations | null, unitId: string) {
    if (!product) {
      throw new HttpError(400, "Product does not exist.", "PRODUCT_NOT_FOUND");
    }

    if (product.status !== "active") {
      throw new HttpError(400, "Product must be active.", "PRODUCT_NOT_ACTIVE");
    }

    const productUnit = product.units.find((unit) => unit.unitId === unitId);

    if (!productUnit) {
      throw new HttpError(400, "Unit is not configured for the product.", "PRODUCT_UNIT_NOT_CONFIGURED");
    }

    return { product, productUnit };
  }

  private async ensurePurchaseItemsCanBeReceived(
    purchase: PurchaseWithRelations,
    client: Prisma.TransactionClient
  ) {
    if (purchase.items.length === 0) {
      throw new HttpError(400, "Purchase must contain at least one item.", "PURCHASE_ITEMS_REQUIRED");
    }

    for (const item of purchase.items) {
      this.ensurePurchasableProductUnit(await this.purchasesRepository.findProductById(item.productId, client), item.unitId);

      if (!item.isInventoryTracked) {
        continue;
      }

      if (!normalizeBatchNumber(item.batchNumber ?? undefined)) {
        throw new HttpError(400, "Inventory tracked purchase items require a batch number.", "PURCHASE_BATCH_REQUIRED");
      }

      if (!item.expirationDate) {
        throw new HttpError(400, "Inventory tracked purchase items require an expiration date.", "PURCHASE_EXPIRATION_REQUIRED");
      }

      if (toDateOnly(item.expirationDate) < getServerTodayDateOnly()) {
        throw new HttpError(400, "Purchase item expiration date cannot be in the past.", "PURCHASE_EXPIRATION_EXPIRED");
      }
    }
  }
}

function normalizePurchaseInput(input: CreatePurchase | UpdatePurchase) {
  return {
    supplierId: input.supplierId,
    purchaseDate: toPureDate(input.purchaseDate, "PURCHASE_DATE_INVALID"),
    notes: normalizeOptionalText(input.notes) ?? null
  };
}

function buildDraftItem(
  item: PurchaseItemInput,
  product: ProductWithPurchaseRelations,
  productUnit: ProductWithPurchaseRelations["units"][number]
): PurchaseDraftItemData {
  const quantity = toQuantity(item.quantity);
  const unitCost = toUnitCost(item.unitCost);
  const conversionFactor = toDecimal4(productUnit.conversionFactor);
  const baseQuantity = toDecimal4(quantity.mul(conversionFactor));
  const baseUnitCost = toDecimal4(unitCost.div(conversionFactor));
  const lineTotal = toMoney(quantity.mul(unitCost));
  const batchNumber = product.isInventoryTracked ? normalizeBatchNumber(item.batchNumber) : null;
  const expirationDate =
    product.isInventoryTracked && item.expirationDate ? toPureDate(item.expirationDate, "PURCHASE_EXPIRATION_DATE_INVALID") : null;

  return {
    productId: item.productId,
    unitId: item.unitId,
    quantity,
    unitCost,
    conversionFactor,
    baseQuantity,
    baseUnitCost,
    lineTotal,
    isInventoryTracked: product.isInventoryTracked,
    batchNumber,
    expirationDate
  };
}

function buildDuplicateKey(item: PurchaseDraftItemData) {
  return [
    item.productId,
    item.batchNumber ?? "",
    item.expirationDate ? toDateOnly(item.expirationDate) : ""
  ].join("|");
}

function sumLineTotals(items: PurchaseDraftItemData[]) {
  return toMoney(items.reduce((total, item) => total.add(item.lineTotal), ZERO_MONEY));
}

function buildReceiveAuditMetadata(purchase: PurchaseWithRelations) {
  return {
    supplierId: purchase.supplierId,
    status: purchase.status,
    receivedByUserId: purchase.receivedByUserId,
    receivedAt: purchase.receivedAt?.toISOString(),
    receiveNotes: purchase.receiveNotes,
    totalAmount: Number(purchase.totalAmount),
    itemCount: purchase.items.length
  };
}

function buildCancelAuditMetadata(purchase: PurchaseWithRelations) {
  return {
    supplierId: purchase.supplierId,
    status: purchase.status,
    cancelledAt: purchase.cancelledAt?.toISOString(),
    cancelReason: purchase.cancelReason,
    totalAmount: Number(purchase.totalAmount),
    itemCount: purchase.items.length
  };
}

function toPurchase(purchase: PurchaseWithRelations): Purchase {
  return {
    ...toPurchaseSummary(purchase),
    createdByUser: toPurchaseUser(purchase.createdByUser),
    receivedByUser: purchase.receivedByUser ? toPurchaseUser(purchase.receivedByUser) : undefined,
    items: purchase.items.map((item) => ({
      id: item.id,
      purchaseId: item.purchaseId,
      productId: item.productId,
      productName: item.product.commercialName,
      unitId: item.unitId,
      unitName: item.unit.name,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      conversionFactor: Number(item.conversionFactor),
      baseQuantity: Number(item.baseQuantity),
      baseUnitCost: Number(item.baseUnitCost),
      lineTotal: Number(item.lineTotal),
      isInventoryTracked: item.isInventoryTracked,
      batchNumber: item.batchNumber ?? undefined,
      expirationDate: item.expirationDate ? toDateOnly(item.expirationDate) : undefined,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }))
  };
}

function toPurchaseSummary(purchase: PurchaseSummaryRecord): PurchaseSummary {
  return {
    id: purchase.id,
    supplierId: purchase.supplierId,
    supplier: {
      id: purchase.supplier.id,
      businessName: purchase.supplier.businessName,
      nit: purchase.supplier.nit ?? undefined,
      status: purchase.supplier.status
    },
    purchaseDate: toDateOnly(purchase.purchaseDate),
    status: purchase.status,
    totalAmount: Number(purchase.totalAmount),
    createdByUserId: purchase.createdByUserId,
    receivedByUserId: purchase.receivedByUserId ?? undefined,
    receivedAt: purchase.receivedAt?.toISOString(),
    cancelledAt: purchase.cancelledAt?.toISOString(),
    notes: purchase.notes ?? undefined,
    receiveNotes: purchase.receiveNotes ?? undefined,
    cancelReason: purchase.cancelReason ?? undefined,
    createdAt: purchase.createdAt.toISOString(),
    updatedAt: purchase.updatedAt.toISOString()
  };
}

function toPurchaseUser(user: UserRecord) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email
  };
}

function normalizeBatchNumber(value?: string) {
  const normalizedValue = normalizeOptionalText(value)?.toUpperCase();

  if (normalizedValue && normalizedValue.length > 80) {
    throw new HttpError(400, "Batch number must have at most 80 characters.", "PURCHASE_BATCH_NUMBER_INVALID");
  }

  return normalizedValue ?? null;
}

function normalizeOptionalText(value?: string) {
  const normalizedValue = value?.trim();

  return normalizedValue || undefined;
}

function normalizeRequiredText(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new HttpError(400, "Cancel reason is required.", "PURCHASE_CANCEL_REASON_REQUIRED");
  }

  return normalizedValue;
}

function toMoney(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

function toQuantity(value: Prisma.Decimal.Value) {
  const quantity = new Prisma.Decimal(value);

  if (!quantity.isFinite() || quantity.lte(0) || !hasMaxDecimalPlaces(quantity, 4)) {
    throw new HttpError(400, "Purchase item quantity must be greater than zero with at most 4 decimal places.", "PURCHASE_QUANTITY_INVALID");
  }

  return toDecimal4(quantity);
}

function toUnitCost(value: Prisma.Decimal.Value) {
  const unitCost = new Prisma.Decimal(value);

  if (!unitCost.isFinite() || unitCost.lt(0) || !hasMaxDecimalPlaces(unitCost, 2)) {
    throw new HttpError(400, "Purchase item unit cost must be zero or greater with at most 2 decimal places.", "PURCHASE_UNIT_COST_INVALID");
  }

  return toMoney(unitCost);
}

function toDecimal4(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value).toDecimalPlaces(4);
}

function toPureDate(value: string, errorCode = "PURCHASE_DATE_INVALID") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, "Purchase dates must use YYYY-MM-DD format.", errorCode);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || toDateOnly(date) !== value) {
    throw new HttpError(400, "Purchase dates must be valid calendar dates.", errorCode);
  }

  return date;
}

function hasMaxDecimalPlaces(value: Prisma.Decimal, places: number) {
  const [, decimals = ""] = value.toString().split(".");

  return decimals.length <= places;
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getServerTodayDateOnly() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}
