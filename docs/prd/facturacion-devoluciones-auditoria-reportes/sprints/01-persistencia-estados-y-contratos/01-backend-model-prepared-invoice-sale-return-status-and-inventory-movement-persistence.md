# Ticket 01 - Model prepared invoice, sale return, status and inventory movement persistence

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 04

## Description

Definir la persistencia base que permita diferenciar venta POS vigente, factura preparada interna, anulacion POS y devolucion administrativa total. El modelo debe conservar trazabilidad farmaceutica por lote, permitir historial de facturas canceladas, bloquear conceptualmente duplicidad de devoluciones V1 y preparar los estados que usaran los servicios transaccionales posteriores.

## Scope

- Agregar los estados necesarios para venta `returned`, pago `refunded`, factura preparada `prepared` / `cancelled` y movimiento de inventario `sale_returned`.
- Modelar factura preparada con correlativo interno propio, snapshot de venta, vendedor, fecha, items, total y datos fiscales minimos.
- Modelar devolucion total como `SaleReturn`, con motivo, importe devuelto, actor administrativo y snapshot por item/lote devuelto.
- Relacionar la devolucion con venta, pago, lotes originales y movimientos de inventario sin reabrir ni modificar cierres historicos de caja.
- Incluir indices y restricciones para busqueda por estado, venta, correlativo, fecha, actor y unicidad de la devolucion V1 por venta.
- Mantener la migracion destructiva documentada como decision aceptada para este epic.

## Out Of Scope

- Services, repositories y controllers ejecutables para crear o cancelar facturas.
- Transaccion de devolucion total, reposicion real de lotes y auditoria operativa.
- Calculo de reportes, generacion CSV, permisos HTTP o pantallas administrativas.
- Integracion SIAT real, QR fiscal, CUIS, CUFD o emision fiscal en linea.
- Devoluciones parciales o impacto directo sobre sesiones de caja cerradas.

## Acceptance Criteria

- Los enums contemplan `returned`, `refunded`, `sale_returned`, `prepared` y `cancelled` sin mezclar factura preparada con comprobante interno POS.
- La factura preparada permite multiples registros historicos por venta, pero solo una factura activa `prepared` por venta vigente.
- `SaleReturn` queda limitado a una devolucion V1 por venta y conserva motivo, importe, actor, fecha y detalle por item/lote.
- El detalle de devolucion referencia los consumos originales para que la reposicion posterior pueda volver a los mismos lotes.
- Las relaciones e indices soportan listados administrativos descendentes y filtros por estado, venta, correlativo y fecha.
- La generacion de cliente Prisma queda prevista como guardrail antes de implementar reglas de dominio.
