# Ticket 06 - Run Manual QA On Affected Areas

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 05
- Blocks: 07

## Description

Ejecutar QA manual enfocado sobre la superficie afectada por el sprint Frontend De Proveedores, usando Playwright MCP para verificar flujos de navegador, navegacion, consola y requests relevantes.

Este ticket no cierra el epic completo porque aun quedan los sprints de compras e integracion final. No actualizar `epic.md` a `- Status: DONE` desde este sprint.

## Scope

- Playwright MCP sobre `/suppliers`, `/suppliers/new` y `/suppliers/:id`
- verificacion de sidebar para roles `admin` o `superadmin`
- consola del navegador y requests `GET/POST/PATCH /api/suppliers`
- estados de carga, error, vacio, filtros, paginacion, creacion, edicion y cambio de estado

## Out Of Scope

- iniciar el dev server
- exploracion amplia fuera de proveedores
- QA de compras, inventario, SIAT, POS o reportes
- cierre del epic completo

## Acceptance Criteria

- QA manual usa Playwright MCP en las rutas de proveedores.
- Los flujos de listar, buscar, filtrar, paginar, crear, abrir detalle, editar y cambiar estado se ejercitan paso a paso.
- No aparecen respuestas 4xx o 5xx nuevas y relevantes en los flujos cubiertos, salvo errores esperados que la UI maneje correctamente.
- No aparecen errores nuevos y relevantes en consola durante los flujos cubiertos.
- Bloqueos por datos seed, autenticacion o rutas inaccesibles se documentan con paso exacto y URL.
- `epic.md` permanece en `- Status: TODO` porque este sprint no es la validacion final del PRD.

## QA Evidence

- Playwright MCP no pudo iniciar el recorrido porque las rutas locales esperadas estaban inaccesibles.
- Paso exacto bloqueado: navegar a `http://localhost:5173/suppliers`.
- Resultado: `net::ERR_CONNECTION_REFUSED`.
- Segundo intento: navegar a `http://localhost:5174/suppliers`.
- Resultado: `net::ERR_CONNECTION_REFUSED`.
- Verificacion local de puertos: no habia listeners activos en `5173` ni `5174` al momento del intento.
- Evidencia de logs existentes: `frontend/dev-server.err.log` registra un intento previo fallido por `Port 5173 is already in use`; `frontend/dev-server-5174.out.log` registra un Vite previo en `http://localhost:5174/`, pero no quedaba proceso escuchando.
- Por el bloqueo de ruta inaccesible no se pudieron ejercitar listado, busqueda, filtros, paginacion, creacion, detalle, edicion ni cambio de estado.
- Por el mismo bloqueo no hubo requests `GET/POST/PATCH /api/suppliers` ni consola de flujos internos para evaluar.
- `docs/prd/proveedores-compras-recibidas/epic.md` se reviso y permanece en `- Status: TODO`.
