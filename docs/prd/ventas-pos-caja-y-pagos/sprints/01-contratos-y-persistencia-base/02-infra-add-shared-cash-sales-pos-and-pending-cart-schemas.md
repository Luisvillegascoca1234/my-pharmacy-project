# Ticket 02 - Add Shared Cash Sales POS And Pending Cart Schemas

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 03

## Description

Agregar contratos compartidos para caja, ventas POS, pagos, anulacion, busqueda de productos vendibles y carritos pendientes. Estos contratos deben expresar las reglas de entrada y salida aceptadas por el PRD sin implementar todavia el flujo operativo.

## Scope

- Schemas de estado para caja, venta, pago y carrito pendiente.
- Schemas de apertura, cierre propio, cierre ajeno y caja actual.
- Schemas de producto POS vendible, busqueda POS y disponibilidad resumida.
- Schemas de venta, item, consumo por lote, pago efectivo y comprobante interno.
- Schemas de creacion de venta, anulacion de venta y detalle de venta.
- Schemas de carrito pendiente, item pendiente, guardado, edicion, descarte y conversion.
- Exportacion publica de schemas y tipos para consumo de backend y frontend.

## Out Of Scope

- Persistencia de base de datos.
- API ejecutable y llamadas HTTP reales.
- Formularios, pantallas, estado cliente o copy visible de UI.
- Reglas transaccionales de FEFO, caja, pago, anulacion o expiracion.
- Contratos de QR, tarjeta, credito, SIAT, descuentos, impuestos o cliente formal.

## Acceptance Criteria

- `CashSessionSchema` expone correlativo, usuario de apertura, usuario de cierre opcional, montos, diferencia, estado, notas y fechas relevantes.
- `OpenCashSessionSchema` acepta monto inicial cero o mayor y nota opcional.
- `CloseCashSessionSchema` acepta monto contado cero o mayor y nota opcional.
- `PosProductSchema` expone identificadores, nombre comercial, nombre generico opcional, codigos, precio, stock vendible y proximo vencimiento opcional.
- `CreateSaleSchema` exige items con producto y cantidad entera positiva, pago efectivo con monto recibido y carrito pendiente opcional de origen.
- `SaleSchema` representa venta anonima con correlativo, vendedor, caja, items, consumos por lote, pago, total, margen, estado y datos de anulacion.
- `PaymentSchema` limita V1 a efectivo y conserva total de venta, monto recibido, cambio y estado.
- `CancelSaleSchema` exige motivo con longitud suficiente para auditoria.
- `PendingCartSchema` conserva propietario, nombre o nota, items, total referencial, estado, expiracion y venta convertida opcional.
- Los schemas evitan decimales en cantidad vendida y permiten dinero con dos decimales.
- Los tipos derivados quedan exportados junto con los schemas.
