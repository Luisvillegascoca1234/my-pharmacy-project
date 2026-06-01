# Ticket 03 - Verify OpenAPI Shared Contracts And Route Parity

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01, 02
- Blocks: 04

## Description

Verificar que contratos compartidos, rutas de API, documentacion OpenAPI y consumo frontend permanezcan alineados con el PRD despues de los sprints de implementacion. La revision debe buscar divergencias de cierre en campos, estados, filtros, permisos, errores y payloads de operaciones sensibles.

## Scope

- Contratos de caja, venta, pago efectivo, busqueda POS, anulacion y carritos pendientes.
- Estados operativos de caja, venta, pago y pendiente.
- Operaciones de apertura, cierre propio, cierre ajeno, caja actual, busqueda vendible, venta, detalle, anulacion y pendientes.
- Respuestas paginadas o filtradas para ventas, cajas y pendientes cuando correspondan.
- Errores documentados para acceso denegado, caja cerrada, stock insuficiente, pago insuficiente, pendiente expirado y venta no anulable.
- Documentacion minima de API para integracion del flujo V1.

## Out Of Scope

- Documentacion exhaustiva fuera del PRD.
- Endpoints nuevos no aceptados.
- Cambios de persistencia no requeridos por una divergencia real.
- SIAT, QR, tarjeta, credito, descuentos o cliente formal.
- Tutoriales de implementacion o explicaciones de estructura interna.
- QA manual.

## Acceptance Criteria

- Los contratos compartidos usados por backend y frontend no tienen duplicaciones divergentes.
- OpenAPI describe de forma minima las operaciones y estados del flujo V1.
- Los permisos documentados coinciden con vendedor, admin y superadmin.
- Los errores de dominio relevantes aparecen como respuestas esperadas y no como fallos genericos sin contrato.
- Las operaciones de pendientes explicitan que no reservan stock ni congelan precio.
- Cualquier divergencia no corregida queda registrada como deuda de cierre con impacto y razon.

## Execution Notes

- Se consolidaron los contratos compartidos de supervision de caja, venta anulable, anulacion, listado de ventas y carritos pendientes para que el consumo frontend use las mismas formas de datos y payloads compartidos.
- La documentacion OpenAPI mantiene la paridad con las rutas ejecutables actuales: apertura de caja, caja actual, cierre por identificador, busqueda vendible POS, creacion de venta y detalle de venta.
- Estado posterior al correctivo backend: la deuda de rutas ausentes para listado administrativo de cajas, listado de ventas, anulacion de venta y ciclo de carritos pendientes queda reconciliada en contratos y documentacion minima de API.
- Deuda no bloqueante restante: ejecutar el guardrail final del epic para confirmar que no queda divergencia funcional entre permisos, errores de dominio y experiencia operativa.
- Los contratos de pendientes dejan explicito que un pendiente es preparacion operativa: no reserva stock ni congela precio; debe revalidarse al convertirlo en venta.
- Validacion tecnica ejecutada: `pnpm --filter @pharmacy-pos/shared typecheck`, `pnpm --filter @pharmacy-pos/frontend typecheck` y `pnpm --filter @pharmacy-pos/backend typecheck`.
