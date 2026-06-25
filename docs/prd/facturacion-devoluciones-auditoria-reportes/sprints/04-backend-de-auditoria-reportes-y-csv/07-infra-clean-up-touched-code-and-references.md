# Ticket 07 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 05, 06
- Blocks: 08

## Description

Limpiar codigo muerto, referencias duplicadas, cableado temporal y deriva de nombres expuestos por auditoria, reportes y exportaciones CSV, enfocandose solo en rutas tocadas por el sprint.

## Scope

- Modulos `backend/src/modules/audit`, `backend/src/modules/reports` y `backend/src/modules/exports`.
- Registro de rutas, imports, errores, tipos y helpers agregados por el sprint.
- Referencias OpenAPI y contratos consumidos por auditoria, reportes y CSV.
- Nombres que mantengan clara la diferencia entre consulta visual no auditada y descarga CSV auditada.

## Out Of Scope

- Limpieza amplia fuera del alcance tocado.
- Nuevas reglas funcionales.
- Refactors de facturacion, devoluciones o frontend.

## Acceptance Criteria

- No queda codigo muerto obvio en los modulos tocados ni en rutas/documentacion asociadas.
- No quedan handlers, services, repositories o wrappers duplicados sin razon clara.
- Imports, exports, nombres y referencias mantienen una forma coherente posterior al sprint.
- La deuda diferida hacia UI, documentacion operativa o tesis queda documentada explicitamente si aparece.

## Completion Notes

- Se retiraron contratos JSON de respuesta CSV que no correspondian a las descargas auditadas `text/csv`.
- Se conservaron contratos de query y fila CSV para mantener clara la forma de filtros y columnas exportadas.
- Se eliminaron tipos internos sin uso y se ajusto un helper de filtros para distinguir descarga CSV auditada de consulta visual no auditada.
- Deuda diferida: UI, documentacion operativa y tesis quedan fuera de este sprint.
