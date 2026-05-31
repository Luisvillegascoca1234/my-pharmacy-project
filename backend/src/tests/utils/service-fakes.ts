import { Prisma } from "@prisma/client";
import type { InventoryServicePort } from "../../modules/inventory/inventory.service.js";
import type {
  AuditContext as InventoryAuditContext,
  CreateInventoryAdjustmentData,
  CreateInventoryBatchData,
  CreateInventoryMovementData,
  InventoryBatchRecord,
  InventoryBatchWithPurchaseItem,
  InventoryMovementFilters,
  InventoryTransactionClient
} from "../../modules/inventory/inventory.types.js";
import type { PurchasesRepositoryPort } from "../../modules/purchases/purchases.service.js";
import type {
  AuditContext as PurchaseAuditContext,
  ProductWithPurchaseRelations,
  PurchaseDraftData,
  PurchaseDraftItemData,
  PurchasesListFilters,
  PurchasesListResult,
  PurchaseWithRelations,
  SupplierRecord as PurchaseSupplierRecord,
  UserRecord
} from "../../modules/purchases/purchases.types.js";
import type { SuppliersRepositoryPort } from "../../modules/suppliers/suppliers.service.js";
import type {
  AuditContext as SupplierAuditContext,
  SupplierCreateData,
  SupplierRecord,
  SuppliersListFilters,
  SuppliersListResult,
  SupplierUpdateData
} from "../../modules/suppliers/suppliers.types.js";

export const testTransactionClient = {} as InventoryTransactionClient;

export function decimal(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value);
}

export class FakeSuppliersRepository implements SuppliersRepositoryPort {
  readonly auditLogs: Array<{
    action: string;
    context: SupplierAuditContext;
    entityId: string;
    metadata: unknown;
  }> = [];
  readonly createSupplierCalls: SupplierCreateData[] = [];
  readonly findSupplierByNitCalls: Array<{ exceptId?: string; nit: string }> = [];
  readonly listSuppliersCalls: SuppliersListFilters[] = [];
  readonly updateSupplierCalls: Array<{ id: string; input: SupplierUpdateData }> = [];

  private suppliers = new Map<string, SupplierRecord>();

  constructor(suppliers: SupplierRecord[] = []) {
    this.seedSuppliers(suppliers);
  }

  seedSuppliers(suppliers: SupplierRecord[]) {
    this.suppliers = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  }

  async listSuppliers(filters: SuppliersListFilters): Promise<SuppliersListResult> {
    this.listSuppliersCalls.push(filters);

    const normalizedSearch = filters.search?.trim().toLowerCase();
    const filteredSuppliers = [...this.suppliers.values()].filter((supplier) => {
      const matchesStatus = !filters.status || supplier.status === filters.status;
      const matchesSearch =
        !normalizedSearch ||
        [supplier.businessName, supplier.nit, supplier.contactName, supplier.phone]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedSearch));

      return matchesStatus && matchesSearch;
    });

    return {
      data: filteredSuppliers.slice((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize),
      total: filteredSuppliers.length
    };
  }

  async findSupplierById(id: string) {
    return this.suppliers.get(id) ?? null;
  }

  async findSupplierByNit(nit: string, exceptId?: string) {
    this.findSupplierByNitCalls.push({ nit, exceptId });

    return [...this.suppliers.values()].find((supplier) => supplier.nit === nit && supplier.id !== exceptId) ?? null;
  }

  async createSupplier(input: SupplierCreateData) {
    this.createSupplierCalls.push(input);

    const now = new Date();
    const supplier = makeSupplierRecord({
      ...input,
      id: `supplier-${this.suppliers.size + 1}`,
      createdAt: now,
      updatedAt: now
    });

    this.suppliers.set(supplier.id, supplier);

    return supplier;
  }

  async updateSupplier(id: string, input: SupplierUpdateData) {
    this.updateSupplierCalls.push({ id, input });

    const currentSupplier = this.suppliers.get(id);

    if (!currentSupplier) {
      throw new Error(`Supplier ${id} does not exist in fake repository.`);
    }

    const changes = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
    const supplier = makeSupplierRecord({
      ...currentSupplier,
      ...changes,
      updatedAt: new Date()
    });

    this.suppliers.set(id, supplier);

    return supplier;
  }

  async createAuditLog(action: string, entityId: string, metadata: unknown, context: SupplierAuditContext) {
    this.auditLogs.push({ action, entityId, metadata, context });

    return { id: `audit-${this.auditLogs.length}` };
  }
}

export class FakePurchasesRepository implements PurchasesRepositoryPort {
  readonly auditLogs: Array<{
    action: string;
    context: PurchaseAuditContext;
    entityId: string;
    metadata: unknown;
  }> = [];
  readonly createDraftPurchaseCalls: Array<{
    context: PurchaseAuditContext;
    input: PurchaseDraftData;
    items: PurchaseDraftItemData[];
  }> = [];
  readonly listPurchasesCalls: PurchasesListFilters[] = [];
  readonly replaceDraftPurchaseCalls: Array<{
    context: PurchaseAuditContext;
    id: string;
    input: Omit<PurchaseDraftData, "createdByUserId">;
    items: PurchaseDraftItemData[];
  }> = [];

  listPurchasesResult: PurchasesListResult = { data: [], total: 0 };
  transactionClient = testTransactionClient;

  private products = new Map<string, ProductWithPurchaseRelations>();
  private purchases = new Map<string, PurchaseWithRelations>();
  private suppliers = new Map<string, PurchaseSupplierRecord>();
  private users = new Map<string, UserRecord>();

  async runInTransaction<T>(callback: (client: InventoryTransactionClient) => Promise<T>) {
    return callback(this.transactionClient);
  }

  async listPurchases(filters: PurchasesListFilters) {
    this.listPurchasesCalls.push(filters);

    return this.listPurchasesResult;
  }

  async getPurchase(id: string) {
    return this.purchases.get(id) ?? null;
  }

  async findSupplierById(id: string) {
    return this.suppliers.get(id) ?? null;
  }

  async findUserById(id: string) {
    return this.users.get(id) ?? null;
  }

  async findProductById(id: string) {
    return this.products.get(id) ?? null;
  }

  async createDraftPurchase(input: PurchaseDraftData, items: PurchaseDraftItemData[], context: PurchaseAuditContext) {
    this.createDraftPurchaseCalls.push({ input, items, context });

    const purchase = makePurchaseRecord({
      createdByUser: this.users.get(input.createdByUserId),
      items: items.map((item, index) => makePurchaseItemRecord(item, index, this.products.get(item.productId))),
      purchaseDate: input.purchaseDate,
      supplier: this.suppliers.get(input.supplierId),
      supplierId: input.supplierId,
      totalAmount: input.totalAmount,
      createdByUserId: input.createdByUserId,
      notes: input.notes
    });

    this.purchases.set(purchase.id, purchase);
    await this.createAuditLog("PURCHASE_CREATED", purchase.id, buildPurchaseDraftAuditMetadata(purchase), context);

    return purchase;
  }

  async replaceDraftPurchase(
    id: string,
    input: Omit<PurchaseDraftData, "createdByUserId">,
    items: PurchaseDraftItemData[],
    context: PurchaseAuditContext
  ) {
    this.replaceDraftPurchaseCalls.push({ id, input, items, context });

    const currentPurchase = this.purchases.get(id);
    const purchase = makePurchaseRecord({
      ...currentPurchase,
      ...input,
      createdByUser: currentPurchase?.createdByUser,
      createdByUserId: currentPurchase?.createdByUserId,
      id,
      items: items.map((item, index) => makePurchaseItemRecord(item, index, this.products.get(item.productId))),
      supplier: this.suppliers.get(input.supplierId),
      supplierId: input.supplierId
    });

    this.purchases.set(id, purchase);
    await this.createAuditLog("PURCHASE_UPDATED", purchase.id, buildPurchaseDraftAuditMetadata(purchase), context);

    return purchase;
  }

  async markPurchaseReceived(
    id: string,
    input: { receivedByUserId: string; receivedAt: Date; receiveNotes: string | null }
  ) {
    const currentPurchase = requirePurchase(this.purchases, id);
    const purchase = makePurchaseRecord({
      ...currentPurchase,
      ...input,
      receivedByUser: this.users.get(input.receivedByUserId),
      status: "received"
    });

    this.purchases.set(id, purchase);

    return purchase;
  }

  async markPurchaseCancelled(id: string, input: { cancelledAt: Date; cancelReason: string }) {
    const currentPurchase = requirePurchase(this.purchases, id);
    const purchase = makePurchaseRecord({
      ...currentPurchase,
      ...input,
      status: "cancelled"
    });

    this.purchases.set(id, purchase);

    return purchase;
  }

  async createAuditLog(action: string, entityId: string, metadata: unknown, context: PurchaseAuditContext) {
    this.auditLogs.push({ action, entityId, metadata, context });

    return { id: `audit-${this.auditLogs.length}` };
  }

  seedProducts(products: ProductWithPurchaseRelations[]) {
    this.products = new Map(products.map((product) => [product.id, product]));
  }

  seedPurchases(purchases: PurchaseWithRelations[]) {
    this.purchases = new Map(purchases.map((purchase) => [purchase.id, purchase]));
  }

  seedSuppliers(suppliers: PurchaseSupplierRecord[]) {
    this.suppliers = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  }

  seedUsers(users: UserRecord[]) {
    this.users = new Map(users.map((user) => [user.id, user]));
  }
}

export class FakeInventoryRepository {
  readonly adjustments: CreateInventoryAdjustmentData[] = [];
  readonly auditLogs: Array<{
    action: string;
    context: InventoryAuditContext;
    entityId: string;
    metadata: unknown;
  }> = [];
  readonly batches: InventoryBatchWithPurchaseItem[] = [];
  readonly movements: CreateInventoryMovementData[] = [];

  async runInTransaction<T>(callback: (client: InventoryTransactionClient) => Promise<T>) {
    return callback(testTransactionClient);
  }

  async createAdjustment(data: CreateInventoryAdjustmentData) {
    this.adjustments.push(data);

    return {
      id: `adjustment-${this.adjustments.length}`,
      createdAt: new Date("2026-01-01T00:00:00.000Z")
    };
  }

  async createBatch(data: CreateInventoryBatchData) {
    const batch = makeInventoryBatchRecord({
      ...data,
      id: `batch-${this.batches.length + 1}`,
      status: "active"
    });

    this.batches.push(batch);

    return batch;
  }

  async createMovement(data: CreateInventoryMovementData) {
    this.movements.push(data);

    return { id: `movement-${this.movements.length}`, ...data };
  }

  async findBatchesByPurchaseId(purchaseId: string) {
    return this.batches.filter((batch) => {
      const purchaseItem = batch.purchaseItem as InventoryBatchWithPurchaseItem["purchaseItem"] & { purchaseId?: string };

      return purchaseItem.purchaseId === purchaseId;
    });
  }

  async findBatchById(id: string) {
    return (this.batches.find((batch) => batch.id === id) as InventoryBatchRecord | undefined) ?? null;
  }

  async listBatches() {
    return this.batches as unknown as InventoryBatchRecord[];
  }

  async listFefoBatches(productId: string) {
    return this.batches.filter((batch) => batch.productId === productId && batch.status === "active") as unknown as InventoryBatchRecord[];
  }

  async listMovements(_filters: InventoryMovementFilters) {
    return {
      data: [],
      total: 0
    };
  }

  async updateBatchQuantity(id: string, availableQuantity: Prisma.Decimal) {
    const batch = this.batches.find((currentBatch) => currentBatch.id === id);

    if (!batch) {
      throw new Error(`Inventory batch ${id} does not exist in fake repository.`);
    }

    batch.availableQuantity = availableQuantity;
    batch.status = availableQuantity.equals(0) ? "depleted" : "active";

    return batch;
  }

  async cancelBatch(id: string) {
    const batch = this.batches.find((currentBatch) => currentBatch.id === id);

    if (!batch) {
      throw new Error(`Inventory batch ${id} does not exist in fake repository.`);
    }

    batch.availableQuantity = decimal(0);
    batch.status = "cancelled";

    return batch;
  }

  async createAuditLog(action: string, entityId: string, metadata: unknown, context: InventoryAuditContext) {
    this.auditLogs.push({ action, entityId, metadata, context });

    return { id: `audit-${this.auditLogs.length}` };
  }
}

export class FakeInventoryService implements InventoryServicePort {
  readonly cancelPurchaseReceiptLayersCalls: Array<Parameters<InventoryServicePort["cancelPurchaseReceiptLayers"]>> = [];
  readonly createPurchaseReceiptLayersCalls: Array<Parameters<InventoryServicePort["createPurchaseReceiptLayers"]>> = [];

  async createPurchaseReceiptLayers(...args: Parameters<InventoryServicePort["createPurchaseReceiptLayers"]>) {
    this.createPurchaseReceiptLayersCalls.push(args);
  }

  async cancelPurchaseReceiptLayers(...args: Parameters<InventoryServicePort["cancelPurchaseReceiptLayers"]>) {
    this.cancelPurchaseReceiptLayersCalls.push(args);
  }
}

export function makeSupplierRecord(overrides: Partial<SupplierRecord> = {}): SupplierRecord {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    id: "supplier-1",
    businessName: "Proveedor Central",
    nit: "123456",
    phone: "70000000",
    address: "Avenida Principal",
    contactName: "Contacto Proveedor",
    status: "active",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

export function makeUserRecord(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: "user-1",
    fullName: "Usuario Admin",
    email: "admin@example.com",
    status: "active",
    ...overrides
  };
}

export function makeProductWithPurchaseRelations(
  overrides: Partial<ProductWithPurchaseRelations> = {}
): ProductWithPurchaseRelations {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const productId = overrides.id ?? "product-1";
  const unitId = overrides.units?.[0]?.unitId ?? "unit-1";

  return {
    id: productId,
    internalCode: "MED-001",
    barcode: null,
    commercialName: "Paracetamol 500mg",
    genericName: "Paracetamol",
    description: null,
    type: "medicine",
    categoryId: "category-1",
    baseUnitId: unitId,
    supplierId: "supplier-1",
    laboratoryName: null,
    sanitaryRegistration: null,
    isMedicine: true,
    isOverTheCounter: true,
    requiresPrescription: false,
    isInventoryTracked: true,
    requiresBatch: true,
    requiresExpiration: true,
    minimumStock: decimal(0),
    salePrice: decimal(10),
    status: "active",
    units: [
      {
        id: "product-unit-1",
        productId,
        unitId,
        conversionFactor: decimal(1),
        createdAt: now,
        updatedAt: now,
        unit: {
          id: unitId,
          name: "Unidad",
          abbreviation: "u",
          description: null,
          status: "active",
          createdAt: now,
          updatedAt: now
        }
      }
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

export function makePurchaseRecord(overrides: Partial<PurchaseWithRelations> = {}): PurchaseWithRelations {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const supplier = overrides.supplier ?? makeSupplierRecord({ id: overrides.supplierId ?? "supplier-1" });
  const createdByUser = overrides.createdByUser ?? makeUserRecord({ id: overrides.createdByUserId ?? "user-1" });

  return {
    id: "purchase-1",
    supplierId: supplier.id,
    supplier,
    purchaseDate: new Date("2026-01-01T00:00:00.000Z"),
    status: "draft",
    totalAmount: decimal(0),
    createdByUserId: createdByUser.id,
    createdByUser,
    receivedByUserId: null,
    receivedByUser: null,
    receivedAt: null,
    cancelledAt: null,
    notes: null,
    receiveNotes: null,
    cancelReason: null,
    items: [],
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

export function makePurchaseItemRecord(
  overrides: Partial<PurchaseWithRelations["items"][number]> = {},
  index = 0,
  product = makeProductWithPurchaseRelations({ id: overrides.productId ?? "product-1" })
): PurchaseWithRelations["items"][number] {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const productUnit = product.units[0];

  return {
    id: `purchase-item-${index + 1}`,
    purchaseId: "purchase-1",
    productId: product.id,
    product,
    unitId: productUnit.unitId,
    unit: productUnit.unit,
    quantity: decimal(1),
    unitCost: decimal(10),
    conversionFactor: productUnit.conversionFactor,
    baseQuantity: decimal(1),
    baseUnitCost: decimal(10),
    lineTotal: decimal(10),
    isInventoryTracked: product.isInventoryTracked,
    batchNumber: "LOT-001",
    expirationDate: new Date("2027-01-01T00:00:00.000Z"),
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

export function makeInventoryBatchRecord(
  overrides: Partial<InventoryBatchWithPurchaseItem> = {}
): InventoryBatchWithPurchaseItem {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const purchaseItem = overrides.purchaseItem ?? makePurchaseItemRecord({ id: overrides.purchaseItemId ?? "purchase-item-1" });

  return {
    id: "batch-1",
    purchaseItemId: purchaseItem.id,
    purchaseItem,
    productId: purchaseItem.productId,
    originalQuantity: purchaseItem.baseQuantity,
    availableQuantity: purchaseItem.baseQuantity,
    baseUnitCost: purchaseItem.baseUnitCost,
    batchNumber: purchaseItem.batchNumber,
    expirationDate: purchaseItem.expirationDate,
    status: "active",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function requirePurchase(purchases: Map<string, PurchaseWithRelations>, id: string) {
  const purchase = purchases.get(id);

  if (!purchase) {
    throw new Error(`Purchase ${id} does not exist in fake repository.`);
  }

  return purchase;
}

function buildPurchaseDraftAuditMetadata(purchase: PurchaseWithRelations) {
  return {
    supplierId: purchase.supplierId,
    purchaseDate: purchase.purchaseDate.toISOString().slice(0, 10),
    status: purchase.status,
    totalAmount: Number(purchase.totalAmount),
    itemCount: purchase.items.length
  };
}
