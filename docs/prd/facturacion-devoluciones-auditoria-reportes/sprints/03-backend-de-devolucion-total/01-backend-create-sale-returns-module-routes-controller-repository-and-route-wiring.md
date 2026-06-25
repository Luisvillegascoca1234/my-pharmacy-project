# Ticket 01 - Create sale returns module routes controller repository and route wiring

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Crear el stack backend base del modulo `returns` para devoluciones administrativas totales. El ticket debe exponer las rutas HTTP planificadas, validar entradas con contratos compartidos, encapsular Prisma en un repository y conectar el modulo al router principal sin mezclar reglas de reportes o UI.

## Scope

- Crear `returns.routes.ts`, `returns.controller.ts`, `returns.service.ts`, `returns.repository.ts` y `returns.types.ts` siguiendo el patron controller -> service -> repository.
- Registrar `GET /returns/returnable-sales`, `GET /returns/sale-returns`, `POST /returns/sale-returns` y `GET /returns/sale-returns/:id`.
- Proteger las rutas con autenticacion y roles `admin` / `superadmin`; `seller` no debe acceder al modulo.
- Usar `ReturnableSalesQuerySchema`, `SaleReturnsQuerySchema`, `CreateTotalSaleReturnSchema` y schemas de respuesta desde `@pharmacy-pos/shared`.
- Preparar selects/includes para venta, pago, caja, items, consumos por lote, factura preparada activa, devolucion existente, usuario actor y movimientos.
- Conectar `returnsRoutes` en `backend/src/routes/index.ts`.

## Out Of Scope

- Reglas finales de elegibilidad y transaccion de devolucion.
- Reportes, CSV, auditoria consultable y pantallas.
- Cambios de persistencia salvo correcciones menores detectadas al integrar.

## Acceptance Criteria

- Las rutas de `returns` existen, compilan y delegan en controller/service sin usar Prisma fuera del repository.
- Los schemas compartidos validan `query`, `body` y respuesta en controller.
- El control de roles deja fuera a `seller` antes de ejecutar reglas de devolucion.
- El repository ofrece metodos para listar ventas candidatas, buscar venta con relaciones, crear devolucion, crear items, actualizar venta/pago/lotes, crear movimientos y escribir auditoria.
- El router principal monta `/returns` sin alterar rutas existentes.
