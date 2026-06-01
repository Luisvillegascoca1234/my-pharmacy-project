# Ticket 06 - Clean Up Corrective Backend References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04, 05
- Blocks: 07

## Description

Limpiar codigo muerto, referencias obsoletas, duplicacion de wiring, notas de brecha ya resueltas y nombres temporales expuestos por la correccion backend de pendientes, anulacion y supervision.

## Scope

- superficies backend tocadas por pendientes, anulacion y supervision
- contratos, OpenAPI y clientes tocados por la reconciliacion
- notas de brecha del Sprint 07 que ya no apliquen
- exports, helpers, permisos y rutas tocadas por el sprint
- deuda diferida que siga siendo real despues de la correccion

## Out Of Scope

- limpieza amplia fuera del alcance del sprint
- cambios funcionales nuevos
- refactors de fases posteriores
- UI nueva
- documentacion final de tesis
- SIAT, QR, tarjeta, credito o reportes

## Acceptance Criteria

- no queda codigo muerto evidente en las superficies tocadas por el sprint
- no quedan notas que declaren ausente una API ya implementada
- imports, exports, nombres y referencias reflejan una forma coherente posterior al sprint
- la deuda diferida queda documentada explicitamente si aun bloquea o no bloquea el cierre del epic
- no se agregan cambios fuera del alcance correctivo

## Implementation Notes

- Se inspeccionaron rutas backend, OpenAPI, contratos compartidos y clientes frontend de caja, POS, pendientes, anulacion de ventas y supervision administrativa; no se detectaron imports, exports o wiring duplicado con fallo de typecheck dentro del alcance correctivo.
- Se limpiaron referencias documentales que todavia presentaban carritos pendientes, anulacion y supervision como deuda de disponibilidad o ausencia de API despues del correctivo backend.
- Nota historica posterior al Sprint 09: el guardrail tecnico del Sprint 08 no registro bloqueos externos para pendientes, anulacion ni supervision. La tarea vigente de cierre queda acotada a reconciliacion documental y limpieza final de referencias.
- No se agregaron cambios funcionales ni QA manual.
