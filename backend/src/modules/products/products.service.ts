import type {
  CreateProduct,
  CreateProductCategory,
  Product,
  ProductCategory,
  ProductType,
  UpdateProduct,
  UpdateProductUnits
} from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { ProductsRepository } from "./products.repository.js";
import type { AuditContext, ProductWithRelations } from "./products.types.js";

const productInternalCodePrefixes: Record<ProductType, string> = {
  medicine: "MED",
  otc: "VTL",
  medical_supply: "INM",
  hygiene_disinfection: "HIG",
  related_misc: "REL"
};

export class ProductsService {
  constructor(private readonly productsRepository = new ProductsRepository()) {}

  async listCategories(): Promise<ProductCategory[]> {
    const categories = await this.productsRepository.listCategories();

    return categories.map(toProductCategory);
  }

  async createCategory(input: CreateProductCategory): Promise<ProductCategory> {
    const existingCategory = await this.productsRepository.findCategoryByName(input.name);

    if (existingCategory) {
      throw new HttpError(409, "Product category name is already in use.", "PRODUCT_CATEGORY_NAME_IN_USE");
    }

    const category = await this.productsRepository.createCategory({
      name: input.name,
      description: input.description
    });

    return toProductCategory(category);
  }

  async listProducts(search?: string): Promise<Product[]> {
    const products = await this.productsRepository.listProducts(search);

    return products.map(toProduct);
  }

  async getProduct(id: string): Promise<Product> {
    const product = await this.productsRepository.findProductById(id);

    if (!product) {
      throw new HttpError(404, "Product was not found.", "PRODUCT_NOT_FOUND");
    }

    return toProduct(product);
  }

  async createProduct(input: CreateProduct, context: AuditContext): Promise<Product> {
    await this.ensureProductReferences(input.categoryId, input.baseUnitId, input.supplierId);
    const internalCode = input.internalCode ?? (await this.generateInternalCode(input.type));
    await this.ensureUniqueProductCodes(internalCode, input.barcode);
    this.ensureInventoryRules(input);

    const product = await this.productsRepository.createProduct({
      ...input,
      internalCode,
      barcode: input.barcode ?? null,
      genericName: input.genericName ?? null,
      description: input.description ?? null,
      laboratoryName: input.laboratoryName ?? null,
      sanitaryRegistration: input.sanitaryRegistration ?? null
    });

    await this.productsRepository.createAuditLog("PRODUCT_CREATED", product.id, { internalCode: product.internalCode }, context);

    return toProduct(product);
  }

  async updateProduct(id: string, input: UpdateProduct, context: AuditContext): Promise<Product> {
    const currentProduct = await this.productsRepository.findProductById(id);

    if (!currentProduct) {
      throw new HttpError(404, "Product was not found.", "PRODUCT_NOT_FOUND");
    }

    if (input.categoryId || input.baseUnitId || input.supplierId) {
      await this.ensureProductReferences(
        input.categoryId ?? currentProduct.categoryId,
        input.baseUnitId ?? currentProduct.baseUnitId,
        input.supplierId ?? currentProduct.supplierId
      );
    }

    if (input.internalCode || input.barcode !== undefined) {
      await this.ensureUniqueProductCodes(input.internalCode ?? currentProduct.internalCode, input.barcode, id);
    }

    this.ensureInventoryRules({
      ...toProduct(currentProduct),
      ...input
    });

    const product = await this.productsRepository.updateProduct(id, {
      ...input,
      barcode: input.barcode === undefined ? undefined : input.barcode ?? null,
      genericName: input.genericName === undefined ? undefined : input.genericName ?? null,
      description: input.description === undefined ? undefined : input.description ?? null,
      laboratoryName: input.laboratoryName === undefined ? undefined : input.laboratoryName ?? null,
      sanitaryRegistration: input.sanitaryRegistration === undefined ? undefined : input.sanitaryRegistration ?? null
    });

    await this.productsRepository.createAuditLog("PRODUCT_UPDATED", product.id, buildProductAuditMetadata(currentProduct, product), context);

    return toProduct(product);
  }

  async updateProductUnits(id: string, input: UpdateProductUnits, context: AuditContext): Promise<Product> {
    const product = await this.productsRepository.findProductById(id);

    if (!product) {
      throw new HttpError(404, "Product was not found.", "PRODUCT_NOT_FOUND");
    }

    const unitIds = new Set(input.units.map((unit) => unit.unitId));

    if (unitIds.size !== input.units.length) {
      throw new HttpError(400, "Product units cannot contain duplicates.", "DUPLICATED_PRODUCT_UNITS");
    }

    if (!unitIds.has(product.baseUnitId)) {
      throw new HttpError(400, "Product units must include the base unit.", "BASE_UNIT_REQUIRED");
    }

    for (const unitId of unitIds) {
      const unit = await this.productsRepository.findUnitById(unitId);

      if (!unit) {
        throw new HttpError(400, "One or more units do not exist.", "UNIT_NOT_FOUND");
      }
    }

    const normalizedUnits = input.units.map((unit) => ({
      unitId: unit.unitId,
      conversionFactor: unit.unitId === product.baseUnitId ? 1 : unit.conversionFactor
    }));

    const updatedProduct = await this.productsRepository.replaceProductUnits(id, normalizedUnits);

    if (!updatedProduct) {
      throw new HttpError(404, "Product was not found.", "PRODUCT_NOT_FOUND");
    }

    await this.productsRepository.createAuditLog("PRODUCT_UNITS_UPDATED", id, { units: normalizedUnits }, context);

    return toProduct(updatedProduct);
  }

  private async ensureProductReferences(categoryId: string, baseUnitId: string, supplierId: string) {
    const [category, unit, supplier] = await Promise.all([
      this.productsRepository.findCategoryById(categoryId),
      this.productsRepository.findUnitById(baseUnitId),
      this.productsRepository.findSupplierById(supplierId)
    ]);

    if (!category) {
      throw new HttpError(400, "Product category does not exist.", "PRODUCT_CATEGORY_NOT_FOUND");
    }

    if (!unit) {
      throw new HttpError(400, "Base unit does not exist.", "BASE_UNIT_NOT_FOUND");
    }

    if (!supplier) {
      throw new HttpError(400, "Supplier does not exist.", "SUPPLIER_NOT_FOUND");
    }

    if (supplier.status !== "active") {
      throw new HttpError(400, "Supplier must be active.", "SUPPLIER_NOT_ACTIVE");
    }
  }

  private async ensureUniqueProductCodes(internalCode: string, barcode?: string, exceptId?: string) {
    const existingInternalCode = await this.productsRepository.findProductByInternalCode(internalCode, exceptId);

    if (existingInternalCode) {
      throw new HttpError(409, "Product internal code is already in use.", "PRODUCT_INTERNAL_CODE_IN_USE");
    }

    if (barcode) {
      const existingBarcode = await this.productsRepository.findProductByBarcode(barcode, exceptId);

      if (existingBarcode) {
        throw new HttpError(409, "Product barcode is already in use.", "PRODUCT_BARCODE_IN_USE");
      }
    }
  }

  private ensureInventoryRules(input: { isInventoryTracked: boolean; requiresBatch: boolean; requiresExpiration: boolean }) {
    if (input.isInventoryTracked && (!input.requiresBatch || !input.requiresExpiration)) {
      throw new HttpError(
        400,
        "Inventory tracked products must require batch and expiration date.",
        "PRODUCT_BATCH_EXPIRATION_REQUIRED"
      );
    }
  }

  private async generateInternalCode(type: ProductType) {
    const prefix = productInternalCodePrefixes[type];
    const products = await this.productsRepository.listProductsByInternalCodePrefix(prefix);
    const latestSequence = products.reduce(
      (currentMax, product) => Math.max(currentMax, getInternalCodeSequence(product.internalCode, prefix)),
      0
    );

    return `${prefix}-${String(latestSequence + 1).padStart(6, "0")}`;
  }
}

function getInternalCodeSequence(internalCode: string, prefix: string) {
  const match = new RegExp(`^${prefix}-(\\d+)$`, "i").exec(internalCode);

  return match ? Number(match[1]) : 0;
}

function toProductCategory(category: {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}): ProductCategory {
  return {
    id: category.id,
    name: category.name,
    description: category.description ?? undefined,
    status: category.status,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString()
  };
}

function toUnit(unit: {
  id: string;
  name: string;
  abbreviation: string;
  description: string | null;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: unit.id,
    name: unit.name,
    abbreviation: unit.abbreviation,
    description: unit.description ?? undefined,
    status: unit.status,
    createdAt: unit.createdAt.toISOString(),
    updatedAt: unit.updatedAt.toISOString()
  };
}

function toProduct(product: ProductWithRelations): Product {
  return {
    id: product.id,
    internalCode: product.internalCode,
    barcode: product.barcode ?? undefined,
    commercialName: product.commercialName,
    genericName: product.genericName ?? undefined,
    description: product.description ?? undefined,
    type: product.type,
    categoryId: product.categoryId,
    category: toProductCategory(product.category),
    baseUnitId: product.baseUnitId,
    baseUnit: toUnit(product.baseUnit),
    supplierId: product.supplierId,
    supplier: {
      id: product.supplier.id,
      businessName: product.supplier.businessName,
      nit: product.supplier.nit ?? undefined,
      status: product.supplier.status
    },
    laboratoryName: product.laboratoryName ?? undefined,
    sanitaryRegistration: product.sanitaryRegistration ?? undefined,
    isMedicine: product.isMedicine,
    isOverTheCounter: product.isOverTheCounter,
    requiresPrescription: product.requiresPrescription,
    isInventoryTracked: product.isInventoryTracked,
    requiresBatch: product.requiresBatch,
    requiresExpiration: product.requiresExpiration,
    minimumStock: Number(product.minimumStock),
    salePrice: Number(product.salePrice),
    status: product.status,
    units: product.units.map((productUnit) => ({
      id: productUnit.id,
      productId: productUnit.productId,
      unitId: productUnit.unitId,
      unit: toUnit(productUnit.unit),
      conversionFactor: Number(productUnit.conversionFactor),
      createdAt: productUnit.createdAt.toISOString(),
      updatedAt: productUnit.updatedAt.toISOString()
    })),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

function buildProductAuditMetadata(before: ProductWithRelations, after: ProductWithRelations) {
  return {
    before: {
      salePrice: Number(before.salePrice),
      supplierId: before.supplierId,
      status: before.status
    },
    after: {
      salePrice: Number(after.salePrice),
      supplierId: after.supplierId,
      status: after.status
    }
  };
}
