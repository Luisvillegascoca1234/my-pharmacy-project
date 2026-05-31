import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type { AuditContext, ProductWithRelations } from "./products.types.js";

const productInclude = {
  category: true,
  baseUnit: true,
  supplier: true,
  units: {
    include: {
      unit: true
    },
    orderBy: {
      unit: {
        name: "asc"
      }
    }
  }
} satisfies Prisma.ProductInclude;

type PrismaClient = typeof prisma;
type PrismaTransaction = Prisma.TransactionClient;
type Client = PrismaClient | PrismaTransaction;

export class ProductsRepository {
  listCategories() {
    return prisma.productCategory.findMany({
      orderBy: {
        name: "asc"
      }
    });
  }

  findCategoryByName(name: string) {
    return prisma.productCategory.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive"
        }
      }
    });
  }

  createCategory(input: Prisma.ProductCategoryCreateInput) {
    return prisma.productCategory.create({
      data: input
    });
  }

  listProducts(search?: string): Promise<ProductWithRelations[]> {
    const normalizedSearch = search?.trim();

    return prisma.product.findMany({
      where: normalizedSearch
        ? {
            OR: [
              { commercialName: { contains: normalizedSearch, mode: "insensitive" } },
              { genericName: { contains: normalizedSearch, mode: "insensitive" } },
              { internalCode: { contains: normalizedSearch, mode: "insensitive" } },
              { barcode: { contains: normalizedSearch, mode: "insensitive" } }
            ]
          }
        : undefined,
      include: productInclude,
      orderBy: {
        commercialName: "asc"
      }
    });
  }

  findProductById(id: string, client: Client = prisma): Promise<ProductWithRelations | null> {
    return client.product.findUnique({
      where: { id },
      include: productInclude
    });
  }

  findProductByInternalCode(internalCode: string, exceptId?: string) {
    return prisma.product.findFirst({
      where: {
        internalCode: {
          equals: internalCode,
          mode: "insensitive"
        },
        id: exceptId ? { not: exceptId } : undefined
      }
    });
  }

  listProductsByInternalCodePrefix(prefix: string) {
    return prisma.product.findMany({
      where: {
        internalCode: {
          startsWith: `${prefix}-`,
          mode: "insensitive"
        }
      },
      select: {
        internalCode: true
      },
      orderBy: {
        internalCode: "desc"
      }
    });
  }

  findProductByBarcode(barcode: string, exceptId?: string) {
    return prisma.product.findFirst({
      where: {
        barcode,
        id: exceptId ? { not: exceptId } : undefined
      }
    });
  }

  findCategoryById(id: string) {
    return prisma.productCategory.findUnique({
      where: { id }
    });
  }

  findUnitById(id: string) {
    return prisma.unit.findUnique({
      where: { id }
    });
  }

  findSupplierById(id: string) {
    return prisma.supplier.findUnique({
      where: { id }
    });
  }

  createProduct(input: Prisma.ProductUncheckedCreateInput): Promise<ProductWithRelations> {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: input
      });

      await this.upsertBaseProductUnit(product.id, product.baseUnitId, tx);

      return this.findProductByIdOrThrow(product.id, tx);
    });
  }

  updateProduct(id: string, input: Prisma.ProductUncheckedUpdateInput): Promise<ProductWithRelations> {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: input
      });

      await this.upsertBaseProductUnit(product.id, product.baseUnitId, tx);

      return this.findProductByIdOrThrow(product.id, tx);
    });
  }

  replaceProductUnits(productId: string, units: Array<{ unitId: string; conversionFactor: number }>) {
    return prisma.$transaction(async (tx) => {
      await tx.productUnit.deleteMany({
        where: { productId }
      });

      if (units.length > 0) {
        await tx.productUnit.createMany({
          data: units.map((unit) => ({
            productId,
            unitId: unit.unitId,
            conversionFactor: unit.conversionFactor
          }))
        });
      }

      return this.findProductById(productId, tx);
    });
  }

  createAuditLog(action: string, entityId: string, metadata: unknown, context: AuditContext) {
    return prisma.auditLog.create({
      data: {
        action,
        actorUserId: context.actorUserId,
        entityType: "product",
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    });
  }

  private async upsertBaseProductUnit(productId: string, baseUnitId: string, client: Client) {
    await client.productUnit.upsert({
      where: {
        productId_unitId: {
          productId,
          unitId: baseUnitId
        }
      },
      create: {
        productId,
        unitId: baseUnitId,
        conversionFactor: 1
      },
      update: {
        conversionFactor: 1
      }
    });
  }

  private async findProductByIdOrThrow(id: string, client: Client): Promise<ProductWithRelations> {
    const product = await this.findProductById(id, client);

    if (!product) {
      throw new Error("Product was not found after write.");
    }

    return product;
  }
}
