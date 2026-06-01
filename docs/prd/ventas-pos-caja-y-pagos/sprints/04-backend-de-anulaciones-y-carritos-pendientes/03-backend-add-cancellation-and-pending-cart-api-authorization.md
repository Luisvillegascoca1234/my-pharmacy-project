# Ticket 03 - Add Cancellation And Pending Cart API Authorization

- Status: TODO
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Exponer la API para anulacion de ventas y gestion de carritos pendientes con autorizacion por rol. La API debe mantener separadas las reglas de vendedor, admin y superadmin, y no abrir superficies fuera de V1.

## Scope

- Endpoint de anulacion de venta con motivo.
- Endpoints de listar, guardar, editar, descartar y convertir pendientes.
- Autenticacion obligatoria.
- Autorizacion de vendedor, admin y superadmin.
- Validacion de entradas con contratos compartidos.
- Respuestas consistentes para venta, pendiente y errores de dominio.

## Out Of Scope

- UI de POS o pendientes.
- Reasignacion de pendientes.
- Endpoints de QR, tarjeta, credito o SIAT.
- Reportes de ventas o caja.
- Devoluciones posteriores al cierre.

## Acceptance Criteria

- `POST /api/sales/:id/cancel` anula venta segun permisos y reglas de caja abierta.
- `GET /api/pending-carts` lista pendientes visibles para el rol autenticado.
- `POST /api/pending-carts` guarda un pendiente propio.
- `PATCH /api/pending-carts/:id` edita un pendiente propio activo.
- `POST /api/pending-carts/:id/discard` descarta pendiente propio o ajeno si el rol lo permite.
- `POST /api/pending-carts/:id/convert` convierte un pendiente propio en venta usando pago efectivo.
- Vendedor no ve, edita ni convierte pendientes ajenos.
- Admin/superadmin pueden supervisar y descartar pendientes ajenos.
- Errores de pendiente expirado, stock insuficiente, producto inactivo y caja faltante son consistentes.
