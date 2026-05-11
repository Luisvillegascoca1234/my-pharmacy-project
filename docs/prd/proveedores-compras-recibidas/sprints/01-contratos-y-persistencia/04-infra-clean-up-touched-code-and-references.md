# Ticket 04 - Clean Up Touched Code And References

- Status: DONE
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

## Execution Notes

- Se consolido el normalizador de texto opcional de los contratos nuevos en `shared-schema.helpers.ts` para evitar duplicacion entre proveedores y compras.
- Se retiro el placeholder `.gitkeep` de `packages/shared/src/schemas` porque la carpeta ya contiene schemas reales.
- Se reviso la migracion `20260511161000_add_supplier_purchase_inventory_persistence` y no se encontraron migraciones vacias, temporales o duplicadas dentro del sprint.
- No queda deuda diferida para este ticket.
