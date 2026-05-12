# Ticket 04 - Build purchase detail receive and cancel route

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03
- Blocks: 06

## Description

Completar `/purchases/:id` como detalle operativo de compra, incluyendo acciones de recepcion y anulacion con confirmacion y motivo cuando corresponda. El flujo debe respetar que una compra solo puede recibirse desde un borrador sin cambios pendientes y que las compras `received` o `cancelled` son historial de solo lectura.

## Scope

- detalle de compra en `frontend/src/pages` o componentes de pagina equivalentes
- carga por URL de `GET /api/purchases/:id`
- resumen de proveedor, usuario creador, usuario receptor, fechas, notas, total e items
- accion de recibir con `receiveNotes` opcional
- accion de anular con `cancelReason` obligatorio
- bloqueo visual de recepcion cuando `isDirty = true`
- estados `draft`, `received` y `cancelled`
- refresco de detalle y lista despues de recepcion o anulacion

## Out Of Scope

- pantalla visual de stock por lote o kardex
- resolucion de consumo parcial de capas desde UI
- ventas, POS, devoluciones, SIAT, caja o reportes
- cambios en reglas transaccionales backend
- QA manual de navegador, cubierto por el ticket de QA

## Acceptance Criteria

- Abrir `/purchases/:id` carga proveedor, usuarios, items y estados completos mediante el hook publico del modulo.
- Una compra `draft` muestra acciones para guardar, recibir y anular; recibir queda bloqueado si `isDirty = true`.
- La recepcion llama `POST /api/purchases/:id/receive` con `receiveNotes` opcional y refresca el detalle a `received` si backend confirma.
- La anulacion exige `cancelReason` con longitud valida y llama `POST /api/purchases/:id/cancel`.
- Compras `received` y `cancelled` se muestran en solo lectura y no permiten editar items o encabezado.
- Los errores de recepcion o anulacion se muestran sin asumir causa; reglas como capas consumidas quedan explicadas por la respuesta backend.
- El detalle mantiene consistencia visual con proveedores/productos y no importa internals profundos del modulo.
