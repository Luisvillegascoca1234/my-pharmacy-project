# Ticket 08 - Run Validation Guardrails On Affected Areas

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 07
- Blocks: none

## Description

Ejecutar validaciones tecnicas acotadas sobre el backend de devolucion total: tipos, pruebas automatizadas, OpenAPI y consistencia de contratos. Este ticket reemplaza QA manual porque el PRD define que no se planifica QA manual salvo solicitud explicita y este sprint no entrega pantallas ni navegacion.

## Scope

- Typecheck de backend y paquetes compartidos afectados.
- Pruebas automatizadas del modulo `returns` y de reglas de devolucion total.
- Consistencia estatica entre contratos compartidos, OpenAPI y responses del controller.
- Registro de bloqueos tecnicos si algun comando no puede ejecutarse.

## Out Of Scope

- QA manual de navegador o Playwright MCP.
- Iniciar el dev server.
- Exploracion amplia fuera del sprint.
- Validar pantallas, navegacion, reportes, CSV o auditoria consultable.
- Cerrar `epic.md` como `DONE`.

## Acceptance Criteria

- Las validaciones tecnicas seleccionadas quedan registradas con resultado claro.
- Las pruebas del modulo `returns` cubren permisos, elegibilidad, transaccion, trazabilidad por lote y auditoria.
- Backend y contratos compartidos compilan con los cambios del sprint.
- OpenAPI mantiene nombres, codigos de error y estados consistentes con los endpoints ejecutables.
- Si alguna validacion no puede ejecutarse, queda documentado el bloqueo exacto y su impacto.
- `epic.md` permanece en `- Status: TODO` porque este sprint no cierra el epic.

## Validation Record

- `pnpm --filter @pharmacy-pos/shared typecheck`: PASSED.
- `pnpm --filter @pharmacy-pos/backend typecheck`: PASSED.
- `pnpm --filter @pharmacy-pos/backend test -- src/modules/returns/returns.service.spec.ts`: PASSED, 16 tests.
- OpenAPI/contract static parity check: PASSED. Confirmed executable returns routes, response codes, return block reasons and `sale_returned` movement type stay aligned.

## Technical Blocks

- None.
