import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { BASE_ROLES, RoleNameSchema } from "@pharmacy-pos/shared";
import {
  synchronizeInstitutionalRoles,
  type InstitutionalRoleClient,
  type InstitutionalRoleRecord
} from "../../prisma/institutional-roles.js";
import { openApiDocument } from "../docs/openapi.js";

describe("institutional role persistence", () => {
  it("accepts exactly the three fixed role names", () => {
    expect(BASE_ROLES.every((role) => RoleNameSchema.safeParse(role).success)).toBe(true);
    expect(RoleNameSchema.safeParse("auditor").success).toBe(false);
  });

  it("rejects removed permission fields from authentication and user outputs", async () => {
    const { AuthenticatedUserSchema, UserSchema } = await import("@pharmacy-pos/shared");
    const role = { id: "role-admin", name: "admin", displayName: "Administrador" } as const;
    const authenticatedUser = {
      id: "user-1",
      email: "admin@example.com",
      fullName: "Admin One",
      status: "active",
      role,
      permissions: ["legacy.permission"]
    };
    const user = {
      ...authenticatedUser,
      roleId: role.id,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      permissions: ["legacy.permission"]
    };

    expect(AuthenticatedUserSchema.safeParse(authenticatedUser).success).toBe(false);
    expect(UserSchema.safeParse(user).success).toBe(false);
  });

  it("declares a unique enum-backed role name and removes permission models", async () => {
    const schema = await readFile(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");

    expect(schema).toContain("enum RoleName");
    expect(schema).toMatch(/name\s+RoleName\s+@unique/);
    expect(schema).not.toMatch(/model Permission\s*\{/);
    expect(schema).not.toMatch(/model RolePermission\s*\{/);
  });

  it("keeps the migration progressive while dropping persisted permissions", async () => {
    const migration = await readFile(
      new URL("../../prisma/migrations/20260718134500_restrict_institutional_roles/migration.sql", import.meta.url),
      "utf8"
    );

    expect(migration).toContain('DROP TABLE "RolePermission"');
    expect(migration).toContain('DROP TABLE "Permission"');
    expect(migration).toContain('CREATE TYPE "RoleName" AS ENUM (\'superadmin\', \'admin\', \'seller\')');
    expect(migration).toContain('ALTER COLUMN "name" TYPE "RoleName"');
  });

  it("synchronizes stable identifiers and institutional display names idempotently", async () => {
    const records = new Map<string, InstitutionalRoleRecord>();
    const client: InstitutionalRoleClient = {
      async upsert({ where, update, create }) {
        const existing = records.get(where.name);
        const record = existing
          ? { ...existing, ...update }
          : { id: `stable-${create.name}`, ...create };
        records.set(record.name, record);
        return record;
      }
    };

    const first = await synchronizeInstitutionalRoles(client);
    const second = await synchronizeInstitutionalRoles(client);

    expect([...records.keys()]).toEqual(BASE_ROLES);
    expect(second).toEqual(first);
    expect(second.map((role) => role.id)).toEqual(BASE_ROLES.map((role) => `stable-${role}`));
    expect(second.map((role) => role.displayName)).toEqual(["Superadministrador", "Administrador", "Vendedor"]);
  });

  it("preserves role rows when rebuilding development data", async () => {
    const seed = await readFile(new URL("../../prisma/seed.ts", import.meta.url), "utf8");

    expect(seed).not.toContain("prisma.role.deleteMany()");
  });

  it("documents the fixed enum and incompatible removal of permissions", () => {
    const schemas = openApiDocument.components.schemas as unknown as Record<
      string,
      { required?: readonly string[]; properties?: Readonly<Record<string, unknown>>; enum?: readonly string[] }
    >;

    expect(schemas.RoleName.enum).toEqual(BASE_ROLES);
    expect(schemas.AuthenticatedUser.required).not.toContain("permissions");
    expect(schemas.AuthenticatedUser.properties).not.toHaveProperty("permissions");
    expect(schemas.User.required).not.toContain("permissions");
    expect(schemas.User.properties).not.toHaveProperty("permissions");
  });
});
