# Ticket 08 - Run Validation Guardrails On Affected Areas

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 07
- Blocks: none

## Description

Ejecutar validaciones tecnicas acotadas sobre auditoria, reportes y exportaciones CSV: tipos, pruebas automatizadas, OpenAPI y consistencia de contratos. Este ticket reemplaza QA manual porque el PRD define que no se planifica QA manual salvo solicitud explicita y este sprint no entrega pantallas ni navegacion.

## Scope

- Typecheck de backend y paquetes compartidos afectados.
- Pruebas automatizadas de `audit`, `reports` y `exports`.
- Consistencia estatica entre contratos compartidos, OpenAPI y responses/cabeceras del controller.
- Registro de bloqueos tecnicos si algun comando no puede ejecutarse.

## Out Of Scope

- QA manual de navegador o Playwright MCP.
- Iniciar el dev server.
- Exploracion amplia fuera del sprint.
- Validar pantallas, navegacion o documentacion operativa.
- Cerrar `epic.md` como `DONE`.

## Acceptance Criteria

- Las validaciones tecnicas seleccionadas quedan registradas con resultado claro.
- Las pruebas cubren permisos, auditoria consultable, reportes visuales no auditados y CSV auditados.
- Backend y contratos compartidos compilan con los cambios del sprint.
- OpenAPI mantiene nombres, permisos, codigos de error y responses consistentes con los endpoints ejecutables.
- Si alguna validacion no puede ejecutarse, queda documentado el bloqueo exacto y su impacto.
- `epic.md` permanece en `- Status: TODO` porque este sprint no cierra el epic.

## Cierre

- Typecheck ejecutado sin fallos para contratos compartidos y backend:
  - `pnpm --filter @pharmacy-pos/shared typecheck`
  - `pnpm --filter @pharmacy-pos/backend typecheck`
- Pruebas automatizadas acotadas ejecutadas sin fallos:
  - `pnpm --filter @pharmacy-pos/backend test -- src/modules/audit src/modules/reports src/modules/exports`
  - Resultado: 6 archivos de prueba y 24 tests pasaron.
- Consistencia estatica revisada entre rutas, controllers, contratos compartidos y OpenAPI:
  - `GET /audit/logs` queda restringido a `superadmin`.
  - `GET /reports/daily-sales`, `GET /reports/inventory-valuation` y `GET /reports/expiring-products` quedan restringidos a `admin` y `superadmin`, con respuesta `audited: false`.
  - `GET /exports/sales.csv` y `GET /exports/inventory-movements.csv` quedan restringidos a `admin` y `superadmin`, devuelven `text/csv; charset=utf-8`, usan `Content-Disposition` de descarga y registran auditoria de descarga CSV.
- No se detectaron bloqueos tecnicos durante las validaciones acotadas.
