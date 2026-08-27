import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import "../src/config/env.js";
import { prisma } from "../src/infrastructure/prisma/prisma.client.js";

const PRODUCT_COUNT = 250;
const HISTORY_DAYS = 730;
const USER_COUNT = 5;
const CUSTOMER_COUNT = 100;
const TARGET_SALE_COUNT = 10_000;
const SEED_PASSWORD = "admin";

const categories = [
  "Analgésicos y antipiréticos",
  "Antiinflamatorios",
  "Antibióticos",
  "Gastroenterología",
  "Alergia y respiratorio",
  "Resfrío y tos",
  "Dermatología",
  "Vitaminas y suplementos",
  "Salud cardiovascular",
  "Salud femenina",
  "Primeros auxilios",
  "Material descartable",
  "Higiene y desinfección",
  "Cuidado infantil",
  "Dispositivos médicos"
] as const;

const suppliers = [
  ["Distribuidora Farmacéutica Illimani", "1029384756", "La Paz"],
  ["Droguería Oriental Salud", "2039485761", "Santa Cruz de la Sierra"],
  ["Importadora Médica Tunari", "3049586712", "Cochabamba"],
  ["Distribuciones San Gabriel", "4059687123", "Sucre"],
  ["Abastecimientos Farmacéuticos del Sur", "5069781234", "Tarija"],
  ["Droguería Virgen de Urkupiña", "6079812345", "Quillacollo"],
  ["Insumos Clínicos Andinos", "7089123456", "El Alto"],
  ["Distribuidora BioSalud", "8091234567", "La Paz"],
  ["Provisión Médica Amazónica", "9012345678", "Trinidad"],
  ["Farmacéutica San Roque", "1123456789", "Santa Cruz de la Sierra"],
  ["Comercializadora Vida Plena", "2234567891", "Cochabamba"],
  ["Laboratorios y Droguería Nacional", "3345678912", "La Paz"],
  ["Suministros Hospitalarios Bolivia", "4456789123", "Oruro"],
  ["Distribuciones Médicas Potosí", "5567891234", "Potosí"]
] as const;

type InvoiceCustomer = readonly [businessName: string, nit: string];

const invoiceCustomers = buildInvoiceCustomers(CUSTOMER_COUNT);

type ProductFamily = {
  genericName: string;
  category: (typeof categories)[number];
  strengths: string[];
  presentations: string[];
  baseUnit: string;
  type: "medicine" | "otc" | "medical_supply" | "hygiene_disinfection" | "related_misc";
  medicine: boolean;
  otc: boolean;
  prescription: boolean;
  restockFactor: number;
};

const productFamilies: ProductFamily[] = [
  family("Paracetamol", categories[0], ["500 mg", "1 g"], ["comprimidos", "tabletas"], "TAB", "otc", true, true, false, 100),
  family("Ibuprofeno", categories[1], ["200 mg", "400 mg", "600 mg"], ["comprimidos", "cápsulas"], "COMP", "medicine", true, true, false, 100),
  family("Diclofenaco sódico", categories[1], ["50 mg", "75 mg"], ["comprimidos", "cápsulas"], "COMP", "medicine", true, false, true, 50),
  family("Amoxicilina", categories[2], ["500 mg", "1 g"], ["cápsulas", "comprimidos"], "CAP", "medicine", true, false, true, 100),
  family("Azitromicina", categories[2], ["500 mg", "200 mg/5 ml"], ["comprimidos", "suspensión"], "UND", "medicine", true, false, true, 3),
  family("Omeprazol", categories[3], ["20 mg", "40 mg"], ["cápsulas", "comprimidos"], "CAP", "medicine", true, true, false, 100),
  family("Hidróxido de aluminio y magnesio", categories[3], ["200 ml", "360 ml"], ["suspensión oral"], "FCO", "otc", true, true, false, 12),
  family("Loratadina", categories[4], ["10 mg", "5 mg/5 ml"], ["comprimidos", "jarabe"], "UND", "otc", true, true, false, 20),
  family("Salbutamol", categories[4], ["100 mcg/dosis"], ["inhalador"], "INH", "medicine", true, false, true, 12),
  family("Clorfenamina", categories[4], ["4 mg"], ["comprimidos"], "COMP", "otc", true, true, false, 100),
  family("Dextrometorfano", categories[5], ["15 mg/5 ml"], ["jarabe 120 ml", "jarabe 200 ml"], "FCO", "otc", true, true, false, 12),
  family("Sales de rehidratación oral", categories[5], ["27.9 g"], ["sobre"], "SOB", "otc", true, true, false, 50),
  family("Clotrimazol", categories[6], ["1%", "100 mg"], ["crema", "óvulos"], "UND", "medicine", true, true, false, 12),
  family("Betametasona", categories[6], ["0.05%", "0.1%"], ["crema", "ungüento"], "TUB", "medicine", true, false, true, 12),
  family("Vitamina C", categories[7], ["500 mg", "1 g"], ["tabletas", "efervescentes"], "TAB", "otc", false, true, false, 30),
  family("Complejo B", categories[7], ["forte"], ["tabletas", "ampollas"], "UND", "otc", false, true, false, 30),
  family("Losartán", categories[8], ["50 mg", "100 mg"], ["comprimidos"], "COMP", "medicine", true, false, true, 100),
  family("Amlodipino", categories[8], ["5 mg", "10 mg"], ["comprimidos"], "COMP", "medicine", true, false, true, 100),
  family("Fluconazol", categories[9], ["150 mg"], ["cápsula"], "CAP", "medicine", true, false, true, 10),
  family("Ácido fólico", categories[9], ["5 mg"], ["tabletas"], "TAB", "otc", true, true, false, 100),
  family("Gasa estéril", categories[10], ["7.5 x 7.5 cm", "10 x 10 cm"], ["paquete"], "PAQ", "medical_supply", false, true, false, 20),
  family("Venda de gasa", categories[10], ["5 cm", "10 cm"], ["rollo"], "ROL", "medical_supply", false, true, false, 12),
  family("Jeringa descartable", categories[11], ["3 ml", "5 ml", "10 ml", "20 ml"], ["unidad"], "JER", "medical_supply", false, true, false, 100),
  family("Guantes de examen", categories[11], ["talla S", "talla M", "talla L"], ["caja x 100"], "UND", "medical_supply", false, true, false, 10),
  family("Alcohol etílico", categories[12], ["70% 250 ml", "70% 1 L"], ["frasco"], "FCO", "hygiene_disinfection", false, true, false, 12),
  family("Gel antibacterial", categories[12], ["250 ml", "500 ml"], ["frasco"], "FCO", "hygiene_disinfection", false, true, false, 12),
  family("Pañal infantil", categories[13], ["talla RN", "talla P", "talla M", "talla G"], ["paquete"], "PAQ", "related_misc", false, true, false, 8),
  family("Solución fisiológica", categories[13], ["100 ml", "500 ml", "1 L"], ["frasco"], "FCO", "medical_supply", false, true, false, 12),
  family("Termómetro digital", categories[14], ["clínico"], ["unidad"], "UND", "medical_supply", false, true, false, 6),
  family("Tensiómetro digital", categories[14], ["brazo", "muñeca"], ["unidad"], "UND", "medical_supply", false, true, false, 4),
  family("Barbijo quirúrgico", categories[11], ["triple capa"], ["caja x 50"], "UND", "medical_supply", false, true, false, 50),
  family("Algodón hidrófilo", categories[10], ["50 g", "100 g", "250 g"], ["paquete"], "PAQ", "medical_supply", false, true, false, 12)
];

const laboratories = [
  "Laboratorios Andinos",
  "Biofarma Bolivia",
  "Laboratorio San Lucas",
  "Farmacéutica Illimani",
  "Laboratorios del Oriente",
  "Química Médica Nacional",
  "Laboratorio Tunari",
  "Salud Integral Bolivia"
] as const;

type PlannedLine = { productIndex: number; quantity: number };
type StaffUser = {
  id: string;
  email: string;
  fullName: string;
  roleName: "superadmin" | "admin" | "seller";
  passwordHash: string;
  roleId: string;
  status: "active" | "inactive" | "blocked";
  lastLoginAt: Date;
  createdAt: Date;
};
type PlannedSale = {
  index: number;
  sessionIndex: number;
  sellerId: string;
  confirmedAt: Date;
  status: "confirmed" | "cancelled" | "returned";
  lines: PlannedLine[];
};

type MutableBatch = {
  id: string;
  productIndex: number;
  productId: string;
  purchaseItemId: string;
  receivedAt: Date;
  expirationDate: Date;
  batchNumber: string;
  originalQuantity: number;
  availableQuantity: number;
  baseUnitCost: number;
  status: "active" | "depleted" | "blocked";
};

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const random = createRandom(options.seed);
  const asOf = dateOnly(options.asOf);
  const historyStart = addDays(asOf, -(HISTORY_DAYS - 1));
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const [roles, units, baseCategory, baseSupplier] = await Promise.all([
    prisma.role.findMany(),
    prisma.unit.findMany(),
    prisma.productCategory.findUnique({ where: { name: "Analgésicos y antipiréticos" } }),
    prisma.supplier.findFirst({ orderBy: { createdAt: "asc" } })
  ]);
  const roleByName = new Map(roles.map((role) => [role.name, role.id]));
  const unitByAbbreviation = new Map(units.map((unit) => [unit.abbreviation, unit]));
  const requiredRoleNames = ["superadmin", "admin", "seller"] as const;
  for (const roleName of requiredRoleNames) {
    if (!roleByName.has(roleName)) throw new Error(`Missing required role ${roleName}. Run prisma:seed first.`);
  }

  if (!baseCategory || !baseSupplier) throw new Error("Base catalog data is missing. Run prisma:seed first.");

  const staff = await buildStaff(passwordHash, roleByName, asOf);
  const adminIds = staff.filter((user) => user.roleName !== "seller").map((user) => user.id);
  const activeSellerIds = staff.filter((user) => user.roleName === "seller" && user.status === "active").map((user) => user.id);
  const historicalSellerIds = staff.filter((user) => user.roleName === "seller" && user.status !== "active").map((user) => user.id);
  const allSellerIds = [...historicalSellerIds, ...activeSellerIds];

  const categoryRows: Prisma.ProductCategoryCreateManyInput[] = categories.map((name, index) => ({
    id: index === 0 ? baseCategory.id : `category-${String(index + 1).padStart(2, "0")}`,
    name,
    description: categoryDescription(name),
    status: "active",
    createdAt: addDays(historyStart, -120)
  }));
  const supplierRows: Prisma.SupplierCreateManyInput[] = suppliers.map(([businessName, nit, city], index) => ({
    id: index === 0 ? baseSupplier.id : `supplier-${String(index + 1).padStart(2, "0")}`,
    businessName,
    nit,
    phone: `7${String(1000000 + index * 7319).slice(0, 7)}`,
    address: `${city}, Bolivia`,
    contactName: staffName(index + 7),
    status: index === suppliers.length - 1 ? "inactive" : "active",
    createdAt: addDays(historyStart, -110 + index)
  }));

  const products = Array.from({ length: PRODUCT_COUNT }, (_, index) => buildProduct(index, random));
  const productRows: Prisma.ProductCreateManyInput[] = products.map((product) => ({
    id: product.id,
    internalCode: product.internalCode,
    barcode: product.barcode,
    commercialName: product.commercialName,
    genericName: product.family.genericName,
    description: product.description,
    type: product.family.type,
    categoryId: categoryRows[categories.indexOf(product.family.category)]!.id!,
    baseUnitId: requireUnit(unitByAbbreviation, product.family.baseUnit).id,
    supplierId: supplierRows[product.supplierIndex]!.id!,
    laboratoryName: product.laboratory,
    sanitaryRegistration: product.family.medicine ? `II-${String(10000 + product.index).padStart(5, "0")}/2025` : null,
    isMedicine: product.family.medicine,
    isOverTheCounter: product.family.otc,
    requiresPrescription: product.family.prescription,
    isInventoryTracked: true,
    requiresBatch: true,
    requiresExpiration: true,
    minimumStock: product.minimumStock,
    stockCriticality: product.criticality,
    stockCoverageDays: product.coverageDays,
    salePrice: product.salePrice,
    status: product.index >= 242 ? "inactive" : "active",
    createdAt: addDays(historyStart, -90 + (product.index % 45))
  }));

  const productUnitRows: Prisma.ProductUnitCreateManyInput[] = [];
  for (const product of products) {
    const baseUnit = requireUnit(unitByAbbreviation, product.family.baseUnit);
    productUnitRows.push({
      id: `${product.id}-base-unit`,
      productId: product.id,
      unitId: baseUnit.id,
      conversionFactor: 1,
      createdAt: addDays(historyStart, -60)
    });
    const restockUnit = requireUnit(unitByAbbreviation, "CJ");
    if (restockUnit.id !== baseUnit.id) {
      productUnitRows.push({
        id: `${product.id}-restock-unit`,
        productId: product.id,
        unitId: restockUnit.id,
        conversionFactor: product.family.restockFactor,
        createdAt: addDays(historyStart, -60)
      });
    }
  }

  const shiftPlans: Array<{
    day: Date;
    dayIndex: number;
    isSunday: boolean;
    shift: number;
    weight: number;
  }> = [];
  for (let dayIndex = 0; dayIndex < HISTORY_DAYS; dayIndex += 1) {
    const day = addDays(historyStart, dayIndex);
    const isSunday = day.getUTCDay() === 0;
    const shiftCount = isSunday ? 1 : 2;
    for (let shift = 0; shift < shiftCount; shift += 1) {
      const baseSales = isSunday ? 3 : shift === 0 ? 5 : 7;
      shiftPlans.push({
        day,
        dayIndex,
        isSunday,
        shift,
        weight: baseSales + randomInt(random, 0, 3)
      });
    }
  }
  const salesByShift = distributeTotalByWeight(shiftPlans.map((plan) => plan.weight), TARGET_SALE_COUNT);

  const sessionPlans: Array<{
    id: string;
    index: number;
    sellerId: string;
    openedAt: Date;
    closedAt: Date | null;
    initialAmount: number;
    expectedAmount: number;
  }> = [];
  const salePlans: PlannedSale[] = [];
  let sessionIndex = 0;
  let saleIndex = 0;
  for (const [shiftPlanIndex, shiftPlan] of shiftPlans.entries()) {
      const { day, dayIndex, shift } = shiftPlan;
      sessionIndex += 1;
      const historical = dayIndex < 500 && historicalSellerIds.length > 0;
      const sellerPool = historical ? allSellerIds : activeSellerIds;
      const sellerId = sellerPool[(dayIndex * 2 + shift * 7) % sellerPool.length]!;
      const openedAt = atHour(day, shift === 0 ? 7 : 14, randomInt(random, 0, 20));
      const isCurrentOpenSession = shiftPlanIndex === shiftPlans.length - 1;
      const closedAt = isCurrentOpenSession ? null : atHour(day, shift === 0 ? 14 : 21, randomInt(random, 0, 35));
      const currentSessionIndex = sessionIndex;
      sessionPlans.push({
        id: `cash-session-${String(currentSessionIndex).padStart(5, "0")}`,
        index: currentSessionIndex,
        sellerId,
        openedAt,
        closedAt,
        initialAmount: [150, 200, 250][currentSessionIndex % 3]!,
        expectedAmount: 0
      });
      const salesInShift = salesByShift[shiftPlanIndex]!;
      for (let position = 0; position < salesInShift; position += 1) {
        saleIndex += 1;
        const statusRoll = random();
        const status = statusRoll < 0.012 ? "cancelled" : statusRoll < 0.02 ? "returned" : "confirmed";
        const itemCount = randomInt(random, 1, 4);
        const usedProducts = new Set<number>();
        const lines: PlannedLine[] = [];
        while (lines.length < itemCount) {
          const productIndex = chooseProductIndex(random, day);
          if (usedProducts.has(productIndex)) continue;
          usedProducts.add(productIndex);
          lines.push({
            productIndex,
            quantity: random() < 0.78 ? 1 : randomInt(random, 2, 4)
          });
        }
        const shiftStartHour = shift === 0 ? 8 : 15;
        salePlans.push({
          index: saleIndex,
          sessionIndex: currentSessionIndex,
          sellerId,
          confirmedAt: atHour(day, shiftStartHour + randomInt(random, 0, 5), randomInt(random, 0, 59)),
          status,
          lines
        });
      }
  }

  if (salePlans.length !== TARGET_SALE_COUNT) {
    throw new Error(`Expected ${TARGET_SALE_COUNT} planned sales, received ${salePlans.length}.`);
  }

  const waveStarts = [addDays(historyStart, -30), addDays(historyStart, 240), addDays(historyStart, 480)];
  const demandByProductAndWave = Array.from({ length: PRODUCT_COUNT }, () => [0, 0, 0]);
  for (const sale of salePlans) {
    if (sale.status !== "confirmed") continue;
    const waveIndex = sale.confirmedAt < waveStarts[1]! ? 0 : sale.confirmedAt < waveStarts[2]! ? 1 : 2;
    for (const line of sale.lines) demandByProductAndWave[line.productIndex]![waveIndex]! += line.quantity;
  }

  const purchaseRows: Prisma.PurchaseCreateManyInput[] = [];
  const purchaseItemRows: Prisma.PurchaseItemCreateManyInput[] = [];
  const inventoryBatchRows: Prisma.InventoryBatchCreateManyInput[] = [];
  const inventoryMovementRows: Prisma.InventoryMovementCreateManyInput[] = [];
  const mutableBatches: MutableBatch[] = [];
  const purchaseTotals = new Map<string, number>();

  for (let waveIndex = 0; waveIndex < waveStarts.length; waveIndex += 1) {
    for (let supplierIndex = 0; supplierIndex < suppliers.length; supplierIndex += 1) {
      const id = `purchase-${waveIndex + 1}-${String(supplierIndex + 1).padStart(2, "0")}`;
      purchaseRows.push({
        id,
        supplierId: supplierRows[supplierIndex]!.id!,
        purchaseDate: waveStarts[waveIndex]!,
        status: "received",
        totalAmount: 0,
        createdByUserId: adminIds[(waveIndex + supplierIndex) % adminIds.length]!,
        receivedByUserId: adminIds[(waveIndex + supplierIndex + 1) % adminIds.length]!,
        receivedAt: atHour(waveStarts[waveIndex]!, 9, 30),
        notes: "Reposición periódica según rotación y cobertura de inventario.",
        receiveNotes: "Mercadería verificada contra documento y fechas de vencimiento.",
        createdAt: atHour(waveStarts[waveIndex]!, 8, 15)
      });
    }
  }

  for (const product of products) {
    for (let waveIndex = 0; waveIndex < waveStarts.length; waveIndex += 1) {
      const purchaseId = `purchase-${waveIndex + 1}-${String(product.supplierIndex + 1).padStart(2, "0")}`;
      const purchaseItemId = `purchase-item-${String(product.index + 1).padStart(4, "0")}-${waveIndex + 1}`;
      const batchId = `inventory-batch-${String(product.index + 1).padStart(4, "0")}-${waveIndex + 1}`;
      const isLastWave = waveIndex === waveStarts.length - 1;
      const targetStock = isLastWave
        ? product.index < 5 ? 0 : product.index < 17 ? Math.max(1, Math.floor(product.minimumStock * 0.45)) : product.minimumStock + randomInt(random, 12, 65)
        : product.index < 17 ? 0 : randomInt(random, 2, 8);
      const originalQuantity = demandByProductAndWave[product.index]![waveIndex]! + targetStock + 8;
      const baseUnitCost = money(product.baseUnitCost * (1 + waveIndex * 0.035));
      const expirationDays = isLastWave && product.index >= 17 && product.index < 27
        ? randomInt(random, 10, 55)
        : 150 + waveIndex * 240 + randomInt(random, 60, 240);
      const expirationDate = addDays(asOf, expirationDays);
      const unitQuantity = Math.ceil(originalQuantity / product.family.restockFactor);
      const lineTotal = money(originalQuantity * baseUnitCost);
      purchaseItemRows.push({
        id: purchaseItemId,
        purchaseId,
        productId: product.id,
        unitId: requireUnit(unitByAbbreviation, "CJ").id,
        quantity: unitQuantity,
        unitCost: money(baseUnitCost * product.family.restockFactor),
        conversionFactor: product.family.restockFactor,
        baseQuantity: originalQuantity,
        baseUnitCost,
        lineTotal,
        isInventoryTracked: true,
        batchNumber: `LT-${String(product.index + 1).padStart(4, "0")}-${waveIndex + 1}-${String(waveStarts[waveIndex]!.getUTCFullYear()).slice(-2)}`,
        expirationDate,
        createdAt: atHour(waveStarts[waveIndex]!, 9, 30)
      });
      purchaseTotals.set(purchaseId, money((purchaseTotals.get(purchaseId) ?? 0) + lineTotal));
      const batch: MutableBatch = {
        id: batchId,
        productIndex: product.index,
        productId: product.id,
        purchaseItemId,
        receivedAt: atHour(waveStarts[waveIndex]!, 9, 30),
        expirationDate,
        batchNumber: `LT-${String(product.index + 1).padStart(4, "0")}-${waveIndex + 1}-${String(waveStarts[waveIndex]!.getUTCFullYear()).slice(-2)}`,
        originalQuantity,
        availableQuantity: originalQuantity,
        baseUnitCost,
        status: "active"
      };
      mutableBatches.push(batch);
      inventoryMovementRows.push({
        id: `inventory-movement-receipt-${batchId}`,
        batchId,
        productId: product.id,
        type: "purchase_received",
        quantityBase: originalQuantity,
        unitCostBase: baseUnitCost,
        referenceType: "purchase",
        referenceId: purchaseId,
        referenceItemId: purchaseItemId,
        actorUserId: adminIds[(waveIndex + product.supplierIndex) % adminIds.length]!,
        reason: "Recepción de compra con control de lote y vencimiento.",
        createdAt: atHour(waveStarts[waveIndex]!, 9, 30)
      });
    }
  }

  for (const purchase of purchaseRows) purchase.totalAmount = purchaseTotals.get(purchase.id!) ?? 0;

  const cashRows: Prisma.CashSessionCreateManyInput[] = [];
  const saleRows: Prisma.SaleCreateManyInput[] = [];
  const saleItemRows: Prisma.SaleItemCreateManyInput[] = [];
  const saleItemBatchRows: Prisma.SaleItemBatchCreateManyInput[] = [];
  const paymentRows: Prisma.PaymentCreateManyInput[] = [];
  const returnRows: Prisma.SaleReturnCreateManyInput[] = [];
  const returnItemRows: Prisma.SaleReturnItemCreateManyInput[] = [];
  const preparedInvoiceRows: Prisma.PreparedInvoiceCreateManyInput[] = [];
  const preparedInvoiceItemRows: Prisma.PreparedInvoiceItemCreateManyInput[] = [];
  const inventoryAdjustmentRows: Prisma.InventoryAdjustmentCreateManyInput[] = [];
  const auditRows: Prisma.AuditLogCreateManyInput[] = [];
  let preparedInvoiceNumber = 0;

  for (const sale of salePlans) {
    const saleId = `sale-${String(sale.index).padStart(7, "0")}`;
    const session = sessionPlans[sale.sessionIndex - 1]!;
    let totalAmount = 0;
    let totalCost = 0;
    const allocationsForReturn: Array<{
      saleItemId: string;
      saleItemBatchId: string;
      batch: MutableBatch;
      quantity: number;
      unitPrice: number;
      product: ReturnType<typeof buildProduct>;
    }> = [];

    for (const [lineIndex, line] of sale.lines.entries()) {
      const product = products[line.productIndex]!;
      const saleItemId = `${saleId}-item-${lineIndex + 1}`;
      let remaining = line.quantity;
      let itemCost = 0;
      const eligibleBatches = mutableBatches
        .filter((batch) => batch.productIndex === line.productIndex && batch.status !== "blocked" && batch.receivedAt <= sale.confirmedAt && batch.availableQuantity > 0)
        .sort((left, right) => left.expirationDate.getTime() - right.expirationDate.getTime());
      for (const batch of eligibleBatches) {
        if (remaining === 0) break;
        const quantity = Math.min(remaining, batch.availableQuantity);
        if (quantity <= 0) continue;
        batch.availableQuantity -= quantity;
        remaining -= quantity;
        itemCost += quantity * batch.baseUnitCost;
        const movementId = `inventory-movement-sale-${sale.index}-${lineIndex + 1}-${batch.id}`;
        const consumptionId = `batch-consumption-${sale.index}-${lineIndex + 1}-${batch.id}`;
        inventoryMovementRows.push({
          id: movementId,
          batchId: batch.id,
          productId: product.id,
          type: "sale_confirmed",
          quantityBase: -quantity,
          unitCostBase: batch.baseUnitCost,
          referenceType: "sale",
          referenceId: saleId,
          referenceItemId: saleItemId,
          actorUserId: sale.sellerId,
          reason: "Salida FEFO por venta confirmada.",
          createdAt: sale.confirmedAt
        });
        saleItemBatchRows.push({
          id: consumptionId,
          saleItemId,
          batchId: batch.id,
          quantity,
          unitCostBase: batch.baseUnitCost,
          totalCost: money(quantity * batch.baseUnitCost),
          inventoryMovementId: movementId,
          createdAt: sale.confirmedAt
        });
        allocationsForReturn.push({ saleItemId, saleItemBatchId: consumptionId, batch, quantity, unitPrice: product.salePrice, product });
      }
      if (remaining > 0) throw new Error(`Insufficient planned stock for ${product.internalCode} on ${sale.confirmedAt.toISOString()}.`);
      const subtotal = money(product.salePrice * line.quantity);
      totalAmount += subtotal;
      totalCost += itemCost;
      const baseUnit = requireUnit(unitByAbbreviation, product.family.baseUnit);
      saleItemRows.push({
        id: saleItemId,
        saleId,
        productId: product.id,
        internalCode: product.internalCode,
        barcode: product.barcode,
        commercialName: product.commercialName,
        genericName: product.family.genericName,
        baseUnitId: baseUnit.id,
        baseUnitName: baseUnit.name,
        baseUnitAbbreviation: baseUnit.abbreviation,
        unitPrice: product.salePrice,
        quantity: line.quantity,
        subtotal,
        totalCost: money(itemCost),
        margin: money(subtotal - itemCost),
        createdAt: sale.confirmedAt
      });
    }

    totalAmount = money(totalAmount);
    totalCost = money(totalCost);
    const paymentStatus = sale.status === "cancelled" ? "reverted" : sale.status === "returned" ? "refunded" : "paid";
    const receivedAmount = nextCashAmount(totalAmount);
    saleRows.push({
      id: saleId,
      idempotencyKey: `seed-${options.seed}-${sale.index}`,
      correlativeNumber: sale.index,
      correlativeCode: `VTA-${String(sale.index).padStart(7, "0")}`,
      sellerUserId: sale.sellerId,
      cancelledByUserId: sale.status === "cancelled" ? sale.sellerId : null,
      cashSessionId: session.id,
      status: sale.status,
      totalAmount,
      totalCost,
      totalMargin: money(totalAmount - totalCost),
      confirmedAt: sale.confirmedAt,
      cancelledAt: sale.status === "cancelled" ? addMinutes(sale.confirmedAt, 8) : null,
      cancelReason: sale.status === "cancelled" ? "Error de digitación detectado antes del cierre de caja." : null,
      createdAt: sale.confirmedAt
    });
    paymentRows.push({
      id: `payment-${sale.index}`,
      saleId,
      cashSessionId: session.id,
      method: "cash",
      saleTotal: totalAmount,
      receivedAmount,
      changeAmount: money(receivedAmount - totalAmount),
      refundAmount: sale.status === "returned" ? totalAmount : null,
      status: paymentStatus,
      paidAt: sale.confirmedAt,
      reversedAt: sale.status === "confirmed" ? null : addMinutes(sale.confirmedAt, sale.status === "cancelled" ? 8 : 180),
      createdAt: sale.confirmedAt
    });

    if (sale.status === "confirmed") session.expectedAmount += totalAmount;

    if (sale.status === "cancelled" || sale.status === "returned") {
      const reversalType = sale.status === "cancelled" ? "sale_cancelled" : "sale_returned";
      const reversalDate = addMinutes(sale.confirmedAt, sale.status === "cancelled" ? 8 : 180);
      const returnId = `sale-return-${sale.index}`;
      if (sale.status === "returned") {
        returnRows.push({
          id: returnId,
          saleId,
          paymentId: `payment-${sale.index}`,
          actorUserId: adminIds[sale.index % adminIds.length]!,
          reason: "Devolución total autorizada por presentación incorrecta del producto.",
          refundAmount: totalAmount,
          returnedAt: reversalDate,
          createdAt: reversalDate
        });
      }
      for (const [allocationIndex, allocation] of allocationsForReturn.entries()) {
        allocation.batch.availableQuantity += allocation.quantity;
        const reversalMovementId = `inventory-movement-${reversalType}-${sale.index}-${allocationIndex + 1}`;
        inventoryMovementRows.push({
          id: reversalMovementId,
          batchId: allocation.batch.id,
          productId: allocation.product.id,
          type: reversalType,
          quantityBase: allocation.quantity,
          unitCostBase: allocation.batch.baseUnitCost,
          referenceType: sale.status === "cancelled" ? "sale" : "sale_return",
          referenceId: sale.status === "cancelled" ? saleId : returnId,
          referenceItemId: allocation.saleItemId,
          actorUserId: sale.status === "cancelled" ? sale.sellerId : adminIds[sale.index % adminIds.length]!,
          reason: sale.status === "cancelled" ? "Reposición al lote original por anulación operativa." : "Reposición al lote original por devolución total.",
          createdAt: reversalDate
        });
        if (sale.status === "returned") {
          returnItemRows.push({
            id: `${returnId}-item-${allocationIndex + 1}`,
            saleReturnId: returnId,
            saleItemId: allocation.saleItemId,
            saleItemBatchId: allocation.saleItemBatchId,
            batchId: allocation.batch.id,
            productId: allocation.product.id,
            inventoryMovementId: reversalMovementId,
            quantity: allocation.quantity,
            unitCostBase: allocation.batch.baseUnitCost,
            refundUnitPrice: allocation.unitPrice,
            refundSubtotal: money(allocation.unitPrice * allocation.quantity),
            batchNumber: allocation.batch.batchNumber,
            expirationDate: allocation.batch.expirationDate,
            createdAt: reversalDate
          });
        }
      }
    }

    if (sale.status === "confirmed" && sale.index % 11 === 0) {
      preparedInvoiceNumber += 1;
      const invoiceId = `prepared-invoice-${preparedInvoiceNumber}`;
      const cancelled = preparedInvoiceNumber % 19 === 0;
      const invoiceCustomer = preparedInvoiceNumber % 2 === 0
        ? invoiceCustomers[(Math.floor(preparedInvoiceNumber / 2) - 1) % invoiceCustomers.length]!
        : null;
      preparedInvoiceRows.push({
        id: invoiceId,
        correlativeNumber: preparedInvoiceNumber,
        correlativeCode: `FPI-${String(preparedInvoiceNumber).padStart(7, "0")}`,
        saleId,
        sellerUserId: sale.sellerId,
        status: cancelled ? "cancelled" : "prepared",
        saleCorrelativeCode: `VTA-${String(sale.index).padStart(7, "0")}`,
        cashSessionId: session.id,
        cashSessionCode: `CAJ-${String(session.index).padStart(6, "0")}`,
        sellerName: staff.find((user) => user.id === sale.sellerId)!.fullName,
        sellerEmail: staff.find((user) => user.id === sale.sellerId)!.email,
        customerNit: invoiceCustomer?.[1] ?? "0",
        customerBusinessName: invoiceCustomer?.[0] ?? "Consumidor final",
        fiscalNotes: "Factura preparada interna. No constituye emisión fiscal SIAT.",
        totalAmount,
        preparedAt: addMinutes(sale.confirmedAt, 5),
        cancelledAt: cancelled ? addMinutes(sale.confirmedAt, 30) : null,
        cancelledByUserId: cancelled ? adminIds[preparedInvoiceNumber % adminIds.length]! : null,
        cancelReason: cancelled ? "Datos fiscales proporcionados de forma incorrecta." : null,
        createdAt: addMinutes(sale.confirmedAt, 5)
      });
      for (const [lineIndex, line] of sale.lines.entries()) {
        const product = products[line.productIndex]!;
        const baseUnit = requireUnit(unitByAbbreviation, product.family.baseUnit);
        preparedInvoiceItemRows.push({
          id: `${invoiceId}-item-${lineIndex + 1}`,
          preparedInvoiceId: invoiceId,
          saleItemId: `${saleId}-item-${lineIndex + 1}`,
          productId: product.id,
          internalCode: product.internalCode,
          barcode: product.barcode,
          commercialName: product.commercialName,
          genericName: product.family.genericName,
          baseUnitId: baseUnit.id,
          baseUnitName: baseUnit.name,
          baseUnitAbbreviation: baseUnit.abbreviation,
          unitPrice: product.salePrice,
          quantity: line.quantity,
          subtotal: money(product.salePrice * line.quantity),
          createdAt: addMinutes(sale.confirmedAt, 5)
        });
      }
    }
  }

  for (const product of products.slice(0, 17)) {
    const targetQuantity = product.index < 5 ? 0 : Math.max(1, Math.floor(product.minimumStock * 0.45));
    const productBatches = mutableBatches
      .filter((batch) => batch.productIndex === product.index && batch.availableQuantity > 0)
      .sort((left, right) => left.expirationDate.getTime() - right.expirationDate.getTime());
    let excessQuantity = Math.max(0, productBatches.reduce((total, batch) => total + batch.availableQuantity, 0) - targetQuantity);
    for (const [batchIndex, batch] of productBatches.entries()) {
      if (excessQuantity <= 0) break;
      const adjustmentQuantity = Math.min(batch.availableQuantity, excessQuantity);
      const previousQuantity = batch.availableQuantity;
      batch.availableQuantity -= adjustmentQuantity;
      excessQuantity -= adjustmentQuantity;
      const adjustmentId = `inventory-adjustment-${String(product.index + 1).padStart(3, "0")}-${batchIndex + 1}`;
      inventoryAdjustmentRows.push({
        id: adjustmentId,
        batchId: batch.id,
        productId: product.id,
        previousQuantity,
        countedQuantity: batch.availableQuantity,
        differenceQuantity: -adjustmentQuantity,
        reason: product.index < 5 ? "Conteo físico: producto agotado en estantería y depósito." : "Conteo físico de cierre con diferencia documentada.",
        actorUserId: adminIds[product.index % adminIds.length]!,
        createdAt: atHour(asOf, 6, 45)
      });
      inventoryMovementRows.push({
        id: `inventory-movement-${adjustmentId}`,
        batchId: batch.id,
        productId: product.id,
        type: "inventory_adjustment",
        quantityBase: -adjustmentQuantity,
        unitCostBase: batch.baseUnitCost,
        referenceType: "inventory_adjustment",
        referenceId: adjustmentId,
        actorUserId: adminIds[product.index % adminIds.length]!,
        reason: product.index < 5 ? "Regularización por agotado verificado." : "Regularización posterior a conteo físico.",
        createdAt: atHour(asOf, 6, 45)
      });
    }
  }

  for (const batch of mutableBatches) {
    batch.status = batch.availableQuantity > 0 ? "active" : "depleted";
    inventoryBatchRows.push({
      id: batch.id,
      purchaseItemId: batch.purchaseItemId,
      productId: batch.productId,
      originalQuantity: batch.originalQuantity,
      availableQuantity: batch.availableQuantity,
      baseUnitCost: batch.baseUnitCost,
      batchNumber: batch.batchNumber,
      expirationDate: batch.expirationDate,
      status: batch.status,
      createdAt: batch.receivedAt,
      updatedAt: asOf
    });
  }

  for (const session of sessionPlans) {
    const expectedAmount = money(session.initialAmount + session.expectedAmount);
    const difference = session.closedAt && session.index % 37 === 0 ? (session.index % 2 === 0 ? 1 : -0.5) : 0;
    cashRows.push({
      id: session.id,
      correlativeNumber: session.index,
      correlativeCode: `CAJ-${String(session.index).padStart(6, "0")}`,
      openedByUserId: session.sellerId,
      closedByUserId: session.closedAt ? session.sellerId : null,
      initialAmount: session.initialAmount,
      countedAmount: session.closedAt ? money(expectedAmount + difference) : null,
      expectedAmount,
      differenceAmount: session.closedAt ? difference : null,
      status: session.closedAt ? "closed" : "open",
      openingNote: "Fondo de cambio verificado al inicio del turno.",
      closingNote: session.closedAt ? difference === 0 ? "Cierre conforme, sin diferencia." : "Diferencia menor registrada durante el arqueo." : null,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      createdAt: session.openedAt
    });
  }

  const pendingCartRows: Prisma.PendingCartCreateManyInput[] = [];
  const pendingCartItemRows: Prisma.PendingCartItemCreateManyInput[] = [];
  const recentConfirmedSales = [...salePlans].reverse().filter((sale) => sale.status === "confirmed");
  for (let index = 0; index < 24; index += 1) {
    const status = index < 8 ? "active" : index < 14 ? "expired" : index < 20 ? "discarded" : "converted";
    const createdAt = addDays(asOf, status === "active" ? -1 : -(4 + index));
    const product = products[(index * 17 + 3) % products.length]!;
    const quantity = 1 + (index % 3);
    const cartId = `pending-cart-${String(index + 1).padStart(3, "0")}`;
    const convertedSale = status === "converted"
      ? recentConfirmedSales[index - 20]
      : undefined;
    pendingCartRows.push({
      id: cartId,
      ownerUserId: activeSellerIds[index % activeSellerIds.length]!,
      status,
      name: ["Cotización de tratamiento", "Pedido para recoger", "Consulta de disponibilidad"][index % 3],
      note: "Cotización pendiente; el precio y el stock se validarán nuevamente al momento del cobro.",
      referenceTotalAmount: money(product.salePrice * quantity),
      expiresAt: addDays(createdAt, 3),
      expiredAt: status === "expired" ? addDays(createdAt, 3) : null,
      discardedAt: status === "discarded" ? addDays(createdAt, 1) : null,
      discardReason: status === "discarded" ? "El cliente decidió no completar la compra." : null,
      convertedAt: status === "converted" && convertedSale ? convertedSale.confirmedAt : null,
      convertedSaleId: status === "converted" && convertedSale ? `sale-${String(convertedSale.index).padStart(7, "0")}` : null,
      createdAt
    });
    const baseUnit = requireUnit(unitByAbbreviation, product.family.baseUnit);
    pendingCartItemRows.push({
      id: `${cartId}-item-1`,
      pendingCartId: cartId,
      productId: product.id,
      internalCode: product.internalCode,
      barcode: product.barcode,
      commercialName: product.commercialName,
      genericName: product.family.genericName,
      baseUnitId: baseUnit.id,
      baseUnitName: baseUnit.name,
      baseUnitAbbreviation: baseUnit.abbreviation,
      referenceUnitPrice: product.salePrice,
      quantity,
      referenceSubtotal: money(product.salePrice * quantity),
      createdAt
    });
  }

  for (let index = 0; index < 12; index += 1) {
    const status = index < 7 ? "draft" : "cancelled";
    const purchaseDate = addDays(asOf, -(index * 9 + 2));
    purchaseRows.push({
      id: `purchase-pending-${index + 1}`,
      supplierId: supplierRows[index % supplierRows.length]!.id!,
      purchaseDate,
      status,
      totalAmount: money(350 + index * 87.5),
      createdByUserId: adminIds[index % adminIds.length]!,
      cancelledAt: status === "cancelled" ? addDays(purchaseDate, 1) : null,
      notes: status === "draft" ? "Pedido pendiente de confirmación del proveedor." : "Pedido conservado para trazabilidad.",
      cancelReason: status === "cancelled" ? "Proveedor sin disponibilidad para la fecha requerida." : null,
      createdAt: purchaseDate
    });
  }

  auditRows.push(...staff.map((user, index) => ({
    id: `audit-user-created-${index + 1}`,
    action: "USER_CREATED",
    actorUserId: staff[0]!.id,
    entityType: "User",
    entityId: user.id,
    metadata: { origin: "user_administration", status: user.status, role: user.roleName },
    ipAddress: "127.0.0.1",
    userAgent: "Farmacia POS / Administración de usuarios",
    createdAt: addDays(historyStart, -100 + index)
  })));
  for (let index = 0; index < salePlans.length; index += 97) {
    const sale = salePlans[index]!;
    auditRows.push({
      id: `audit-sale-${sale.index}`,
      action: sale.status === "cancelled" ? "SALE_CANCELLED" : sale.status === "returned" ? "SALE_RETURNED" : "SALE_CONFIRMED",
      actorUserId: sale.sellerId,
      entityType: "Sale",
      entityId: `sale-${String(sale.index).padStart(7, "0")}`,
      metadata: { origin: "point_of_sale", status: sale.status },
      ipAddress: "192.168.10.25",
      userAgent: "Farmacia POS",
      createdAt: sale.confirmedAt
    });
  }

  assertWholeSeedQuantities([
    { label: "minimum stock", values: productRows.map((row) => row.minimumStock) },
    { label: "purchase item quantities", values: purchaseItemRows.flatMap((row) => [row.quantity, row.baseQuantity]) },
    { label: "inventory batch quantities", values: inventoryBatchRows.flatMap((row) => [row.originalQuantity, row.availableQuantity]) },
    { label: "inventory movements", values: inventoryMovementRows.map((row) => row.quantityBase) },
    { label: "inventory adjustments", values: inventoryAdjustmentRows.flatMap((row) => [row.previousQuantity, row.countedQuantity, row.differenceQuantity]) },
    { label: "sale item quantities", values: saleItemRows.map((row) => row.quantity) },
    { label: "sale batch consumptions", values: saleItemBatchRows.map((row) => row.quantity) },
    { label: "returned quantities", values: returnItemRows.map((row) => row.quantity) },
    { label: "prepared invoice quantities", values: preparedInvoiceItemRows.map((row) => row.quantity) },
    { label: "saved sale quantities", values: pendingCartItemRows.map((row) => row.quantity) }
  ]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.product.count({ where: { internalCode: { startsWith: "PRD-" } } });
    if (existing > 0) throw new Error("Operational seed data already exists. Run seed:realistic to rebuild the database from scratch.");

    for (const user of staff.slice(3)) {
      await tx.user.create({
        data: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          passwordHash: user.passwordHash,
          roleId: user.roleId,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      });
    }
    await tx.user.update({ where: { email: "admin@admin.com" }, data: { fullName: staff[0]!.fullName } });
    await tx.user.update({ where: { email: "admin@farmacia.local" }, data: { fullName: staff[1]!.fullName } });
    await tx.user.update({ where: { email: "vendedor@farmacia.local" }, data: { fullName: staff[2]!.fullName } });

    const baseProduct = await tx.product.findUnique({
      where: { internalCode: "MED-0001" },
      select: { id: true, purchaseItems: { select: { purchaseId: true } } }
    });
    if (baseProduct) {
      const purchaseIds = [...new Set(baseProduct.purchaseItems.map((item) => item.purchaseId))];
      await tx.inventoryMovement.deleteMany({ where: { productId: baseProduct.id } });
      await tx.inventoryBatch.deleteMany({ where: { productId: baseProduct.id } });
      await tx.purchaseItem.deleteMany({ where: { productId: baseProduct.id } });
      await tx.product.delete({ where: { id: baseProduct.id } });
      if (purchaseIds.length > 0) await tx.purchase.deleteMany({ where: { id: { in: purchaseIds } } });
    }

    await tx.productCategory.update({
      where: { id: baseCategory.id },
      data: { description: categoryDescription(categories[0]), status: "active" }
    });
    await tx.supplier.update({
      where: { id: baseSupplier.id },
      data: {
        businessName: suppliers[0][0],
        nit: suppliers[0][1],
        phone: supplierRows[0]!.phone,
        address: supplierRows[0]!.address,
        contactName: supplierRows[0]!.contactName,
        status: "active"
      }
    });
    await createInChunks(categoryRows.slice(1), (data) => tx.productCategory.createMany({ data }));
    await createInChunks(supplierRows.slice(1), (data) => tx.supplier.createMany({ data }));
    await createInChunks(productRows, (data) => tx.product.createMany({ data }));
    await createInChunks(productUnitRows, (data) => tx.productUnit.createMany({ data }));
    for (const product of products) {
      await tx.product.update({
        where: { id: product.id },
        data: { preferredRestockUnitId: `${product.id}-restock-unit` }
      });
    }
    await createInChunks(purchaseRows, (data) => tx.purchase.createMany({ data }));
    await createInChunks(purchaseItemRows, (data) => tx.purchaseItem.createMany({ data }));
    await createInChunks(inventoryBatchRows, (data) => tx.inventoryBatch.createMany({ data }));
    await createInChunks(inventoryAdjustmentRows, (data) => tx.inventoryAdjustment.createMany({ data }));
    await createInChunks(cashRows, (data) => tx.cashSession.createMany({ data }));
    await createInChunks(saleRows, (data) => tx.sale.createMany({ data }));
    await createInChunks(saleItemRows, (data) => tx.saleItem.createMany({ data }));
    await createInChunks(inventoryMovementRows, (data) => tx.inventoryMovement.createMany({ data }));
    await createInChunks(saleItemBatchRows, (data) => tx.saleItemBatch.createMany({ data }));
    await createInChunks(paymentRows, (data) => tx.payment.createMany({ data }));
    await createInChunks(preparedInvoiceRows, (data) => tx.preparedInvoice.createMany({ data }));
    await createInChunks(preparedInvoiceItemRows, (data) => tx.preparedInvoiceItem.createMany({ data }));
    await createInChunks(returnRows, (data) => tx.saleReturn.createMany({ data }));
    await createInChunks(returnItemRows, (data) => tx.saleReturnItem.createMany({ data }));
    await createInChunks(pendingCartRows, (data) => tx.pendingCart.createMany({ data }));
    await createInChunks(pendingCartItemRows, (data) => tx.pendingCartItem.createMany({ data }));
    await createInChunks(auditRows, (data) => tx.auditLog.createMany({ data }));
  }, { maxWait: 20_000, timeout: 180_000 });

  console.log("Realistic pharmacy seed completed:");
  console.log(`- Reference date: ${options.asOf}`);
  console.log(`- Deterministic seed: ${options.seed}`);
  console.log(`- Users: ${staff.length} (${staff.filter((user) => user.status === "active").length} active, ${staff.filter((user) => user.status === "inactive").length} inactive, ${staff.filter((user) => user.status === "blocked").length} blocked)`);
  console.log(`- Identified customer profiles: ${invoiceCustomers.length}`);
  console.log(`- Products: ${products.length}`);
  console.log(`- Suppliers: ${supplierRows.length}`);
  console.log(`- Received purchases: ${purchaseRows.filter((purchase) => purchase.status === "received").length}`);
  console.log(`- Cash sessions: ${cashRows.length}`);
  console.log(`- Sales: ${saleRows.length}`);
  console.log(`- Prepared internal invoices: ${preparedInvoiceRows.length}`);
  console.log("- Development credentials keep the password: admin");
}

function family(
  genericName: string,
  category: ProductFamily["category"],
  strengths: string[],
  presentations: string[],
  baseUnit: string,
  type: ProductFamily["type"],
  medicine: boolean,
  otc: boolean,
  prescription: boolean,
  restockFactor: number
): ProductFamily {
  return { genericName, category, strengths, presentations, baseUnit, type, medicine, otc, prescription, restockFactor };
}

function buildProduct(index: number, random: () => number) {
  const family = productFamilies[index % productFamilies.length]!;
  const variant = Math.floor(index / productFamilies.length);
  const strength = family.strengths[variant % family.strengths.length]!;
  const presentation = family.presentations[(variant + index) % family.presentations.length]!;
  const laboratory = laboratories[(index * 5 + variant) % laboratories.length]!;
  const baseUnitCost = money(0.45 + (index % 23) * 0.73 + random() * 2.5);
  const marginRate = family.type === "medical_supply" ? 0.42 : family.type === "hygiene_disinfection" ? 0.38 : 0.32;
  const salePrice = roundToHalf(baseUnitCost * (1 + marginRate));
  return {
    index,
    id: `product-${String(index + 1).padStart(4, "0")}`,
    internalCode: `PRD-${String(index + 1).padStart(4, "0")}`,
    barcode: buildEan13(index),
    commercialName: `${family.genericName} ${strength} ${presentation}`,
    description: `${presentation} de ${family.genericName} ${strength}. Registro con control de lote, vencimiento y dispensación.`,
    family,
    laboratory,
    supplierIndex: index % suppliers.length,
    baseUnitCost,
    salePrice,
    minimumStock: 12 + (index % 7) * 4,
    coverageDays: [15, 30, 45][index % 3]!,
    criticality: family.prescription || index % 17 === 0 ? "high" as const : index % 41 === 0 ? "critical" as const : "normal" as const
  };
}

function buildInvoiceCustomers(count: number): InvoiceCustomer[] {
  const firstNames = ["Alejandra", "Bruno", "Carla", "Diego", "Elena", "Fernando", "Gabriela", "Hugo", "Isabel", "Javier", "Karen", "Luis", "Mariela", "Nicolás", "Paola"];
  const paternalLastNames = ["Rojas", "Mamani", "Flores", "Vargas", "Quispe", "Salvatierra", "Gutiérrez", "Choque", "Rivera", "Fernández", "Arce", "Paredes", "Morales", "Cabrera", "Suárez"];
  const maternalLastNames = ["López", "Rodríguez", "Martínez", "Gómez", "Sánchez", "Romero", "Torrez", "Castillo", "Mendoza", "Aguilar", "Medina", "Ortiz", "Vega", "Castro", "Núñez"];
  const businessTypes = ["Consultorio Médico", "Clínica Familiar", "Centro Integral", "Servicios de Salud", "Comercial Médica"];
  const businessNames = ["Los Pinos", "Vida Plena", "Kantuta", "San Gabriel", "Altiplano"];
  const individualCount = Math.min(count, Math.round(count * 0.75));

  return Array.from({ length: count }, (_, index) => {
    if (index < individualCount) {
      const firstName = firstNames[index % firstNames.length]!;
      const paternalLastName = paternalLastNames[Math.floor(index / firstNames.length) % paternalLastNames.length]!;
      const maternalLastName = maternalLastNames[(index * 7 + Math.floor(index / firstNames.length)) % maternalLastNames.length]!;
      const identificationNumber = String(4_000_000 + index * 7_919);
      return [`${firstName} ${paternalLastName} ${maternalLastName}`, identificationNumber] as const;
    }

    const businessIndex = index - individualCount;
    const businessType = businessTypes[businessIndex % businessTypes.length]!;
    const businessName = businessNames[Math.floor(businessIndex / businessTypes.length) % businessNames.length]!;
    const nit = String(1_000_000_000 + businessIndex * 10_007);
    return [`${businessType} ${businessName} S.R.L.`, nit] as const;
  });
}

function distributeTotalByWeight(weights: number[], total: number) {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (weights.length === 0 || totalWeight <= 0 || total < 0) {
    throw new Error("Cannot distribute sales without positive shift weights.");
  }

  let cumulativeWeight = 0;
  let allocatedTotal = 0;
  return weights.map((weight, index) => {
    cumulativeWeight += weight;
    const cumulativeTarget = index === weights.length - 1
      ? total
      : Math.round(total * cumulativeWeight / totalWeight);
    const allocation = cumulativeTarget - allocatedTotal;
    allocatedTotal = cumulativeTarget;
    return allocation;
  });
}

async function buildStaff(passwordHash: string, roleByName: Map<string, string>, asOf: Date): Promise<StaffUser[]> {
  const base = [
    { id: "", email: "admin@admin.com", fullName: "Gabriela Rojas", roleName: "superadmin" as const },
    { id: "", email: "admin@farmacia.local", fullName: "Mauricio Salvatierra", roleName: "admin" as const },
    { id: "", email: "vendedor@farmacia.local", fullName: "Daniela Flores", roleName: "seller" as const }
  ];
  const existing = await prisma.user.findMany({ where: { email: { in: base.map((user) => user.email) } } });
  for (const user of base) user.id = existing.find((candidate) => candidate.email === user.email)?.id ?? "";
  if (base.some((user) => !user.id)) throw new Error("Base users are missing. Run prisma:seed first.");

  const staff: StaffUser[] = base.map((user, index) => ({
    ...user,
    passwordHash,
    roleId: roleByName.get(user.roleName)!,
    status: "active" as const,
    lastLoginAt: addDays(asOf, -index),
    createdAt: addDays(asOf, -800)
  }));
  for (let index = 3; index < USER_COUNT; index += 1) {
    const status = "active" as const;
    const roleName = "seller" as const;
    const fullName = staffName(index);
    staff.push({
      id: `user-${String(index + 1).padStart(3, "0")}`,
      email: `${slug(fullName)}.${String(index + 1).padStart(2, "0")}@farmacia.local`,
      fullName,
      roleName,
      passwordHash,
      roleId: roleByName.get(roleName)!,
      status,
      lastLoginAt: status === "active" ? addDays(asOf, -(index % 12)) : addDays(asOf, -(120 + index * 7)),
      createdAt: addDays(asOf, -(900 - index * 9))
    });
  }
  return staff;
}

function staffName(index: number) {
  const firstNames = ["Alejandra", "Bruno", "Carla", "Diego", "Elena", "Fernando", "Gabriela", "Hugo", "Isabel", "Javier", "Karen", "Luis", "Mariela", "Nicolás", "Paola", "René", "Sofía", "Tomás", "Valeria", "Walter"];
  const lastNames = ["Rojas", "Mamani", "Flores", "Vargas", "Quispe", "Salvatierra", "Gutiérrez", "Choque", "Rivera", "Fernández", "Arce", "Paredes", "Morales", "Cabrera", "Suárez"];
  return `${firstNames[index % firstNames.length]} ${lastNames[(index * 7) % lastNames.length]}`;
}

function chooseProductIndex(random: () => number, date: Date) {
  const respiratorySeason = date.getUTCMonth() >= 4 && date.getUTCMonth() <= 7;
  if (respiratorySeason && random() < 0.24) return [0, 7, 9, 10, 11, 30][randomInt(random, 0, 5)]!;
  if (random() < 0.18) return randomInt(random, 0, 24);
  return randomInt(random, 0, PRODUCT_COUNT - 9);
}

function categoryDescription(name: string) {
  return `Categoría farmacéutica para ${name.toLocaleLowerCase("es-BO")}.`;
}

function requireUnit(unitByAbbreviation: Map<string, { id: string; name: string; abbreviation: string }>, abbreviation: string) {
  const unit = unitByAbbreviation.get(abbreviation);
  if (!unit) throw new Error(`Missing pharmacy unit ${abbreviation}. Run prisma:seed first.`);
  return unit;
}

function parseArguments(args: string[]) {
  const asOf = readArgument(args, "--as-of") ?? new Date().toISOString().slice(0, 10);
  const seedText = readArgument(args, "--seed") ?? asOf.replaceAll("-", "");
  const seed = Number(seedText);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || dateOnly(asOf).toISOString().slice(0, 10) !== asOf) throw new Error("--as-of must use YYYY-MM-DD.");
  if (!Number.isSafeInteger(seed)) throw new Error("--seed must be a safe integer.");
  return { asOf, seed };
}

function readArgument(args: string[], name: string) {
  const inline = args.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function randomInt(random: () => number, minimum: number, maximum: number) {
  return Math.floor(random() * (maximum - minimum + 1)) + minimum;
}

function buildEan13(index: number) {
  const body = `777${String(100000000 + index).padStart(9, "0")}`;
  const weightedSum = [...body].reduce((sum, digit, position) => {
    return sum + Number(digit) * (position % 2 === 0 ? 1 : 3);
  }, 0);
  const checkDigit = (10 - (weightedSum % 10)) % 10;
  return `${body}${checkDigit}`;
}

function dateOnly(value: string | Date) {
  const text = typeof value === "string" ? value : value.toISOString().slice(0, 10);
  return new Date(`${text}T00:00:00.000Z`);
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60_000);
}

function atHour(value: Date, hour: number, minute: number) {
  const result = dateOnly(value);
  result.setUTCHours(hour, minute, 0, 0);
  return result;
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertWholeSeedQuantities(groups: Array<{ label: string; values: unknown[] }>) {
  for (const group of groups) {
    for (const value of group.values) {
      const quantity = Number(value);
      if (!Number.isSafeInteger(quantity)) {
        throw new Error(`Seed ${group.label} must use whole units. Received ${String(value)}.`);
      }
    }
  }
}

function roundToHalf(value: number) {
  return Math.max(0.5, Math.ceil(value * 2) / 2);
}

function nextCashAmount(total: number) {
  for (const denomination of [5, 10, 20, 50, 100, 200]) {
    if (total <= denomination) return denomination;
  }
  return money(Math.ceil(total / 50) * 50);
}

function slug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
}

async function createInChunks<T>(rows: T[], create: (data: T[]) => Promise<unknown>) {
  const size = 400;
  for (let index = 0; index < rows.length; index += size) await create(rows.slice(index, index + size));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
