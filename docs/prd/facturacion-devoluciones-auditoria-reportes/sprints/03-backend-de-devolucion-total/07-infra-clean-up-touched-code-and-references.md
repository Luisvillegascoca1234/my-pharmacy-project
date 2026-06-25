# Ticket 07 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 05, 06
- Blocks: 08

## Description

Limpiar codigo muerto, referencias duplicadas, cableado temporal y deriva de nombres expuestos por el backend de devolucion total, enfocandose solo en rutas tocadas por el sprint.

## Scope

- Modulo `backend/src/modules/returns`.
- Registro de rutas, imports, errores, tipos y helpers agregados por el sprint.
- Referencias OpenAPI y contratos consumidos por devolucion total.
- Nombres que deban mantener clara la diferencia entre anulacion POS, devolucion administrativa y factura preparada.

## Out Of Scope

- Limpieza amplia fuera del alcance tocado.
- Nuevas reglas funcionales.
- Refactors de ventas, facturacion, reportes, CSV o auditoria consultable.

## Acceptance Criteria

- No queda codigo muerto obvio en `returns` ni en rutas/documentacion tocadas.
- No quedan handlers, services, repositories o wrappers duplicados sin razon clara.
- Imports, exports, nombres y referencias mantienen una forma coherente posterior al sprint.
- La deuda diferida hacia reportes, CSV, auditoria consultable o UI queda documentada explicitamente si aparece.
