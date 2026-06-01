import { Prisma } from "@prisma/client";
import {
  PendingCartSchema,
  PendingCartsListResponseSchema,
  type ConvertPendingCart,
  type DiscardPendingCart,
  type EditPendingCart,
  type PendingCart,
  type PendingCartItem,
  type PendingCartItemInput,
  type PendingCartRevalidationIssue,
  type PendingCartsListResponse,
  type PendingCartsQuery,
  type SavePendingCart,
  type Sale
} from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { SalesService } from "../sales/sales.service.js";
import { PendingCartsRepository } from "./pending-carts.repository.js";
import type {
  PendingCartItemSnapshotData,
  PendingCartProductRecord,
  PendingCartRecord,
  PendingCartsTransactionClient
} from "./pending-carts.types.js";

const ZERO_DECIMAL = new Prisma.Decimal(0);
const PENDING_CART_EXPIRATION_DAYS = 3;

type PendingCartContext = {
  actorRoleName?: string;
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type PendingCartSnapshot = {
  cart: PendingCartRecord;
  productsById: Map<string, PendingCartProductRecord>;
};

export class PendingCartsService {
  constructor(
    private readonly pendingCartsRepository = new PendingCartsRepository(),
    private readonly salesService = new SalesService()
  ) {}

  async listPendingCarts(query: PendingCartsQuery, context: PendingCartContext): Promise<PendingCartsListResponse> {
    const actorUserId = this.getAuthenticatedUserId(context);
    const includeAll = isAdminRole(context.actorRoleName) ? query.includeAll ?? true : Boolean(query.includeAll);

    this.ensureCanList(includeAll, context.actorRoleName);

    const now = new Date();
    await this.pendingCartsRepository.expireActiveCarts(now);

    const result = await this.pendingCartsRepository.list({
      includeAll,
      ownerUserId: actorUserId,
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      sellerUserId: query.sellerUserId,
      status: query.status
    });
    const productsById = await this.getProductsByCartRecords(result.data, now);

    return PendingCartsListResponseSchema.parse({
      data: result.data.map((cart) => toPendingCart(cart, productsById, now)),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / query.pageSize)
      }
    });
  }

  async createPendingCart(input: SavePendingCart, context: PendingCartContext): Promise<PendingCart> {
    const actorUserId = this.getAuthenticatedUserId(context);
    const now = new Date();

    return this.pendingCartsRepository.runInTransaction(async (tx) => {
      const snapshotItems = await this.buildSnapshotItems(input.items, tx);
      const cart = await this.pendingCartsRepository.createCart(
        {
          ownerUserId: actorUserId,
          name: input.name,
          note: input.note,
          referenceTotalAmount: sumReferenceTotal(snapshotItems),
          expiresAt: addDays(now, PENDING_CART_EXPIRATION_DAYS)
        },
        snapshotItems,
        tx
      );

      await this.pendingCartsRepository.createAuditLog(
        "PENDING_CART_CREATED",
        cart.id,
        actorUserId,
        buildPendingCartAuditMetadata(cart),
        context,
        tx
      );

      return this.hydrateCart(cart, now, tx);
    });
  }

  async updatePendingCart(id: string, input: EditPendingCart, context: PendingCartContext): Promise<PendingCart> {
    const actorUserId = this.getAuthenticatedUserId(context);
    const now = new Date();

    return this.pendingCartsRepository.runInTransaction(async (tx) => {
      const cart = await this.getCartForMutation(id, now, tx);

      this.ensureOwnPendingCart(cart, actorUserId, "PENDING_CART_ACCESS_FORBIDDEN");
      this.ensureEditable(cart);

      const snapshotItems = await this.buildSnapshotItems(input.items, tx);
      const updatedCart = await this.pendingCartsRepository.replaceCartItems(
        cart.id,
        {
          name: input.name ?? null,
          note: input.note ?? null,
          referenceTotalAmount: sumReferenceTotal(snapshotItems)
        },
        snapshotItems,
        tx
      );

      await this.pendingCartsRepository.createAuditLog(
        "PENDING_CART_UPDATED",
        updatedCart.id,
        actorUserId,
        buildPendingCartAuditMetadata(updatedCart),
        context,
        tx
      );

      return this.hydrateCart(updatedCart, now, tx);
    });
  }

  async discardPendingCart(id: string, input: DiscardPendingCart, context: PendingCartContext): Promise<PendingCart> {
    const actorUserId = this.getAuthenticatedUserId(context);
    const now = new Date();

    return this.pendingCartsRepository.runInTransaction(async (tx) => {
      const cart = await this.getCartForMutation(id, now, tx);

      this.ensureCanDiscard(cart, actorUserId, context.actorRoleName);

      const discardedCart = await this.pendingCartsRepository.discardCart(cart.id, input.discardReason, now, tx);

      await this.pendingCartsRepository.createAuditLog(
        "PENDING_CART_DISCARDED",
        discardedCart.id,
        actorUserId,
        buildPendingCartAuditMetadata(discardedCart),
        context,
        tx
      );

      return this.hydrateCart(discardedCart, now, tx);
    });
  }

  async convertPendingCart(id: string, input: ConvertPendingCart, context: PendingCartContext): Promise<PendingCart> {
    const actorUserId = this.getAuthenticatedUserId(context);
    const now = new Date();

    return this.pendingCartsRepository.runInTransaction(async (tx) => {
      const cart = await this.getCartForMutation(id, now, tx);

      this.ensureOwnPendingCart(cart, actorUserId, "PENDING_CART_CONVERT_FORBIDDEN");
      this.ensureConvertible(cart);

      const snapshot = await this.getCurrentSnapshot(cart, now, tx);
      const issues = collectRevalidationIssues(cart, snapshot.productsById);

      if (issues.length > 0) {
        throw buildRevalidationError(issues);
      }

      const sale = await this.salesService.createSaleInTransaction(
        {
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity
          })),
          payment: input.payment
        },
        context,
        tx
      );
      const convertedCart = await this.pendingCartsRepository.convertCart(cart.id, sale.id, now, tx);

      await this.pendingCartsRepository.createAuditLog(
        "PENDING_CART_CONVERTED",
        convertedCart.id,
        actorUserId,
        {
          ...buildPendingCartAuditMetadata(convertedCart),
          convertedSaleId: sale.id
        },
        context,
        tx
      );

      return toPendingCart(convertedCart, snapshot.productsById, now, sale);
    });
  }

  private async getCartForMutation(id: string, now: Date, tx: PendingCartsTransactionClient) {
    const cart = await this.pendingCartsRepository.findById(id, tx);

    if (!cart) {
      throw new HttpError(404, "Pending cart was not found.", "PENDING_CART_NOT_FOUND", { id });
    }

    if (cart.status === "active" && cart.expiresAt.getTime() <= now.getTime()) {
      return this.pendingCartsRepository.markExpired(cart.id, now, tx);
    }

    return cart;
  }

  private async buildSnapshotItems(items: PendingCartItemInput[], tx: PendingCartsTransactionClient) {
    const normalizedItems = normalizePendingCartItems(items);
    const products = await this.pendingCartsRepository.findProductsByIds(
      normalizedItems.map((item) => item.productId),
      toDateOnlyStart(new Date()),
      tx
    );
    const productsById = new Map(products.map((product) => [product.id, product]));

    return normalizedItems.map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new HttpError(400, "Pending cart item product was not found.", "PENDING_CART_ITEM_PRODUCT_NOT_FOUND", {
          productId: item.productId
        });
      }

      if (product.status !== "active") {
        throw new HttpError(400, "Pending cart item product must be active.", "PENDING_CART_ITEM_PRODUCT_NOT_ACTIVE", {
          productId: item.productId
        });
      }

      const referenceUnitPrice = toMoney(product.salePrice);

      return {
        productId: product.id,
        internalCode: product.internalCode,
        barcode: product.barcode,
        commercialName: product.commercialName,
        genericName: product.genericName,
        baseUnitId: product.baseUnitId,
        baseUnitName: product.baseUnit.name,
        baseUnitAbbreviation: product.baseUnit.abbreviation,
        referenceUnitPrice,
        quantity: item.quantity,
        referenceSubtotal: toMoney(referenceUnitPrice.mul(item.quantity))
      } satisfies PendingCartItemSnapshotData;
    });
  }

  private async hydrateCart(
    cart: PendingCartRecord,
    now: Date,
    tx: PendingCartsTransactionClient,
    convertedSale?: Sale
  ) {
    const snapshot = await this.getCurrentSnapshot(cart, now, tx);

    return toPendingCart(snapshot.cart, snapshot.productsById, now, convertedSale);
  }

  private async getCurrentSnapshot(
    cart: PendingCartRecord,
    now: Date,
    tx: PendingCartsTransactionClient
  ): Promise<PendingCartSnapshot> {
    const products = await this.pendingCartsRepository.findProductsByIds(getProductIds([cart]), toDateOnlyStart(now), tx);

    return {
      cart,
      productsById: new Map(products.map((product) => [product.id, product]))
    };
  }

  private async getProductsByCartRecords(carts: PendingCartRecord[], now: Date) {
    const productIds = getProductIds(carts);
    const products = productIds.length > 0 ? await this.pendingCartsRepository.findProductsByIds(productIds, toDateOnlyStart(now)) : [];

    return new Map(products.map((product) => [product.id, product]));
  }

  private getAuthenticatedUserId(context: PendingCartContext) {
    if (!context.actorUserId) {
      throw new HttpError(401, "Authenticated user is required to use pending carts.", "AUTHENTICATED_USER_REQUIRED");
    }

    return context.actorUserId;
  }

  private ensureCanList(includeAll: boolean, actorRoleName?: string) {
    if (!includeAll || isAdminRole(actorRoleName)) {
      return;
    }

    throw new HttpError(403, "Only admin users can list all pending carts.", "PENDING_CART_ACCESS_FORBIDDEN");
  }

  private ensureOwnPendingCart(cart: PendingCartRecord, actorUserId: string, code: string) {
    if (cart.ownerUserId === actorUserId) {
      return;
    }

    throw new HttpError(403, "Pending cart belongs to another seller.", code, { id: cart.id });
  }

  private ensureCanDiscard(cart: PendingCartRecord, actorUserId: string, actorRoleName?: string) {
    if (cart.ownerUserId === actorUserId || isAdminRole(actorRoleName)) {
      if (cart.status === "active" || cart.status === "expired") {
        return;
      }

      throw new HttpError(409, "Only active or expired pending carts can be discarded.", "PENDING_CART_NOT_DISCARDABLE", {
        id: cart.id,
        status: cart.status
      });
    }

    throw new HttpError(403, "Pending cart belongs to another seller.", "PENDING_CART_DISCARD_FORBIDDEN", { id: cart.id });
  }

  private ensureEditable(cart: PendingCartRecord) {
    if (cart.status === "active") {
      return;
    }

    if (cart.status === "expired") {
      throw new HttpError(409, "Expired pending carts cannot be edited.", "PENDING_CART_EXPIRED", { id: cart.id });
    }

    throw new HttpError(409, "Pending cart cannot be edited in its current status.", "PENDING_CART_NOT_EDITABLE", {
      id: cart.id,
      status: cart.status
    });
  }

  private ensureConvertible(cart: PendingCartRecord) {
    if (cart.status === "active") {
      return;
    }

    if (cart.status === "expired") {
      throw new HttpError(409, "Expired pending carts cannot be converted.", "PENDING_CART_EXPIRED", { id: cart.id });
    }

    throw new HttpError(409, "Pending cart cannot be converted in its current status.", "PENDING_CART_NOT_CONVERTIBLE", {
      id: cart.id,
      status: cart.status
    });
  }
}

function normalizePendingCartItems(items: PendingCartItemInput[]) {
  const quantitiesByProductId = new Map<string, number>();

  for (const item of items) {
    quantitiesByProductId.set(item.productId, (quantitiesByProductId.get(item.productId) ?? 0) + item.quantity);
  }

  return Array.from(quantitiesByProductId.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

function toPendingCart(
  cart: PendingCartRecord,
  productsById: Map<string, PendingCartProductRecord>,
  now: Date,
  convertedSale?: Sale
): PendingCart {
  const issues = collectRevalidationIssues(cart, productsById);
  const currentTotalAmount = sumCurrentTotal(cart, productsById);

  return PendingCartSchema.parse({
    id: cart.id,
    convertedAt: cart.convertedAt?.toISOString(),
    convertedSale,
    convertedSaleId: cart.convertedSaleId ?? undefined,
    createdAt: cart.createdAt.toISOString(),
    currentTotalAmount: Number(currentTotalAmount),
    discardReason: cart.discardReason ?? undefined,
    discardedAt: cart.discardedAt?.toISOString(),
    expiredAt: cart.expiredAt?.toISOString(),
    expiresAt: cart.expiresAt.toISOString(),
    items: cart.items.map((item) => toPendingCartItem(item, productsById)),
    name: cart.name ?? undefined,
    note: cart.note ?? undefined,
    ownerUser: {
      id: cart.ownerUser.id,
      fullName: cart.ownerUser.fullName,
      email: cart.ownerUser.email
    },
    ownerUserId: cart.ownerUserId,
    referenceTotalAmount: Number(cart.referenceTotalAmount),
    revalidationIssues: issues,
    status: cart.status === "active" && cart.expiresAt.getTime() <= now.getTime() ? "expired" : cart.status,
    updatedAt: cart.updatedAt.toISOString()
  });
}

function toPendingCartItem(
  item: PendingCartRecord["items"][number],
  productsById: Map<string, PendingCartProductRecord>
): PendingCartItem {
  const product = productsById.get(item.productId);
  const currentUnitPrice = product ? toMoney(product.salePrice) : undefined;
  const saleableStock = product ? getSaleableStock(product) : undefined;

  return {
    barcode: item.barcode ?? undefined,
    baseUnit: {
      id: item.baseUnitId,
      name: item.baseUnitName,
      abbreviation: item.baseUnitAbbreviation
    },
    commercialName: item.commercialName,
    currentUnitPrice: currentUnitPrice ? Number(currentUnitPrice) : undefined,
    genericName: item.genericName ?? undefined,
    internalCode: item.internalCode,
    isSaleable: product ? product.status === "active" : false,
    nextExpirationDate: product ? getNextExpirationDate(product) : undefined,
    productId: item.productId,
    quantity: item.quantity,
    referenceSubtotal: Number(item.referenceSubtotal),
    referenceUnitPrice: Number(item.referenceUnitPrice),
    revalidationIssues: collectItemRevalidationIssues(item, productsById),
    saleableStock: saleableStock ? Number(saleableStock) : undefined
  };
}

function collectRevalidationIssues(
  cart: PendingCartRecord,
  productsById: Map<string, PendingCartProductRecord>
): PendingCartRevalidationIssue[] {
  return cart.items.flatMap((item) => collectItemRevalidationIssues(item, productsById));
}

function collectItemRevalidationIssues(
  item: PendingCartRecord["items"][number],
  productsById: Map<string, PendingCartProductRecord>
): PendingCartRevalidationIssue[] {
  const product = productsById.get(item.productId);
  const issues: PendingCartRevalidationIssue[] = [];

  if (!product || product.status !== "active") {
    issues.push({
      code: "product-not-saleable",
      productId: item.productId
    });
    return issues;
  }

  const currentUnitPrice = toMoney(product.salePrice);
  const referenceUnitPrice = toMoney(item.referenceUnitPrice);
  const saleableStock = getSaleableStock(product);

  if (!currentUnitPrice.equals(referenceUnitPrice)) {
    issues.push({
      code: "price-changed",
      currentUnitPrice: Number(currentUnitPrice),
      productId: item.productId,
      referenceUnitPrice: Number(referenceUnitPrice)
    });
  }

  if (saleableStock.lessThan(item.quantity)) {
    issues.push({
      code: "stock-insufficient",
      productId: item.productId,
      requestedQuantity: item.quantity,
      saleableStock: Number(saleableStock)
    });
  }

  return issues;
}

function buildRevalidationError(issues: PendingCartRevalidationIssue[]) {
  const issue = issues[0];
  const details = {
    productId: issue.productId,
    issues
  };

  if (issue.code === "price-changed") {
    return new HttpError(409, "Pending cart item price changed.", "PENDING_CART_ITEM_PRICE_CHANGED", details);
  }

  if (issue.code === "stock-insufficient") {
    return new HttpError(409, "Pending cart stock is insufficient.", "PENDING_CART_STOCK_INSUFFICIENT", details);
  }

  return new HttpError(409, "Pending cart item product is not saleable.", "PENDING_CART_ITEM_PRODUCT_NOT_ACTIVE", details);
}

function sumReferenceTotal(items: PendingCartItemSnapshotData[]) {
  return toMoney(items.reduce((total, item) => total.add(item.referenceSubtotal), ZERO_DECIMAL));
}

function sumCurrentTotal(cart: PendingCartRecord, productsById: Map<string, PendingCartProductRecord>) {
  return toMoney(
    cart.items.reduce((total, item) => {
      const product = productsById.get(item.productId);

      return product ? total.add(toMoney(product.salePrice).mul(item.quantity)) : total;
    }, ZERO_DECIMAL)
  );
}

function getSaleableStock(product: PendingCartProductRecord) {
  return product.inventoryBatches.reduce((total, batch) => total.add(batch.availableQuantity), ZERO_DECIMAL);
}

function getNextExpirationDate(product: PendingCartProductRecord) {
  const expirationDate = product.inventoryBatches
    .map((batch) => batch.expirationDate)
    .filter((value): value is Date => Boolean(value))
    .sort((firstDate, secondDate) => firstDate.getTime() - secondDate.getTime())[0];

  return expirationDate ? toDateOnly(expirationDate) : undefined;
}

function getProductIds(carts: PendingCartRecord[]) {
  return Array.from(new Set(carts.flatMap((cart) => cart.items.map((item) => item.productId))));
}

function buildPendingCartAuditMetadata(cart: PendingCartRecord) {
  return {
    ownerUserId: cart.ownerUserId,
    status: cart.status,
    referenceTotalAmount: Number(cart.referenceTotalAmount),
    itemCount: cart.items.length,
    expiresAt: cart.expiresAt.toISOString()
  };
}

function isAdminRole(roleName?: string) {
  return roleName === "admin" || roleName === "superadmin";
}

function addDays(value: Date, days: number) {
  const nextDate = new Date(value);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
}

function toMoney(value: Prisma.Decimal.Value) {
  const amount = new Prisma.Decimal(value);

  if (!amount.isFinite() || amount.lessThan(0)) {
    throw new HttpError(400, "Pending cart amounts must be zero or greater.", "PENDING_CART_AMOUNT_INVALID");
  }

  return amount.toDecimalPlaces(2);
}

function toDateOnlyStart(value: Date) {
  return new Date(`${toDateOnly(value)}T00:00:00.000Z`);
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}
