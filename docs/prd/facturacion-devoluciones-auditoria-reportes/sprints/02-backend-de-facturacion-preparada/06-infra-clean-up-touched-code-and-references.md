# Ticket 06 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04, 05
- Blocks: 07

## Description

Limpiar codigo muerto, referencias duplicadas, cableado temporal y deriva de nombres expuestos por el backend de facturacion preparada, enfocandose solo en rutas tocadas por el sprint.

## Scope

- Modulo `backend/src/modules/billing`.
- Registro de rutas, imports, errores, tipos y helpers agregados por el sprint.
- Referencias OpenAPI y contratos consumidos por facturacion preparada.
- Nombres que deban mantener clara la diferencia entre factura preparada, comprobante interno POS y SIAT real.

## Out Of Scope

- Limpieza amplia fuera del alcance tocado.
- Nuevas reglas funcionales.
- Refactors de ventas, devoluciones, reportes, CSV o auditoria consultable.

## Acceptance Criteria

- No queda codigo muerto obvio en `billing` ni en rutas/documentacion tocadas.
- No quedan handlers, services, repositories o wrappers duplicados sin razon clara.
- Imports, exports, nombres y referencias mantienen una forma coherente posterior al sprint.
- La deuda diferida hacia devoluciones, reportes, CSV o UI queda documentada explicitamente si aparece.

## Cierre

- Se retiro un marcador residual sin comportamiento dentro del alcance de facturacion preparada.
- Las referencias ejecutables de facturacion preparada mantienen la separacion entre factura preparada interna, comprobante POS y SIAT real.
- La unica referencia planificada observada queda en devoluciones y permanece diferida al siguiente sprint backend.
