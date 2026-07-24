import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findUniqueOrThrow({ where: { id: "qa-product-growing" } });
  const purchase = await prisma.purchase.findUniqueOrThrow({ where: { id: "qa-stock-planning-received" } });
  const item = await prisma.purchaseItem.upsert({
    where: { id: "qa-received-item-growing-later" },
    update: {},
    create: {
      id: "qa-received-item-growing-later",
      purchaseId: purchase.id,
      productId: product.id,
      unitId: product.baseUnitId,
      quantity: 8,
      unitCost: 2,
      conversionFactor: 1,
      baseQuantity: 8,
      baseUnitCost: 2,
      lineTotal: 16,
      isInventoryTracked: true,
      batchNumber: "QA-GROWING-LATER",
      expirationDate: new Date("2026-08-22T00:00:00.000Z")
    }
  });
  const batch = await prisma.inventoryBatch.upsert({
    where: { purchaseItemId: item.id },
    update: {},
    create: {
      id: "qa-batch-growing-later",
      purchaseItemId: item.id,
      productId: product.id,
      originalQuantity: 8,
      availableQuantity: 8,
      baseUnitCost: 2,
      batchNumber: "QA-GROWING-LATER",
      expirationDate: new Date("2026-08-22T00:00:00.000Z"),
      status: "active"
    }
  });
  const snapshots = await prisma.inventorySnapshot.findMany({
    where: { localDate: { gte: new Date("2026-07-21T00:00:00.000Z") } }
  });
  for (const snapshot of snapshots) {
    if (await prisma.inventorySnapshotLine.findUnique({
      where: { snapshotId_batchId: { snapshotId: snapshot.id, batchId: batch.id } }
    })) continue;
    await prisma.inventorySnapshotLine.create({
      data: {
        snapshotId: snapshot.id,
        productId: product.id,
        batchId: batch.id,
        batchNumber: "QA-GROWING-LATER",
        expirationDate: new Date("2026-08-22T00:00:00.000Z"),
        batchStatus: "active",
        availableQuantity: 8
      }
    });
  }
}

void main().finally(async () => prisma.$disconnect());
