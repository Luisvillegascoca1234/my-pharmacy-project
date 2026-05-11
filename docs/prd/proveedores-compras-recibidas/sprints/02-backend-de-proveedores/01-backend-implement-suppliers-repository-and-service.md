# Ticket 01 - Implement Suppliers Repository And Service

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Crear la capa de persistencia y negocio del modulo `suppliers`. El repository debe encapsular Prisma para listas paginadas, busqueda, filtro por estado, detalle, creacion y actualizacion. El service debe aplicar las reglas de dominio del PRD: NIT opcional pero unico cuando existe, proveedores historicos sin borrado fisico, estado `active`/`inactive`, errores de dominio coherentes y auditoria para cambios administrativos.

## Scope

- `backend/src/modules/suppliers/suppliers.repository.ts`
- `backend/src/modules/suppliers/suppliers.service.ts`
- `backend/src/modules/suppliers/suppliers.types.ts`
- uso de `Supplier`, `SupplierStatus`, paginacion y schemas compartidos desde `@pharmacy-pos/shared`
- mapeo de `null` de Prisma a `undefined` solo en DTOs de salida, manteniendo Prisma dentro del repository
- audit logs `SUPPLIER_CREATED` y `SUPPLIER_UPDATED` con `entityType = "supplier"`

## Out Of Scope

- controllers, routes y middleware HTTP
- documentacion OpenAPI
- compras, inventario, recepcion, anulacion y movimientos
- frontend, stores Zustand, formularios o navegacion
- pruebas exhaustivas de compras o inventario

## Acceptance Criteria

- `SuppliersRepository` expone metodos para `listSuppliers`, `findSupplierById`, `findSupplierByNit`, `createSupplier`, `updateSupplier` y `createAuditLog`, sin filtrar Prisma hacia controllers.
- `listSuppliers` soporta `search`, `status`, `page` y `pageSize`, ordena de forma estable y devuelve metadata paginada compatible con `SuppliersListResponseSchema`.
- La busqueda cubre al menos `businessName`, `nit`, `contactName` y `phone` con comparacion insensible a mayusculas cuando PostgreSQL/Prisma lo permita.
- `createSupplier` normaliza valores opcionales (`nit`, `phone`, `address`, `contactName`) y rechaza NIT duplicado con `409` y codigo de error especifico.
- `updateSupplier` devuelve `404` si el proveedor no existe y rechaza NIT duplicado excluyendo el propio proveedor actualizado.
- Desactivar o reactivar un proveedor se resuelve mediante update de `status`; no se agrega borrado fisico.
- El service registra auditoria en creacion y actualizacion con contexto de usuario, IP y user agent cuando el controller lo provea.
- Las reglas quedan en service; las consultas y escritura Prisma quedan en repository.
