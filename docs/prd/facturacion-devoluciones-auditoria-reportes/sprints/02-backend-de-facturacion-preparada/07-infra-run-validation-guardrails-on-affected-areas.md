# Ticket 07 - Run Validation Guardrails On Affected Areas

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 06
- Blocks: none

## Description

Ejecutar validaciones tecnicas acotadas sobre el backend de facturacion preparada: tipos, pruebas automatizadas, OpenAPI y consistencia de contratos. Este ticket reemplaza QA manual porque el PRD define que no se planifica QA manual salvo solicitud explicita y este sprint no entrega pantallas ni navegacion.

## Scope

- Typecheck de backend y paquetes compartidos afectados.
- Pruebas automatizadas del modulo `billing` y de reglas de facturacion preparada.
- Consistencia estatica entre contratos compartidos, OpenAPI y responses del controller.
- Registro de bloqueos tecnicos si algun comando no puede ejecutarse.

## Out Of Scope

- QA manual de navegador o Playwright MCP.
- Iniciar el dev server.
- Exploracion amplia fuera del sprint.
- Validar pantallas, navegacion, devoluciones, reportes o CSV.
- Cerrar `epic.md` como `DONE`.

## Acceptance Criteria

- Las validaciones tecnicas seleccionadas quedan registradas con resultado claro.
- Las pruebas del modulo `billing` cubren permisos, elegibilidad, creacion, cancelacion y auditoria.
- Backend y contratos compartidos compilan con los cambios del sprint.
- OpenAPI mantiene nombres, codigos de error y estados consistentes con los endpoints ejecutables.
- Si alguna validacion no puede ejecutarse, queda documentado el bloqueo exacto y su impacto.
- `epic.md` permanece en `- Status: TODO` porque este sprint no cierra el epic.

## Validation Results

- `pnpm --filter @pharmacy-pos/shared typecheck`: PASS.
- `pnpm --filter @pharmacy-pos/backend typecheck`: PASS.
- `pnpm --filter @pharmacy-pos/backend exec vitest run --config vitest.config.ts src/modules/billing/billing.service.spec.ts`: PASS, 17 pruebas.
- Revision estatica de contratos, responses y OpenAPI de facturacion preparada: PASS. Estados `prepared` / `cancelled`, razones de bloqueo, codigos `SALE_NOT_FOUND`, `SALE_NOT_INVOICEABLE`, `PREPARED_INVOICE_ACTIVE_EXISTS`, `PREPARED_INVOICE_NOT_FOUND` y `PREPARED_INVOICE_ALREADY_CANCELLED` permanecen consistentes.
- Bloqueos tecnicos: ninguno.
