# Ticket 04 - Add Sales API And Authorization

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03
- Blocks: 05

## Description

Exponer la API backend necesaria para buscar productos POS, crear ventas pagadas en efectivo y consultar detalle de venta. La autorizacion debe permitir venta a roles operativos y mantener la supervision de admin/superadmin sin incluir anulacion todavia.

## Scope

- Endpoint de busqueda POS de productos vendibles.
- Endpoint de creacion de venta.
- Endpoint de detalle de venta.
- Autenticacion obligatoria.
- Autorizacion para vendedor, admin y superadmin segun reglas del PRD.
- Validacion de request con contratos compartidos.
- Registro de rutas en la API principal.

## Out Of Scope

- Endpoint de anulacion de venta.
- Endpoints de carritos pendientes.
- Endpoints de QR, tarjeta, credito o SIAT.
- Pantallas POS o navegacion frontend.

## Acceptance Criteria

- `GET /api/pos/products` devuelve productos vendibles usando `PosProductSearchQuerySchema`.
- `POST /api/sales` crea venta con `CreateSaleSchema` y devuelve `SaleSchema`.
- `GET /api/sales/:id` devuelve detalle de venta para el vendedor propietario o para admin/superadmin.
- Vendedor no puede consultar ventas ajenas.
- Admin y superadmin pueden consultar ventas de cualquier vendedor.
- Errores de caja faltante, stock insuficiente y pago insuficiente tienen codigos consistentes.
- La API no expone anulacion ni pendientes en este sprint.
