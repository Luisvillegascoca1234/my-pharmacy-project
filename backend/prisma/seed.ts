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
  }
];

async function main() {
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

  if (!superadminRole) {
    throw new Error("Superadmin role was not created.");
  }

  await Promise.all(
    permissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superadminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: superadminRole.id,
          permissionId: permission.id
        }
      })
    )
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

  console.log("Seed completed. Superadmin: admin@admin.com / admin");
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
