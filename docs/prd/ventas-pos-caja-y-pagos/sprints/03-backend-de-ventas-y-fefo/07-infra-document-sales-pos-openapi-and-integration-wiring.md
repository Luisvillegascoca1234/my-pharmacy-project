# Ticket 07 - Document Sales POS OpenAPI And Integration Wiring

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04, 06
- Blocks: 08

## Description

Documentar la API minima de venta POS y conectar sus rutas al enrutamiento principal. La documentacion debe reflejar busqueda vendible, venta confirmada, pago efectivo y detalle de venta sin adelantar anulaciones ni pendientes.

## Scope

- OpenAPI de busqueda POS.
- OpenAPI de creacion de venta.
- OpenAPI de detalle de venta.
- Schemas de request y response compartidos.
- Registro de rutas POS y ventas en la API principal.
- Errores relevantes de caja, pago y stock.

## Out Of Scope

- Documentar anulacion de ventas.
- Documentar carritos pendientes.
- Documentacion de usuario final o tesis.
- Verificacion manual de UI o navegador.
- SIAT, QR, tarjeta o credito.

## Acceptance Criteria

- OpenAPI lista `GET /api/pos/products`.
- OpenAPI lista `POST /api/sales`.
- OpenAPI lista `GET /api/sales/{id}`.
- Cada endpoint documenta autenticacion y roles aplicables.
- Los schemas documentados coinciden con contratos compartidos.
- La API principal registra los prefijos esperados para POS y ventas.
- Los errores principales quedan representados o descritos: caja no abierta, stock insuficiente, pago insuficiente y venta no encontrada.
