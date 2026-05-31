import bcrypt from "bcryptjs";
import { BASE_ROLES } from "@pharmacy-pos/shared";
import "../src/config/env.js";
import { prisma } from "../src/infrastructure/prisma/prisma.client.js";

const basePermissions = [
  {
    key: "auth.session.read",
    module: "auth",
    description: "Read the current authenticated session"
  },
  {
    key: "roles.manage",
    module: "roles",
    description: "Manage system roles and permissions"
  },
  {
    key: "users.manage",
    module: "users",
    description: "Manage system users"
  },
  {
    key: "catalogs.read",
    module: "catalogs",
    description: "Read product catalogs, units, and products"
  },
  {
    key: "catalogs.manage",
    module: "catalogs",
    description: "Manage product catalogs, units, and products"
  }
];

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

  const permissions = await Promise.all(
    basePermissions.map((permission) =>
      prisma.permission.upsert({
        where: { key: permission.key },
        update: permission,
        create: permission
      })
    )
  );

  const roles = await Promise.all(
    BASE_ROLES.map((roleName) =>
      prisma.role.upsert({
        where: { name: roleName },
        update: {
          displayName: toDisplayName(roleName)
        },
        create: {
          name: roleName,
          displayName: toDisplayName(roleName)
        }
      })
    )
  );

  const superadminRole = roles.find((role) => role.name === "superadmin");
  const adminRole = roles.find((role) => role.name === "admin");
  const sellerRole = roles.find((role) => role.name === "seller");

  if (!superadminRole || !adminRole || !sellerRole) {
    throw new Error("Base roles were not created.");
  }

  await assignPermissions(superadminRole.id, permissions.map((permission) => permission.id));
  await assignPermissions(
    adminRole.id,
    permissions.filter((permission) => ["catalogs.read", "catalogs.manage"].includes(permission.key)).map((permission) => permission.id)
  );
  await assignPermissions(
    sellerRole.id,
    permissions.filter((permission) => permission.key === "catalogs.read").map((permission) => permission.id)
  );

  const passwordHash = await bcrypt.hash("admin", 12);

  await prisma.user.upsert({
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

  await seedPharmacyUnits();

  console.log("Seed completed. Superadmin: admin@admin.com / admin");
}

async function resetDatabase() {
  await prisma.$transaction([
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
    prisma.user.deleteMany(),
    prisma.rolePermission.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.role.deleteMany()
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

function assignPermissions(roleId: string, permissionIds: string[]) {
  return Promise.all(
    permissionIds.map((permissionId) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId
          }
        },
        update: {},
        create: {
          roleId,
          permissionId
        }
      })
    )
  );
}

function toDisplayName(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
