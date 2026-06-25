# Ticket 04 - Implement sale return listing detail mapping and audit metadata

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03
- Blocks: 05

## Description

Completar la consulta operativa de devoluciones registradas y el mapeo de respuestas compartidas. El historial debe permitir revisar devoluciones totales con actor, venta, pago, importe y detalle por item/lote.

## Scope

- Implementar `GET /returns/sale-returns` con paginacion, filtros por venta, actor, busqueda y rango de fechas.
- Implementar `GET /returns/sale-returns/:id` con detalle de items devueltos.
- Ordenar listados por devoluciones mas recientes primero.
- Mapear `SaleReturnSummarySchema` y `SaleReturnSchema` sin exponer campos Prisma crudos.
- Incluir actor administrativo, venta, pago, motivo, importe, fecha e items con lote/movimiento cuando exista.
- Consolidar metadata de auditoria de creacion de devolucion para soportar investigacion posterior.

## Out Of Scope

- Endpoint de auditoria consultable.
- Reportes de ventas netas y valuacion.
- Exportaciones CSV.
- Pantallas de historial de devoluciones.

## Acceptance Criteria

- El listado devuelve devoluciones paginadas y filtrables sin detalle pesado innecesario.
- El detalle devuelve todos los items/lotes restaurados y movimiento asociado cuando exista.
- La respuesta valida contra schemas compartidos.
- Los errores de devolucion inexistente usan codigo y mensaje consistentes con OpenAPI.
- La metadata de auditoria incluye suficiente contexto para distinguir devolucion administrativa de anulacion POS.
