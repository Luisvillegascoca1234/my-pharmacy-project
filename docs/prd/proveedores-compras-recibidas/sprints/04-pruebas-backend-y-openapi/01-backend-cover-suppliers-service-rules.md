# Ticket 01 - Cover Suppliers Service Rules

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04
- Blocks: 06

## Description

Agregar pruebas enfocadas para el service de proveedores, cubriendo las reglas de negocio ya implementadas en el mini-stack `suppliers`: NIT opcional pero unico cuando existe, busqueda paginada, detalle, creacion, actualizacion de estado y auditoria. Las pruebas deben aislar Express y Prisma mediante fakes o utilidades del runner configurado en este sprint.

## Scope

- `backend/src/modules/suppliers/suppliers.service.ts`
- tests backend para `suppliers`
- fakes del repository de proveedores cuando sean necesarios
- reglas de errores `SUPPLIER_NOT_FOUND` y `SUPPLIER_NIT_IN_USE`
- auditoria `SUPPLIER_CREATED` y `SUPPLIER_UPDATED`

## Out Of Scope

- cambios funcionales en endpoints de proveedores
- pruebas E2E con HTTP real
- UI de proveedores, rutas frontend o stores Zustand
- cambios de schema Prisma o migraciones

## Acceptance Criteria

- Las pruebas verifican que `listSuppliers` conserve `search`, `status`, `page` y `pageSize`, y devuelva la respuesta paginada esperada.
- `getSupplier` devuelve detalle cuando existe y emite `404` con codigo coherente cuando no existe.
- `createSupplier` permite NIT vacio o nulo, normaliza campos segun la regla actual y bloquea NIT duplicado cuando existe.
- `updateSupplier` bloquea NIT duplicado excluyendo el propio proveedor y permite cambiar `status` sin borrar historial.
- Creacion y actualizacion generan auditoria con actor, IP y user agent cuando el service recibe ese contexto.
- Las pruebas no importan Express ni Prisma Client directamente desde el test del service.
