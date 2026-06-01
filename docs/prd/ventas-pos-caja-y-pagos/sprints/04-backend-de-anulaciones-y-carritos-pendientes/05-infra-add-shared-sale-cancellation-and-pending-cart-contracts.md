# Ticket 05 - Add Shared Sale Cancellation And Pending Cart Contracts

- Status: TODO
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 01, 02, 06

## Description

Agregar los contratos compartidos faltantes para anular ventas y gestionar carritos pendientes. El contrato actual cubre venta confirmada; este ticket amplía estados, entradas y respuestas para reversa operativa y pendientes sin reservar stock.

## Scope

- Estado de venta cancelada.
- Estado de pago cancelado o revertido.
- Entrada de anulacion con motivo obligatorio.
- Carrito pendiente, item pendiente y estados `active`, `converted`, `discarded`, `expired`.
- Guardado, edicion, descarte y conversion de carrito pendiente.
- Listado de pendientes por vendedor y supervision administrativa.
- Campos de precio referencial, precio actual y advertencia de cambio.
- Exportacion publica de schemas y tipos.

## Out Of Scope

- UI de POS o lista de pendientes.
- Reasignacion de carritos pendientes.
- Reserva de stock o congelamiento de precio.
- Devoluciones despues de cierre de caja.
- QR, tarjeta, credito, SIAT o cliente formal.

## Acceptance Criteria

- `SaleStatusSchema` admite venta confirmada y cancelada.
- `PaymentStatusSchema` admite pago pagado y revertido/cancelado segun la nomenclatura final del backend.
- `CancelSaleSchema` exige motivo suficiente para auditoria.
- `SaleSchema` expone datos de anulacion cuando correspondan.
- `PendingCartSchema` representa propietario, nombre, nota, items, total referencial, expiracion, estado y conversion opcional a venta.
- `SavePendingCartSchema` y `EditPendingCartSchema` aceptan items con cantidades enteras positivas.
- `DiscardPendingCartSchema` permite motivo opcional.
- `ConvertPendingCartSchema` reutiliza pago efectivo y no incluye precio congelado.
- Los tipos derivados quedan exportados sin romper contratos de venta confirmada.
