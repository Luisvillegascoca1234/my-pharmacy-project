# Ticket 04 - Wire administrative navigation routes and access states for invoices and returns

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03
- Blocks: 05

## Description

Alinear navegacion, rutas y estados de acceso para facturas preparadas y devoluciones. La entrada de devoluciones debe ser visible para administracion y quedar separada de anulaciones POS.

## Scope

- Registrar las paginas nuevas en `frontend/src/routes/app-routes.tsx`.
- Ajustar `frontend/src/routes/navigation.ts` para que facturas preparadas use lenguaje interno, no SIAT real.
- Agregar entrada visible de devoluciones para `admin` y `superadmin`.
- Mantener `seller` fuera de facturas preparadas y devoluciones.
- Ajustar titulos de ruta y placeholders para que `/invoices` y la ruta de devoluciones dejen de usar `ModulePage`.
- Preservar rutas de anulacion POS como flujo separado.

## Out Of Scope

- Reportes, exportaciones y auditoria.
- Reorganizacion amplia del sidebar.
- Cambios de permisos backend.

## Acceptance Criteria

- La navegacion muestra facturas preparadas y devoluciones solo para `admin` y `superadmin`.
- `seller` recibe estado de acceso denegado si intenta abrir esas rutas.
- Facturas preparadas no se etiquetan como SIAT real.
- Devoluciones no se mezclan con `Ventas y anulaciones`.
- Los titulos del shell coinciden con las nuevas superficies.
