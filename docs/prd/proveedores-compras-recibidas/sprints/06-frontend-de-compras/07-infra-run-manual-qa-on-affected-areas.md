# Ticket 07 - Run Manual QA On Affected Areas

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 06
- Blocks: 08

## Description

Ejecutar QA manual enfocado sobre la superficie afectada por el sprint Frontend De Compras, usando Playwright MCP para verificar flujos de navegador, navegacion, consola y requests relevantes.

Este ticket no cierra el epic completo porque aun queda el sprint de integracion final. No actualizar `epic.md` a `- Status: DONE` desde este sprint.

## Scope

- Playwright MCP sobre `/purchases`, `/purchases/new` y `/purchases/:id`
- verificacion de sidebar para roles `admin` o `superadmin`
- consola del navegador y requests `GET/POST/PATCH /api/purchases`, `POST /api/purchases/:id/receive` y `POST /api/purchases/:id/cancel`
- estados de carga, error, vacio, filtros, paginacion, creacion, edicion, recepcion bloqueada por `isDirty`, recepcion valida y anulacion con motivo

## Out Of Scope

- iniciar el dev server
- exploracion amplia fuera de compras
- QA de proveedores salvo interaccion necesaria para seleccionar proveedor
- QA de inventario visual, SIAT, POS, reportes o caja
- cierre del epic completo

## Acceptance Criteria

- QA manual usa Playwright MCP en las rutas de compras.
- Los flujos de listar, filtrar, paginar, crear borrador, abrir detalle, editar borrador, bloquear recepcion con cambios pendientes, recibir y anular con motivo se ejercitan paso a paso.
- No aparecen respuestas 4xx o 5xx nuevas y relevantes en los flujos cubiertos, salvo errores esperados que la UI maneje correctamente.
- No aparecen errores nuevos y relevantes en consola durante los flujos cubiertos.
- Bloqueos por datos seed, autenticacion o rutas inaccesibles se documentan con paso exacto y URL.
- `epic.md` permanece en `- Status: TODO` porque este sprint no es la validacion final del PRD.

## Completion Notes

- Playwright MCP intento abrir `http://localhost:5173/purchases`, pero el navegador devolvio `net::ERR_CONNECTION_REFUSED`.
- Se verifico que no habia listeners locales en los puertos esperados `5173`, `5174`, `5175`, `3000` y `4000` con `Get-NetTCPConnection`.
- Playwright MCP intento abrir `http://localhost:4000/api/health`, pero el navegador devolvio `net::ERR_CONNECTION_REFUSED`.
- El QA funcional de `/purchases`, `/purchases/new` y `/purchases/:id` quedo bloqueado porque frontend y backend no estaban accesibles; iniciar el dev server esta fuera de alcance de este ticket.
- No se actualizo `epic.md`; debe permanecer en `- Status: TODO`.
