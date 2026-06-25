# Ticket 03 - Implement prepared invoice listing, detail and cancellation lifecycle

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Completar el ciclo de consulta y cancelacion de facturas preparadas. El modulo debe permitir revisar historial, abrir detalle con items y cancelar una factura activa con motivo, conservando la venta POS intacta.

## Scope

- Implementar `GET /billing/prepared-invoices` con paginacion, filtros por estado, venta, correlativo, busqueda y rango de fechas.
- Implementar `GET /billing/prepared-invoices/:id` con snapshot completo e items.
- Implementar `POST /billing/prepared-invoices/:id/cancel` con motivo de 5 a 500 caracteres.
- Cancelar solo facturas en estado `prepared`, registrando `cancelled`, `cancelledAt`, `cancelledByUserId` y `cancelReason`.
- Mantener intactas venta, pago, caja, items e inventario al cancelar.
- Registrar auditoria de cancelacion con metadata de antes/despues, motivo, actor y correlativo.
- Mapear errores de no encontrado y conflicto al mecanismo HTTP existente del backend.

## Out Of Scope

- Revertir ventas o registrar devoluciones.
- Eliminar facturas o modificar snapshots historicos.
- Auditoria consultable para `superadmin`.
- Pantallas de listado, modales de motivo o navegacion.

## Acceptance Criteria

- Los listados devuelven facturas mas recientes primero y respetan filtros planificados.
- El detalle devuelve factura, vendedor/cancelador cuando exista e items snapshot.
- Cancelar una factura `prepared` cambia solo el ciclo de vida de la factura y escribe auditoria.
- Cancelar una factura ya `cancelled` devuelve conflicto claro.
- Cancelar una factura inexistente devuelve error de no encontrado.
- Despues de cancelar, la misma venta queda habilitada para una nueva factura preparada en el ticket 02.
