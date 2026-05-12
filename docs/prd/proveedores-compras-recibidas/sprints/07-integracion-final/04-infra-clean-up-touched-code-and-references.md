# Ticket 04 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01, 03
- Blocks: 05

## Description

Limpiar codigo muerto, cableado duplicado, referencias obsoletas, instrumentacion temporal y deriva de nombres expuesta por la integracion final. El alcance debe limitarse a los archivos tocados por los tickets 01 a 03 y a referencias directas del PRD de proveedores/compras.

## Scope

- rutas, paginas, sidebar y resets tocados por el sprint
- modulos publicos de proveedores/compras cuando se hayan ajustado exports o resets
- documentacion OpenAPI o contratos tocados por el sprint
- referencias stale en tickets, PRD, epic o docs tecnicas descubiertas durante el cierre

## Out Of Scope

- limpieza amplia fuera del epic
- cambios funcionales nuevos
- refactors cosmeticos que no reduzcan riesgo de cierre
- renombrados masivos o reorganizacion de carpetas
- tocar modulos de productos, unidades, auth o layout salvo referencia directa al cierre de proveedores/compras

## Acceptance Criteria

- No quedan imports, exports, helpers o referencias obvias sin uso en los paths tocados.
- No quedan rutas, labels, guards o resets duplicados sin motivo claro.
- Los nombres visibles y tecnicos se mantienen coherentes entre PRD, rutas, sidebar, contracts y OpenAPI.
- La deuda diferida se documenta explicitamente en el lugar apropiado, no como TODO accidental dentro del codigo.
- La limpieza no cambia reglas de negocio ni amplia alcance del sprint.

## Completion Notes

- Se elimino el helper obsoleto `frontend/src/pages/logout/resetAllStores.ts` tras consolidar la limpieza de cierre de sesion en `LogoutPage`.
- Se mantuvieron los resets de estado de sesion antes del logout de auth para limpiar products, units, suppliers, purchases, health y users mientras la sesion todavia existe.
- Se mantuvo la limpieza explicita de persistencia de auth con `AUTH_STORAGE_KEY` despues de terminar el logout best-effort.
- Se actualizo la referencia de alcance del ticket 02 del sprint 07 para apuntar al archivo final de logout en lugar del helper eliminado.
- Se revisaron estados de error tocados en formularios de proveedores/compras, matching de rutas en navegacion/sidebar y barrels de modulos; no se encontraron imports stale adicionales, TODOs accidentales ni deuda OpenAPI dentro del alcance del ticket 04.
