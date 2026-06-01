# Ticket 01 - Model Cash Sale Payment And Pending Cart Persistence

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 03

## Description

Modelar la persistencia base para sesiones de caja, ventas, items vendidos, pagos, consumos de inventario por lote y carritos pendientes. El objetivo es dejar una base relacional consistente para que los siguientes sprints puedan implementar apertura/cierre de caja, venta transaccional, FEFO, anulacion y conversion de pendientes sin redisenar datos.

## Scope

- Enums operativos de caja, venta, pago y carrito pendiente.
- Modelos `CashSession`, `Sale`, `SaleItem`, `SaleItemBatch`, `Payment`, `PendingCart` y `PendingCartItem`.
- Relaciones con usuario, producto, capa de inventario y movimientos existentes.
- Correlativos internos globales para caja y venta.
- Campos de auditoria operativa para apertura, cierre, anulacion, conversion y expiracion.
- Indices y restricciones para consultas por usuario, fecha, estado, caja, venta, producto y vencimiento de pendientes.

## Out Of Scope

- API ejecutable y reglas de negocio transaccionales.
- Apertura, cierre, cobro o anulacion ejecutable.
- Implementacion del algoritmo FEFO.
- Pantallas POS, estado cliente o navegacion.
- QR real, tarjeta, credito, SIAT, devoluciones y reapertura de caja.

## Acceptance Criteria

- `CashSession` representa apertura y cierre con usuario que abre, usuario que cierra, correlativo interno, monto inicial, monto contado, monto esperado, diferencia, estado, notas y timestamps.
- La persistencia impide conceptualmente mas de una caja abierta por usuario mediante una estrategia compatible con PostgreSQL y el uso actual de Prisma.
- `Sale` representa venta anonima con correlativo interno, vendedor, caja asociada, total, margen, estado, motivo de anulacion, usuario que anula y timestamps relevantes.
- `SaleItem` conserva producto, cantidad entera, precio unitario, subtotal, costo total y margen del item.
- `SaleItemBatch` conserva la asignacion FEFO por capa/lote con cantidad consumida, costo unitario base, vencimiento disponible por relacion y referencia auditable al item vendido.
- `Payment` soporta un pago unico en efectivo en V1 con total pagado, monto recibido, cambio, estado y relacion con venta y caja.
- `PendingCart` soporta vendedor propietario, nombre o nota, estado, expiracion a 3 dias, total referencial, conversion a venta y descarte administrativo.
- `PendingCartItem` conserva producto, cantidad, precio referencial y datos suficientes para detectar cambios de precio al retomar.
- Las relaciones permiten calcular caja esperada desde ventas efectivas netas y pagos asociados sin borrar ventas o pagos anulados.
- Los modelos dejan preparada la relacion futura con facturacion fiscal sin mezclar la factura con la venta.
