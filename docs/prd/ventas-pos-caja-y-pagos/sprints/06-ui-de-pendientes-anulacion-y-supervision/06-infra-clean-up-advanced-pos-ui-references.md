# Ticket 06 - Clean Up Advanced POS UI References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04, 05
- Blocks: 07

## Description

Limpiar codigo muerto, referencias obsoletas, placeholders desplazados, duplicacion de wiring y nombres temporales expuestos por el trabajo de pendientes, anulacion y supervision, limitandose a las superficies tocadas por este sprint.

## Scope

- modulos, pantallas y superficies de producto tocadas por el sprint
- adaptadores temporales o instrumentacion introducida durante el sprint
- exports, helpers, referencias y textos de navegacion tocados por el sprint
- placeholders reemplazados por pendientes, anulacion o supervision real
- deuda diferida por contrato o endpoint no disponible

## Out Of Scope

- limpieza amplia fuera del alcance del sprint
- cambios funcionales nuevos
- refactors de fases posteriores
- documentacion final de tesis
- reportes, SIAT, QR, tarjeta o credito

## Acceptance Criteria

- no queda codigo muerto evidente en las superficies tocadas por el sprint
- no quedan placeholders genericos para pendientes, anulacion o supervision avanzada
- imports, exports, nombres y referencias tienen una forma coherente posterior al sprint
- la deuda diferida queda documentada explicitamente si depende de integracion externa o contratos no disponibles
- no se introducen tareas de reportes o documentacion final dentro de este sprint
