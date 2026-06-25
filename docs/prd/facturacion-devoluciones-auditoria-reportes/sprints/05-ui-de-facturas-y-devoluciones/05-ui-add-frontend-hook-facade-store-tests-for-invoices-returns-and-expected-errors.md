# Ticket 05 - Add frontend hook facade store tests for invoices returns and expected errors

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04
- Blocks: 07

## Description

Agregar pruebas automatizadas de los modulos frontend de facturas preparadas y devoluciones. Las pruebas deben cubrir hooks/facades/stores, permisos, filtros, mutaciones y errores esperados sin depender de detalles visuales fragiles.

## Scope

- Pruebas de clientes/facades para params y payloads de facturas preparadas.
- Pruebas de clientes/facades para params y payloads de devoluciones totales.
- Pruebas de stores/selectores para loading, empty, error, paginacion, detalle seleccionado y reset.
- Pruebas de hooks para permisos `admin`, `superadmin` y `seller`.
- Pruebas de mapeo de errores esperados: venta no facturable, factura activa, venta ya devuelta, motivo invalido y permiso insuficiente.
- Pruebas de acciones de preparar factura, cancelar factura y registrar devolucion total.

## Out Of Scope

- QA manual de navegador.
- Snapshots visuales extensos.
- Pruebas de reportes, CSV o auditoria consultable.

## Acceptance Criteria

- Las pruebas fallan si un modulo frontend importa UI, router, iconos o JSX.
- Las pruebas cubren estados de carga, vacio, error y exito para facturas.
- Las pruebas cubren estados de carga, vacio, error y exito para devoluciones.
- Las pruebas cubren permisos de `seller` bloqueado.
- Los comandos de validacion frontend relevantes quedan documentados en el ticket de cierre.

## Cierre

- Validacion ejecutada: `pnpm --filter @pharmacy-pos/frontend test`.
- Validacion ejecutada: `pnpm --filter @pharmacy-pos/frontend typecheck`.
