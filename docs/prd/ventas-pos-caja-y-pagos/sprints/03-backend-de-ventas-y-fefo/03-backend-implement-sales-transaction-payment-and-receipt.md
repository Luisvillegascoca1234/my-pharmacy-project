# Ticket 03 - Implement Sales Transaction Payment And Receipt

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Implementar la creacion transaccional de venta POS pagada en efectivo. La venta debe exigir caja abierta del vendedor, validar items, registrar pago, aplicar FEFO, calcular totales y devolver detalle con comprobante interno.

## Scope

- Validacion de usuario autenticado y caja abierta propia.
- Creacion de correlativo interno de venta.
- Snapshot de producto, precio, cantidad, subtotal, costo y margen por item.
- Pago efectivo con monto recibido y cambio.
- Relacion de venta y pago con la caja abierta.
- Calculo de total, costo total y margen total.
- Comprobante interno no fiscal.
- Auditoria de venta confirmada.

## Out Of Scope

- Anulacion de ventas.
- Conversion de carritos pendientes.
- Cliente formal, NIT o razon social.
- Descuentos, impuestos visibles, QR, tarjeta o credito.
- UI o impresion real del comprobante.

## Acceptance Criteria

- Crear venta sin caja abierta devuelve error de conflicto o regla de negocio clara.
- Crear venta con caja cerrada o ajena no se permite.
- El monto recibido debe ser igual o mayor al total.
- El cambio se calcula como monto recibido menos total de venta.
- La caja asociada queda ligada a venta y pago.
- La venta se crea con estado `confirmed`.
- La operacion completa ocurre dentro de una transaccion.
- El comprobante interno incluye correlativo de venta, correlativo de caja, vendedor, items, total, monto recibido y cambio.
