# Ticket 04 - Build Sale Receipt And Error States

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03
- Blocks: 06

## Description

Completar la experiencia posterior al cobro con comprobante interno, resumen de pago y estados de error frecuentes del flujo POS. El vendedor debe poder entender si la venta fue confirmada, cuanto cambio entregar y por que una operacion fue rechazada.

## Scope

- Comprobante interno con correlativo, fecha, vendedor, total, efectivo recibido, cambio e items vendidos.
- Resumen de stock consumido cuando la respuesta lo exponga, sin permitir elegir lote.
- Acciones para iniciar nueva venta y conservar el comprobante visible hasta que el usuario lo descarte o empiece otro cobro.
- Estados de error para caja cerrada, stock insuficiente, producto no vendible, monto recibido insuficiente, sesion expirada y error inesperado.
- Estados vacios para busqueda sin resultados y carrito sin items.
- Mensajes de advertencia por proximo vencimiento sin bloquear la venta.

## Out Of Scope

- Impresion fisica o PDF del comprobante.
- Factura fiscal SIAT.
- Detalle administrativo de margen.
- Anulacion desde el comprobante.
- Envio por correo, WhatsApp u otros canales.
- Comprobante con cliente formal.

## Acceptance Criteria

- Despues de una venta confirmada se muestra correlativo interno y resumen de pago.
- El cambio se muestra solo cuando el monto recibido cubre el total.
- El vendedor puede iniciar una nueva venta sin conservar items anteriores en el carrito.
- Los errores conocidos se traducen a mensajes accionables para mostrador.
- Una falla de stock al cobrar no descuenta visualmente el carrito como si la venta hubiera sido exitosa.
- Las advertencias de vencimiento cercano no bloquean productos vendibles.
