# Ticket 05 - Run Manual QA On Affected Areas

- Status: TODO
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04
- Blocks: 06

## Description

Ejecutar una verificacion manual enfocada sobre los artefactos tecnicos del Sprint 01: contratos compartidos, Prisma schema, migracion y generacion del cliente. Este sprint no introduce rutas web nuevas; si durante la ejecucion se toca alguna superficie browser-based, usar Playwright MCP para verificarla.

Este QA no cierra el epic completo. No actualizar `epic.md` a `- Status: DONE`; el epic sigue abierto para los sprints de backend, UI e integracion.

## Scope

- revision de `packages/shared` para exports esperados
- revision de `backend/prisma/schema.prisma` y migracion generada
- comandos de generacion Prisma y typecheck relevantes
- Playwright MCP solo si el ticket termina tocando una ruta o flujo web existente

## Out Of Scope

- iniciar el dev server
- QA exploratorio de pantallas no afectadas
- validacion de endpoints que todavia no existen
- cierre del epic completo

## Acceptance Criteria

- se registra que `pnpm --filter @pharmacy-pos/backend prisma:generate` fue ejecutado o se documenta el bloqueo exacto
- se registra typecheck del scope tocado o la falla previa no relacionada con evidencia suficiente
- la migracion y el schema Prisma son revisados para confirmar que no incluyen cambios destructivos accidentales
- los contratos compartidos exportan los tipos necesarios desde `@pharmacy-pos/shared`
- Playwright MCP se usa solo si hay cambios browser-based; si no los hay, se deja constancia de que no aplica para este sprint
- `epic.md` permanece en `- Status: TODO` porque este sprint no cierra el epic
