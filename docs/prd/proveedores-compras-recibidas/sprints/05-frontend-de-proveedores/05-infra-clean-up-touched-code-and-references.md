# Ticket 05 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03, 04
- Blocks: 06

## Description

Limpiar codigo muerto, wiring duplicado, referencias obsoletas, instrumentacion temporal y deriva de nombres expuesta por el trabajo del sprint Frontend De Proveedores. El foco debe quedar limitado a los paths tocados por el modulo, paginas y rutas de proveedores.

## Scope

- sprint-touched modules, docs, or product surfaces
- temporary adapters or instrumentation introduced by the sprint
- providers, exports, helpers, and references touched by the sprint

## Out Of Scope

- broad cleanup outside the sprint scope
- new functional changes
- later-sprint refactors

## Acceptance Criteria

- no queda codigo muerto evidente en los paths tocados por proveedores
- no quedan handlers, wrappers, exports o helpers duplicados sin una razon clara
- imports, exports, nombres y referencias reflejan una forma coherente posterior al sprint
- cualquier deuda diferida queda documentada explicitamente en el ticket, no escondida en comentarios vagos

## Closure Notes

- Se elimino el helper no usado `getEmptySupplierDraftForm`.
- Se redujo el barrel publico de proveedores para no exportar implementacion interna del store ni constantes no consumidas fuera del modulo.
- Se consolidaron imports duplicados desde el modulo de proveedores en la pagina de formulario.
- No queda deuda diferida identificada dentro del alcance de limpieza del sprint.
