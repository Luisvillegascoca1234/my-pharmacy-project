# Ticket 01 - Create prepared invoice billing module routes, controller and repository

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Crear el stack backend base del modulo `billing` para facturas preparadas internas. El ticket debe exponer las rutas HTTP planificadas, validar entradas con contratos compartidos, encapsular Prisma en un repository y conectar el modulo al router principal sin implementar todavia toda la regla de negocio.

## Scope

- Crear `billing.routes.ts`, `billing.controller.ts`, `billing.service.ts`, `billing.repository.ts` y `billing.types.ts` siguiendo el patron controller -> service -> repository.
- Registrar `GET /billing/invoiceable-sales`, `GET /billing/prepared-invoices`, `POST /billing/prepared-invoices`, `GET /billing/prepared-invoices/:id` y `POST /billing/prepared-invoices/:id/cancel`.
- Proteger las rutas con autenticacion y roles `admin` / `superadmin`; `seller` no debe acceder al modulo.
- Usar `InvoiceableSalesQuerySchema`, `PreparedInvoicesQuerySchema`, `PrepareInvoiceFromSaleSchema` y `CancelPreparedInvoiceSchema` desde `@pharmacy-pos/shared`.
- Preparar selects/includes de repository para ventas, pagos, caja, items, facturas activas y usuarios necesarios por los tickets siguientes.
- Conectar `billingRoutes` en `backend/src/routes/index.ts`.

## Out Of Scope

- Reglas finales de elegibilidad y creacion transaccional de facturas.
- Cancelacion funcional de facturas.
- Devoluciones administrativas, reportes, CSV y pantallas.
- Cambios a contratos compartidos salvo correcciones menores detectadas al integrar.

## Acceptance Criteria

- Las rutas de `billing` existen, compilan y delegan en controller/service sin usar Prisma fuera del repository.
- Los schemas compartidos validan `query`, `body` y respuesta en controller.
- El control de roles deja fuera a `seller` antes de ejecutar reglas de facturacion.
- El repository ofrece metodos para listar ventas candidatas, buscar venta con relaciones, listar facturas, buscar factura por id, obtener correlativo y escribir auditoria.
- El router principal monta `/billing` sin alterar rutas existentes.
