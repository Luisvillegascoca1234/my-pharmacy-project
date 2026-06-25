# Ticket 06 - Align audit reports exports OpenAPI with executable endpoints

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 07

## Description

Alinear OpenAPI de auditoria, reportes y exportaciones con endpoints ejecutables. El sprint debe retirar lenguaje de "planned" donde corresponda y asegurar que permisos, query params, responses y errores coincidan con el backend real.

## Scope

- Revisar `backend/src/docs/openapi.ts` para `/audit/logs`, `/reports/*` y `/exports/*`.
- Documentar que auditoria consultable es solo para `superadmin`.
- Documentar que reportes visuales son para `admin` y `superadmin` y devuelven `audited: false`.
- Documentar que descargas CSV son para `admin` y `superadmin` y generan auditoria.
- Alinear schemas de reportes, CSV y auditoria con `@pharmacy-pos/shared`.
- Mantener fuera de alcance BI avanzado, CSV por item vendido y auditoria de consultas visuales.

## Out Of Scope

- Documentacion operativa de usuario.
- Tesis o evidencia academica.
- Pantallas administrativas.

## Acceptance Criteria

- OpenAPI ya no describe auditoria, reportes ni exportaciones como solo planificados cuando el endpoint sea ejecutable.
- Permisos por rol quedan documentados de forma coherente.
- Ejemplos y responses mantienen `America/La_Paz`, `audited`, separador `;` y fechas ISO donde corresponda.
- Los nombres de campos coinciden con contratos compartidos.
