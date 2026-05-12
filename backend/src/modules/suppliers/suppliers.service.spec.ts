import type { CreateSupplier } from "@pharmacy-pos/shared";
import { describe, expect, it } from "vitest";
import { captureHttpError, expectHttpError } from "../../tests/utils/http-error.js";
import { FakeSuppliersRepository, makeSupplierRecord } from "../../tests/utils/service-fakes.js";
import { SuppliersService } from "./suppliers.service.js";

const auditContext = {
  actorUserId: "user-1",
  ipAddress: "127.0.0.1",
  userAgent: "vitest"
};

describe("SuppliersService", () => {
  it("preserves list filters and returns a paginated supplier response", async () => {
    const suppliersRepository = new FakeSuppliersRepository([
      makeSupplierRecord({ id: "supplier-1", businessName: "Farmacia Central", status: "active" }),
      makeSupplierRecord({ id: "supplier-2", businessName: "Laboratorio Norte", status: "active" }),
      makeSupplierRecord({ id: "supplier-3", businessName: "Proveedor Inactivo", status: "inactive" })
    ]);
    const service = new SuppliersService(suppliersRepository);

    const result = await service.listSuppliers({
      search: "o",
      status: "active",
      page: 2,
      pageSize: 1
    });

    expect(suppliersRepository.listSuppliersCalls).toEqual([
      {
        search: "o",
        status: "active",
        page: 2,
        pageSize: 1
      }
    ]);
    expect(result).toEqual({
      data: [
        expect.objectContaining({
          id: "supplier-2",
          businessName: "Laboratorio Norte",
          status: "active"
        })
      ],
      pagination: {
        page: 2,
        pageSize: 1,
        total: 2,
        totalPages: 2
      }
    });
  });

  it("returns supplier detail and maps missing suppliers to SUPPLIER_NOT_FOUND", async () => {
    const suppliersRepository = new FakeSuppliersRepository([
      makeSupplierRecord({ id: "supplier-1", businessName: "Proveedor Central" })
    ]);
    const service = new SuppliersService(suppliersRepository);

    await expect(service.getSupplier("supplier-1")).resolves.toEqual(
      expect.objectContaining({
        id: "supplier-1",
        businessName: "Proveedor Central",
        nit: "123456",
        status: "active"
      })
    );

    const error = await captureHttpError(() => service.getSupplier("missing-supplier"));

    expectHttpError(error, {
      code: "SUPPLIER_NOT_FOUND",
      statusCode: 404
    });
  });

  it("creates suppliers with normalized fields and empty or null NIT without uniqueness checks", async () => {
    const suppliersRepository = new FakeSuppliersRepository();
    const service = new SuppliersService(suppliersRepository);

    const supplierWithEmptyNit = await service.createSupplier(
      {
        businessName: "  Proveedor Sin Nit  ",
        nit: "   ",
        phone: "  70000000  ",
        address: "  Avenida Siempre Viva  ",
        contactName: "  Contacto Uno  ",
        status: "active"
      },
      auditContext
    );
    const supplierWithNullNit = await service.createSupplier(
      {
        businessName: "Proveedor Nulo",
        nit: null,
        status: "inactive"
      } as unknown as CreateSupplier,
      auditContext
    );

    expect(suppliersRepository.findSupplierByNitCalls).toHaveLength(0);
    expect(suppliersRepository.createSupplierCalls).toEqual([
      {
        businessName: "Proveedor Sin Nit",
        nit: null,
        phone: "70000000",
        address: "Avenida Siempre Viva",
        contactName: "Contacto Uno",
        status: "active"
      },
      {
        businessName: "Proveedor Nulo",
        nit: null,
        phone: null,
        address: null,
        contactName: null,
        status: "inactive"
      }
    ]);
    expect(supplierWithEmptyNit.nit).toBeUndefined();
    expect(supplierWithNullNit.nit).toBeUndefined();
    expect(suppliersRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "SUPPLIER_CREATED",
        entityId: supplierWithEmptyNit.id,
        context: auditContext,
        metadata: {
          businessName: "Proveedor Sin Nit",
          nit: null,
          status: "active"
        }
      }),
      expect.objectContaining({
        action: "SUPPLIER_CREATED",
        entityId: supplierWithNullNit.id,
        context: auditContext,
        metadata: {
          businessName: "Proveedor Nulo",
          nit: null,
          status: "inactive"
        }
      })
    ]);
  });

  it("blocks supplier creation when the provided NIT is already in use", async () => {
    const suppliersRepository = new FakeSuppliersRepository([makeSupplierRecord({ id: "supplier-1", nit: "123456" })]);
    const service = new SuppliersService(suppliersRepository);

    const error = await captureHttpError(() =>
      service.createSupplier(
        {
          businessName: "Proveedor Duplicado",
          nit: "123456",
          status: "active"
        },
        auditContext
      )
    );

    expectHttpError(error, {
      code: "SUPPLIER_NIT_IN_USE",
      statusCode: 409
    });
    expect(suppliersRepository.createSupplierCalls).toHaveLength(0);
    expect(suppliersRepository.auditLogs).toHaveLength(0);
  });

  it("updates suppliers, excludes the same supplier from NIT checks, and writes audit metadata", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const suppliersRepository = new FakeSuppliersRepository([
      makeSupplierRecord({
        id: "supplier-1",
        businessName: "Proveedor Central",
        nit: "123456",
        status: "active",
        createdAt,
        updatedAt: createdAt
      })
    ]);
    const service = new SuppliersService(suppliersRepository);

    const supplier = await service.updateSupplier(
      "supplier-1",
      {
        nit: "123456",
        status: "inactive"
      },
      auditContext
    );

    expect(suppliersRepository.findSupplierByNitCalls).toEqual([{ nit: "123456", exceptId: "supplier-1" }]);
    expect(suppliersRepository.updateSupplierCalls).toEqual([
      {
        id: "supplier-1",
        input: {
          businessName: undefined,
          nit: "123456",
          phone: undefined,
          address: undefined,
          contactName: undefined,
          status: "inactive"
        }
      }
    ]);
    expect(supplier).toEqual(
      expect.objectContaining({
        id: "supplier-1",
        businessName: "Proveedor Central",
        nit: "123456",
        status: "inactive",
        createdAt: createdAt.toISOString()
      })
    );
    expect(suppliersRepository.auditLogs).toEqual([
      {
        action: "SUPPLIER_UPDATED",
        entityId: "supplier-1",
        context: auditContext,
        metadata: {
          before: {
            businessName: "Proveedor Central",
            nit: "123456",
            phone: "70000000",
            address: "Avenida Principal",
            contactName: "Contacto Proveedor",
            status: "active"
          },
          after: {
            businessName: "Proveedor Central",
            nit: "123456",
            phone: "70000000",
            address: "Avenida Principal",
            contactName: "Contacto Proveedor",
            status: "inactive"
          }
        }
      }
    ]);
  });

  it("blocks supplier updates when the NIT belongs to another supplier", async () => {
    const suppliersRepository = new FakeSuppliersRepository([
      makeSupplierRecord({ id: "supplier-1", nit: "123456" }),
      makeSupplierRecord({ id: "supplier-2", nit: "654321" })
    ]);
    const service = new SuppliersService(suppliersRepository);

    const error = await captureHttpError(() =>
      service.updateSupplier(
        "supplier-1",
        {
          nit: "654321"
        },
        auditContext
      )
    );

    expectHttpError(error, {
      code: "SUPPLIER_NIT_IN_USE",
      statusCode: 409
    });
    expect(suppliersRepository.updateSupplierCalls).toHaveLength(0);
    expect(suppliersRepository.auditLogs).toHaveLength(0);
  });
});
