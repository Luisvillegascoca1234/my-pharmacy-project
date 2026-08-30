import bcrypt from "bcryptjs";
import "../src/config/env.js";
import { prisma } from "../src/infrastructure/prisma/prisma.client.js";
import { synchronizeInstitutionalRoles } from "./institutional-roles.js";

const pharmacyUnits = [
  {
    name: "Unidad",
    abbreviation: "UND",
    description: "Unidad individual para productos que no requieren una presentacion mas especifica."
  },
  {
    name: "Caja",
    abbreviation: "CJ",
    description: "Presentacion comercial cerrada que agrupa blisters, frascos, ampollas u otras unidades."
  },
  {
    name: "Blister",
    abbreviation: "BL",
    description: "Lamina de comprimidos, capsulas o tabletas con alvejolos individuales."
  },
  {
    name: "Comprimido",
    abbreviation: "COMP",
    description: "Forma solida oral comprimida."
  },
  {
    name: "Tableta",
    abbreviation: "TAB",
    description: "Forma solida oral presentada como tableta."
  },
  {
    name: "Capsula",
    abbreviation: "CAP",
    description: "Forma solida oral encapsulada."
  },
  {
    name: "Gragea",
    abbreviation: "GRA",
    description: "Forma solida oral recubierta."
  },
  {
    name: "Sobre",
    abbreviation: "SOB",
    description: "Dosis unitaria en polvo, granulado o solucion oral."
  },
  {
    name: "Sachet",
    abbreviation: "SACH",
    description: "Envase flexible de dosis unitaria para geles, polvos, cremas o soluciones."
  },
  {
    name: "Frasco",
    abbreviation: "FCO",
    description: "Envase para jarabes, soluciones, suspensiones, gotas u otros liquidos."
  },
  {
    name: "Frasco ampolla",
    abbreviation: "FAMP",
    description: "Envase esteril para medicamentos inyectables que requieren reconstitucion o extraccion."
  },
  {
    name: "Ampolla",
    abbreviation: "AMP",
    description: "Envase esteril de dosis unitaria para inyectables."
  },
  {
    name: "Vial",
    abbreviation: "VIAL",
    description: "Envase pequeno esteril para medicamentos inyectables."
  },
  {
    name: "Tubo",
    abbreviation: "TUB",
    description: "Envase para cremas, geles, pomadas o pastas."
  },
  {
    name: "Pomo",
    abbreviation: "POM",
    description: "Presentacion semisolida para cremas, unguentos o pomadas."
  },
  {
    name: "Envase",
    abbreviation: "ENV",
    description: "Contenedor comercial cuando la presentacion no coincide con otra unidad especifica."
  },
  {
    name: "Bolsa",
    abbreviation: "BOL",
    description: "Presentacion flexible para soluciones, insumos o material descartable."
  },
  {
    name: "Paquete",
    abbreviation: "PAQ",
    description: "Agrupacion comercial de varias unidades o insumos."
  },
  {
    name: "Rollo",
    abbreviation: "ROL",
    description: "Presentacion enrollada para vendas, gasas, cintas o materiales similares."
  },
  {
    name: "Par",
    abbreviation: "PAR",
    description: "Unidad doble para guantes, medias u otros productos vendidos por par."
  },
  {
    name: "Kit",
    abbreviation: "KIT",
    description: "Conjunto de insumos o productos empacados para un uso especifico."
  },
  {
    name: "Jeringa",
    abbreviation: "JER",
    description: "Dispositivo descartable para administracion o extraccion de liquidos."
  },
  {
    name: "Gotero",
    abbreviation: "GOT",
    description: "Presentacion con dispensador de gotas."
  },
  {
    name: "Spray",
    abbreviation: "SPY",
    description: "Presentacion con aplicador en aerosol o atomizador."
  },
  {
    name: "Inhalador",
    abbreviation: "INH",
    description: "Dispositivo para administracion de medicamentos por via inhalatoria."
  },
  {
    name: "Ovulo",
    abbreviation: "OVU",
    description: "Forma farmaceutica vaginal de dosis unitaria."
  },
  {
    name: "Supositorio",
    abbreviation: "SUP",
    description: "Forma farmaceutica rectal de dosis unitaria."
  },
  {
    name: "Parche",
    abbreviation: "PCH",
    description: "Presentacion transdermica o adhesiva por unidad."
  },
  {
    name: "Mililitro",
    abbreviation: "ML",
    description: "Unidad de volumen para liquidos."
  },
  {
    name: "Litro",
    abbreviation: "L",
    description: "Unidad de volumen para liquidos en mayor cantidad."
  },
  {
    name: "Gramo",
    abbreviation: "G",
    description: "Unidad de masa para polvos, cremas, geles o magistrales."
  },
  {
    name: "Kilogramo",
    abbreviation: "KG",
    description: "Unidad de masa para presentaciones de mayor volumen."
  },
  {
    name: "Metro",
    abbreviation: "M",
    description: "Unidad de longitud para material sanitario vendido por medida."
  }
];

async function main() {
  await resetDatabase();

  const roles = await synchronizeInstitutionalRoles(prisma.role);

  const superadminRole = roles.find((role) => role.name === "superadmin");
  const adminRole = roles.find((role) => role.name === "admin");
  const sellerRole = roles.find((role) => role.name === "seller");

  if (!superadminRole || !adminRole || !sellerRole) {
    throw new Error("Base roles were not created.");
  }

  const passwordHash = await bcrypt.hash("admin", 12);

  const superadminUser = await prisma.user.upsert({
    where: {
      email: "admin@admin.com"
    },
    update: {
      fullName: "Development Superadmin",
      passwordHash,
      roleId: superadminRole.id,
      status: "active"
    },
    create: {
      email: "admin@admin.com",
      fullName: "Development Superadmin",
      passwordHash,
      roleId: superadminRole.id,
      status: "active"
    }
  });

  const adminUser = await seedDevelopmentUser({
    email: "admin@farmacia.local",
    fullName: "Administrador de farmacia",
    passwordHash,
    roleId: adminRole.id
  });
  const sellerUser = await seedDevelopmentUser({
    email: "vendedor@farmacia.local",
    fullName: "Vendedor de mostrador",
    passwordHash,
    roleId: sellerRole.id
  });

  await seedPharmacyUnits();
  await seedOperationalPharmacy({
    adminUserId: adminUser.id,
    sellerUserId: sellerUser.id,
    superadminUserId: superadminUser.id
  });

  console.log("Seed completed. Development credentials (password: admin):");
  console.log("- Superadmin: admin@admin.com");
  console.log("- Admin: admin@farmacia.local");
  console.log("- Seller: vendedor@farmacia.local");
}

function seedDevelopmentUser(input: {
  email: string;
  fullName: string;
  passwordHash: string;
  roleId: string;
}) {
  return prisma.user.upsert({
    where: {
      email: input.email
    },
    update: {
      fullName: input.fullName,
      passwordHash: input.passwordHash,
      roleId: input.roleId,
      status: "active"
    },
    create: {
      email: input.email,
      fullName: input.fullName,
      passwordHash: input.passwordHash,
      roleId: input.roleId,
      status: "active"
    }
  });
}

async function resetDatabase() {
  await prisma.$transaction([
    prisma.$executeRaw`TRUNCATE TABLE "StockPlanningConfiguration", "InventorySnapshot" CASCADE`,
    prisma.saleReturnItem.deleteMany(),
    prisma.saleReturn.deleteMany(),
    prisma.preparedInvoiceItem.deleteMany(),
    prisma.preparedInvoice.deleteMany(),
    prisma.pendingCartItem.deleteMany(),
    prisma.pendingCart.deleteMany(),
    prisma.saleItemBatch.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.saleItem.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.cashSession.deleteMany(),
    prisma.inventoryAdjustment.deleteMany(),
    prisma.inventoryMovement.deleteMany(),
    prisma.inventoryBatch.deleteMany(),
    prisma.purchaseItem.deleteMany(),
    prisma.purchase.deleteMany(),
    prisma.productUnit.deleteMany(),
    prisma.product.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.productCategory.deleteMany(),
    prisma.unit.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.user.deleteMany()
  ]);
}

async function seedPharmacyUnits() {
  for (const unit of pharmacyUnits) {
    const existingUnit = await prisma.unit.findFirst({
      where: {
        OR: [{ name: unit.name }, { abbreviation: unit.abbreviation }]
      }
    });

    if (existingUnit) {
      await prisma.unit.update({
        where: {
          id: existingUnit.id
        },
        data: unit
      });
      continue;
    }

    await prisma.unit.create({
      data: unit
    });
  }
}

async function seedOperationalPharmacy(input: {
  adminUserId: string;
  sellerUserId: string;
  superadminUserId: string;
}) {
  const baseUnit = await prisma.unit.findUniqueOrThrow({
    where: {
      abbreviation: "UND"
    }
  });
  const expirationDate = new Date(Date.UTC(new Date().getUTCFullYear() + 2, 11, 31));

  await prisma.$transaction(async (tx) => {
    await tx.stockPlanningConfiguration.create({
      data: {
        version: 1,
        createdByUserId: input.superadminUserId
      }
    });

    const category = await tx.productCategory.create({
      data: {
        name: "Analgésicos y antipiréticos",
        description: "Medicamentos para el alivio del dolor y la reducción de la fiebre.",
        status: "active"
      }
    });
    const supplier = await tx.supplier.create({
      data: {
        businessName: "Distribuidora Farmacéutica Demo",
        nit: "1020304050",
        phone: "70000000",
        address: "Santa Cruz de la Sierra",
        contactName: "Representante comercial",
        status: "active"
      }
    });
    const product = await tx.product.create({
      data: {
        internalCode: "MED-0001",
        barcode: "7770000000011",
        commercialName: "Paracetamol 500 mg",
        genericName: "Paracetamol",
        description: "Comprimido analgésico y antipirético de dispensación habitual.",
        type: "medicine",
        categoryId: category.id,
        baseUnitId: baseUnit.id,
        supplierId: supplier.id,
        laboratoryName: "Laboratorio Demo",
        sanitaryRegistration: "REG-DEMO-001",
        isMedicine: true,
        isOverTheCounter: true,
        requiresPrescription: false,
        minimumStock: 20,
        salePrice: 5,
        status: "active",
        units: {
          create: {
            unitId: baseUnit.id,
            conversionFactor: 1
          }
        }
      }
    });
    const purchase = await tx.purchase.create({
      data: {
        supplierId: supplier.id,
        purchaseDate: new Date(),
        status: "received",
        totalAmount: 200,
        createdByUserId: input.adminUserId,
        receivedByUserId: input.adminUserId,
        receivedAt: new Date(),
        notes: "Compra inicial generada por el seed de desarrollo.",
        receiveNotes: "Stock operativo inicial para pruebas y demostraciones.",
        items: {
          create: {
            productId: product.id,
            unitId: baseUnit.id,
            quantity: 100,
            unitCost: 2,
            conversionFactor: 1,
            baseQuantity: 100,
            baseUnitCost: 2,
            lineTotal: 200,
            isInventoryTracked: true,
            batchNumber: "LOTE-DEMO-001",
            expirationDate
          }
        }
      },
      include: {
        items: true
      }
    });
    const purchaseItem = purchase.items[0];

    if (!purchaseItem) {
      throw new Error("The development purchase item was not created.");
    }

    const batch = await tx.inventoryBatch.create({
      data: {
        purchaseItemId: purchaseItem.id,
        productId: product.id,
        originalQuantity: 100,
        availableQuantity: 100,
        baseUnitCost: 2,
        batchNumber: "LOTE-DEMO-001",
        expirationDate,
        status: "active"
      }
    });

    await tx.inventoryMovement.create({
      data: {
        batchId: batch.id,
        productId: product.id,
        type: "purchase_received",
        quantityBase: 100,
        unitCostBase: 2,
        referenceType: "purchase",
        referenceId: purchase.id,
        referenceItemId: purchaseItem.id,
        actorUserId: input.adminUserId,
        reason: "Stock operativo inicial del entorno de desarrollo."
      }
    });
    await tx.auditLog.createMany({
      data: [
        {
          action: "PURCHASE_RECEIVED",
          actorUserId: input.adminUserId,
          entityType: "Purchase",
          entityId: purchase.id,
          metadata: {
            source: "development_seed",
            totalAmount: 200
          }
        },
        {
          action: "DEVELOPMENT_SEED_COMPLETED",
          actorUserId: input.superadminUserId,
          entityType: "User",
          entityId: input.sellerUserId,
          metadata: {
            productCode: product.internalCode,
            sellerReady: true
          }
        }
      ]
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
