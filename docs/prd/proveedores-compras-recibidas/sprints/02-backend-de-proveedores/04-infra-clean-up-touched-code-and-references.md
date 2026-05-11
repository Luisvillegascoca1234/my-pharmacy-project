# Ticket 04 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02, 03
- Blocks: 05

## Description

Limpiar codigo muerto, wiring duplicado, referencias obsoletas, instrumentacion temporal y drift de nombres expuestos por el sprint Backend De Proveedores. El alcance debe limitarse a lo tocado por el modulo `suppliers`, rutas, OpenAPI y contratos estrictamente relacionados.

## Scope

- `backend/src/modules/suppliers`
- `backend/src/routes/index.ts`
- `backend/src/docs/openapi.ts`
- imports/exports tocados para proveedores
- helpers temporales o duplicados creados durante el sprint

## Out Of Scope

- limpieza amplia fuera del alcance de proveedores
- cambios funcionales nuevos
- refactors de compras, inventario, productos, unidades o frontend
- normalizacion global de OpenAPI no necesaria para proveedores

## Acceptance Criteria

- no queda codigo muerto evidente en paths tocados por el sprint
- no quedan handlers, services, repositories o wrappers duplicados sin motivo claro
- imports, exports, nombres y referencias reflejan una forma coherente posterior al sprint
- cualquier deuda diferida queda documentada explicitamente en el ticket o PRD relacionado
