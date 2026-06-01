# Ticket 06 - Add Shared Sales POS Contracts

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 01, 07

## Description

Agregar los contratos compartidos faltantes para ventas POS, busqueda de productos vendibles, pago efectivo, consumo FEFO y comprobante interno. El sprint anterior dejo contratos de caja; este ticket completa la superficie contractual necesaria para crear ventas confirmadas sin incluir anulaciones ni pendientes.

## Scope

- Estados de venta y pago en V1.
- Producto vendible para POS con stock total y proximo vencimiento.
- Query de busqueda POS por texto o codigo.
- Item de venta, consumo por lote/capa y pago efectivo.
- Creacion de venta con items y monto recibido.
- Detalle de venta y comprobante interno.
- Respuesta paginada o limitada de productos POS.
- Exportacion publica de schemas y tipos.

## Out Of Scope

- Contratos de anulacion de ventas.
- Contratos de carritos pendientes.
- Contratos de QR, tarjeta, pagos mixtos, credito o SIAT.
- Formularios, pantalla POS o estado cliente.
- Reglas transaccionales de FEFO o pago.

## Acceptance Criteria

- `PosProductSchema` expone identificadores, codigos, nombres, precio, unidad base, stock vendible y proximo vencimiento.
- `PosProductSearchQuerySchema` acepta busqueda textual y busqueda por codigo con paginacion compatible con el repo.
- `CreateSaleSchema` exige al menos un item, cantidades enteras positivas y pago efectivo.
- `PaymentSchema` limita V1 a `cash`, registra total de venta, monto recibido, cambio, estado y fecha de pago.
- `SaleItemSchema` conserva precio, cantidad, subtotal, costo total, margen y consumos FEFO.
- `SaleBatchConsumptionSchema` conserva capa/lote, cantidad, costo unitario y movimiento de inventario opcional.
- `SaleSchema` representa venta anonima confirmada con vendedor, caja, items, pago, totales, margen y comprobante interno.
- Los tipos derivados quedan exportados sin romper contratos de caja existentes.
