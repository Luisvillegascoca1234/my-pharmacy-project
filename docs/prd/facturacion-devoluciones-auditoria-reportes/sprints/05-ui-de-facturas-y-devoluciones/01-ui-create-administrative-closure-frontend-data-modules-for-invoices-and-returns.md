# Ticket 01 - Create administrative closure frontend data modules for invoices and returns

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Crear los modulos frontend portables para facturas preparadas y devoluciones totales. Estos modulos deben encapsular transporte, facades, hooks, stores/selectores, mappers y errores de datos, sin renderizar UI ni contener copy visible.

## Scope

- Crear `frontend/src/modules/billing` para facturas preparadas, ventas facturables, detalle y cancelacion.
- Crear `frontend/src/modules/returns` para ventas devolvibles, devoluciones, detalle y registro de devolucion total.
- Agregar clientes API de feature que consuman `/billing/*` y `/returns/*` usando `axiosApi`.
- Reutilizar tipos y schemas compartidos desde `@pharmacy-pos/shared` cuando corresponda.
- Crear facades/hooks/stores con selectores estables y acciones separadas de estado.
- Mapear errores esperados a codigos de datos portables, dejando copy final para paginas.
- Exportar solo la interfaz publica desde cada `index.ts`.

## Out Of Scope

- Componentes React, JSX, iconos, estilos, rutas o copy visible dentro de `src/modules`.
- Reportes, exportaciones y auditoria consultable.
- Cambios de backend o contratos compartidos salvo ajustes menores de consumo.

## Acceptance Criteria

- Los modulos no contienen archivos `.tsx`, imports de UI, imports de router, iconos ni clases visuales.
- Los clientes API solo construyen endpoints, pasan params/payloads y devuelven `response.data`.
- Los hooks exponen permisos `admin`/`superadmin`, estados de carga, errores, filtros, paginacion y acciones.
- Los stores usan selectores estables y no navegan, muestran toasts ni abren modales.
- Las paginas pueden consumir los modulos desde el barrel publico sin imports profundos.
