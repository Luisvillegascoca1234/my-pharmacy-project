# Ticket 02 - Add Shared Contracts And Pagination Schemas

- Status: TODO
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 01

## Description

Crear los contratos Zod compartidos que usaran backend y frontend para proveedores, compras, items, recepcion, anulacion y paginacion. Este ticket fija nombres, tipos, coerciones y limites para evitar divergencias cuando se implementen endpoints, stores y formularios en sprints posteriores.

## Scope

- `packages/shared/src/schemas`
- `packages/shared/src/index.ts`
- schemas de proveedor: entidad, creacion, actualizacion, estado, query paginada y respuesta de lista
- schemas de compra: resumen, detalle, item, creacion, actualizacion, recepcion, anulacion, query paginada y respuesta de lista
- schema generico o utilitario de paginacion reutilizable por proveedores y compras
- tipos exportados desde `@pharmacy-pos/shared`

## Out Of Scope

- llamadas HTTP, API clients y facades frontend
- validaciones de negocio que dependen de base de datos, como unidad configurada por producto o producto activo
- services backend, repositories, controllers, routes y OpenAPI
- copy visible de UI, labels, placeholders o mensajes de pantalla

## Acceptance Criteria

- Los schemas usan nombres e identificadores en ingles y mantienen valores de cliente en espanol solo cuando sean datos de dominio visibles.
- La paginacion es 1-based, con `pageSize` default 20 y maximo 100.
- Los filtros cubren proveedores por `search` y `status`, y compras por `search`, `status`, `supplierId`, `fromDate` y `toDate`.
- `purchaseDate` y `expirationDate` se representan como fechas puras en formato compatible con contratos compartidos.
- Dinero usa 2 decimales y cantidades/conversiones/costo base usan 4 decimales a nivel de validacion de entrada cuando aplique.
- Los schemas permiten NIT opcional, `receiveNotes` opcional y `cancelReason` obligatorio para anulacion.
- Los tipos relevantes se exportan desde `packages/shared/src/index.ts` sin exponer detalles internos innecesarios.
