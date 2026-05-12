# Ticket 06 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04, 05
- Blocks: 07

## Description

Limpiar codigo muerto, wiring duplicado, referencias obsoletas, instrumentacion temporal y deriva de nombres expuesta por el trabajo del sprint, enfocandose solo en las rutas, paginas y modulos tocados por Frontend De Compras.

## Scope

- `frontend/src/modules/purchases`
- paginas y componentes de compras creados en `frontend/src/pages`
- rutas, titulos y reset de sesion tocados por el sprint
- imports, exports, helpers y referencias temporales creadas durante el sprint

## Out Of Scope

- limpieza amplia fuera del alcance del sprint
- cambios funcionales nuevos
- refactors de sprints posteriores
- cambios backend, Prisma u OpenAPI

## Acceptance Criteria

- no queda codigo muerto obvio en los paths tocados por el sprint
- no quedan handlers, wrappers, helpers o exports duplicados sin razon clara
- imports, exports, nombres y referencias reflejan una forma coherente post-sprint
- `frontend/src/modules/purchases` conserva limites portables: sin `.tsx`, UI, router, iconos, CSS ni copy visible
- la deuda diferida queda documentada explicitamente en vez de quedar como residuo accidental

## Completion Notes

- Se removieron helpers y acciones publicas no usadas del modulo de compras.
- Se limpiaron imports y wiring redundante en la pagina/rutas de compras.
- No queda deuda diferida identificada dentro del alcance del ticket; la QA manual permanece en el ticket 07.
