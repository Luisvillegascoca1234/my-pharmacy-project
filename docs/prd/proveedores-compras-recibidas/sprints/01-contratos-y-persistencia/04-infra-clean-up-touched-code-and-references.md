# Ticket 04 - Clean Up Touched Code And References

- Status: TODO
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01, 03
- Blocks: 05

## Description

Limpiar codigo muerto, exports duplicados, referencias obsoletas, instrumentacion temporal y drift de nombres expuesto por los contratos compartidos, el schema Prisma y la migracion de este sprint.

## Scope

- `packages/shared/src/schemas` y exports de `packages/shared/src/index.ts`
- `backend/prisma/schema.prisma` y migraciones creadas durante el sprint
- nombres de enums, modelos, campos, indices y tipos compartidos tocados por el sprint
- notas tecnicas puntuales si queda una deuda intencional de persistencia

## Out Of Scope

- limpieza amplia fuera del scope del sprint
- endpoints, services, repositories, UI o stores
- refactors de productos, unidades, usuarios o autenticacion que no sean necesarios para compilar

## Acceptance Criteria

- no quedan schemas, tipos o exports duplicados dentro del scope tocado
- los nombres de contratos compartidos y modelos Prisma siguen las decisiones del PRD y usan ingles en codigo
- los imports/exports de `@pharmacy-pos/shared` quedan coherentes y minimamente expuestos
- no quedan migraciones vacias, temporales o generadas por accidente
- cualquier deuda diferida queda documentada explicitamente en el ticket o artefacto correspondiente
