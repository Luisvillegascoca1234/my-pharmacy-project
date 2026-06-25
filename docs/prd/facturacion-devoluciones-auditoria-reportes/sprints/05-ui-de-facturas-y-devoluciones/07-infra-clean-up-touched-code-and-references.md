# Ticket 07 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 05, 06
- Blocks: 08

## Description

Limpiar codigo muerto, referencias duplicadas, cableado temporal y deriva de nombres expuestos por las superficies frontend de facturas preparadas y devoluciones, enfocandose solo en rutas tocadas por el sprint.

## Scope

- Modulos `frontend/src/modules/billing` y `frontend/src/modules/returns`.
- Paginas, rutas y navegacion tocadas por facturas preparadas y devoluciones.
- Imports, exports, helpers, copy visible y referencias a placeholders.
- Nombres que mantengan clara la separacion entre factura preparada, SIAT real, anulacion POS y devolucion administrativa.

## Out Of Scope

- Limpieza amplia fuera del alcance tocado.
- Nuevas reglas funcionales.
- Refactors de reportes, exportaciones, auditoria o backend.

## Acceptance Criteria

- No queda codigo muerto obvio en modulos, paginas o rutas tocadas.
- No quedan handlers, stores, selectors o wrappers duplicados sin razon clara.
- Imports, exports, nombres y referencias mantienen una forma coherente posterior al sprint.
- La deuda diferida hacia reportes, exportaciones o auditoria queda documentada explicitamente si aparece.

## Completion Notes

- Se retiraron wrappers publicos no consumidos por las pantallas de comprobantes internos y devoluciones administrativas.
- Se armonizo el copy visible para distinguir comprobante interno preparado, anulacion POS, devolucion administrativa y emision SIAT real.
- Deuda diferida: reportes, exportaciones y auditoria deben incorporar estos eventos administrativos en tickets posteriores; este ticket no modifica esas superficies.
