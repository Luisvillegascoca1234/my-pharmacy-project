# Ticket 05 - Add backend tests for audit reports CSV and permissions

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04
- Blocks: 07

## Description

Agregar pruebas automatizadas para permisos, auditoria consultable, reportes y exportaciones CSV. Las pruebas deben cubrir comportamiento externo y reglas de dominio, sin depender de detalles internos innecesarios.

## Scope

- Pruebas de `audit` para paginacion, filtros, metadata y restriccion a `superadmin`.
- Pruebas de reportes de ventas netas con ventas confirmadas, anuladas y devueltas.
- Pruebas de valuacion por lote disponible y exclusion de lotes agotados/cancelados.
- Pruebas de productos proximos a vencer con `days` default y parametro explicito.
- Pruebas de CSV de ventas y movimientos con separador `;`, fechas ISO y filtros.
- Pruebas de auditoria de descarga CSV.
- Pruebas de permisos: `seller` bloqueado, `admin` permitido en reportes/exportaciones, `admin` bloqueado en auditoria.

## Out Of Scope

- Pruebas de UI o navegador.
- Reportes BI avanzados.
- Exportaciones por item vendido.
- QA manual.

## Acceptance Criteria

- Las pruebas fallan si `admin` puede consultar auditoria.
- Las pruebas fallan si reportes visuales generan auditoria.
- Las pruebas fallan si CSV no genera auditoria de descarga.
- Las pruebas cubren ventas netas restando devoluciones y diferenciando anulaciones.
- Las pruebas cubren valuacion por lote y vencimientos.
- Los comandos de validacion backend relevantes quedan documentados en el ticket de cierre.

## Cierre

- Se agregaron pruebas automatizadas para auditoria consultable, permisos por rol, reportes diarios, valuacion, vencimientos y exportaciones CSV auditadas.
- Validacion ejecutada:
  - `pnpm --filter @pharmacy-pos/backend typecheck`
  - `pnpm --filter @pharmacy-pos/backend exec vitest run --config vitest.config.ts --testNamePattern "Audit|Reports|Exports"`
- Nota: `pnpm --filter @pharmacy-pos/backend test` queda con fallos preexistentes en carrito pendiente por expiracion dependiente de fecha actual.
