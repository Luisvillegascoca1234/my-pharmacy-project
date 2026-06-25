# Ticket 08 - Run Validation Guardrails On Affected Areas

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 07
- Blocks: none

## Description

Ejecutar validaciones tecnicas acotadas sobre las superficies frontend de facturas preparadas y devoluciones: tipos, pruebas automatizadas, arquitectura de modulos y consistencia de rutas. Este ticket reemplaza QA manual porque el PRD define que no se planifica QA manual salvo solicitud explicita.

## Scope

- Typecheck de frontend y paquetes compartidos afectados.
- Pruebas automatizadas de modulos, hooks, facades y stores de facturas/devoluciones.
- Revision estatica de que `frontend/src/modules` no contenga JSX, UI, router, iconos ni copy visible.
- Consistencia de rutas, permisos de navegacion y titulos.
- Registro de bloqueos tecnicos si algun comando no puede ejecutarse.

## Out Of Scope

- QA manual de navegador o Playwright MCP.
- Iniciar el dev server.
- Exploracion amplia fuera del sprint.
- Validar reportes, exportaciones, auditoria o documentacion operativa.
- Cerrar `epic.md` como `DONE`.

## Acceptance Criteria

- Las validaciones tecnicas seleccionadas quedan registradas con resultado claro.
- Frontend y contratos compartidos compilan con los cambios del sprint.
- Las pruebas cubren permisos, filtros, acciones y errores esperados de facturas/devoluciones.
- Las rutas y navegacion respetan `admin`, `superadmin` y bloqueo de `seller`.
- Si alguna validacion no puede ejecutarse, queda documentado el bloqueo exacto y su impacto.
- `epic.md` permanece en `- Status: TODO` porque este sprint no cierra el epic.

## Completion Notes

- `pnpm --filter @pharmacy-pos/shared typecheck`: OK.
- `pnpm --filter @pharmacy-pos/frontend typecheck`: OK.
- `pnpm --filter @pharmacy-pos/shared build`: OK.
- `pnpm --filter @pharmacy-pos/frontend build`: OK; Vite reporto advertencia no bloqueante por chunk mayor a 500 kB.
- `pnpm --filter @pharmacy-pos/frontend test -- src/modules/billing/billing.test.ts src/modules/returns/returns.test.ts src/modules/module-boundaries.test.ts`: OK, 3 archivos y 27 pruebas pasaron.
- Revision estatica de `frontend/src/modules`: OK, no se encontraron archivos `.tsx` ni imports de UI, router, iconos o estilos dentro de modulos.
- Revision estatica de rutas: OK, comprobantes internos y devoluciones administrativas estan enlazados a paginas reales, usan `adminRoles` y conservan titulos dedicados; `blockedItems` mantiene pagina de acceso no autorizado para roles sin permiso.
- `epic.md` permanece en `- Status: TODO`.
- Bloqueos tecnicos: ninguno.
