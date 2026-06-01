# Ticket 06 - Clean Up Touched UI And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04, 05
- Blocks: 07

## Description

Limpiar codigo muerto, referencias obsoletas, placeholders desplazados, duplicacion de wiring y nombres temporales expuestos por el trabajo del sprint, limitandose a las superficies tocadas por Caja y Punto de venta base.

## Scope

- modulos, pantallas y superficies de producto tocadas por el sprint
- adaptadores temporales o instrumentacion introducida durante el sprint
- exports, helpers, referencias y textos de navegacion tocados por el sprint
- placeholders reemplazados por pantallas reales

## Out Of Scope

- limpieza amplia fuera del alcance del sprint
- cambios funcionales nuevos
- refactors de fases posteriores
- carritos pendientes, anulacion o supervision administrativa

## Acceptance Criteria

- no queda codigo muerto evidente en las superficies tocadas por el sprint
- no quedan placeholders genericos para Caja o Punto de venta base
- imports, exports, nombres y referencias tienen una forma coherente posterior al sprint
- la deuda diferida queda documentada explicitamente si pertenece a pendientes, anulacion o supervision
