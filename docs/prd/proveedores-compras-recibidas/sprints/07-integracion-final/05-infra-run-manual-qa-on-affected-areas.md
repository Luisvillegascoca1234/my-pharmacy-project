# Ticket 05 - Run Manual QA On Affected Areas

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04
- Blocks: 06

## Description

Ejecutar QA manual enfocado sobre el cierre del epic de proveedores y compras recibidas, usando Playwright MCP para verificar flujos de navegador, navegacion, consola y requests relevantes.

Este es el ticket de validacion final del PRD. Cuando todos los flujos pasen y cualquier hallazgo bloqueante quede corregido y revalidado, actualizar `docs/prd/proveedores-compras-recibidas/epic.md` a `- Status: DONE`.

## Scope

- Playwright MCP sobre `/suppliers`, `/suppliers/new`, `/suppliers/:id`, `/purchases`, `/purchases/new` y `/purchases/:id`
- sidebar, titulos de ruta y redireccion de rutas no permitidas
- roles `superadmin`, `admin` y `seller` cuando existan credenciales o seed disponible
- requests `GET/POST/PATCH /api/suppliers`, `GET/POST/PATCH /api/purchases`, `POST /api/purchases/:id/receive` y `POST /api/purchases/:id/cancel`
- consola del navegador durante navegacion, creacion, edicion, recepcion y anulacion
- cierre de `epic.md` solo despues de validacion exitosa

## Out Of Scope

- iniciar el dev server
- exploracion amplia fuera de proveedores y compras
- QA de inventario visual, SIAT, POS, reportes, caja o cuentas por pagar
- pruebas automatizadas nuevas
- cierre de `epic.md` si hay bloqueos no resueltos o servidor inaccesible

## Acceptance Criteria

- QA manual usa Playwright MCP en todas las rutas web del scope que sean accesibles.
- Admin o superadmin puede listar, filtrar, crear, editar, desactivar/reactivar proveedores y abrir detalle por URL.
- Admin o superadmin puede listar, filtrar, crear borrador, abrir detalle, editar borrador, bloquear recepcion con `isDirty`, recibir y anular con motivo.
- Seller no ve ni accede accidentalmente a proveedores o compras.
- No aparecen respuestas 4xx o 5xx nuevas y relevantes en los flujos cubiertos, salvo errores esperados que la UI maneja correctamente.
- No aparecen errores nuevos y relevantes en consola durante los flujos cubiertos.
- Bloqueos por servidor no iniciado, datos seed, autenticacion o rutas inaccesibles se documentan con paso exacto y URL.
- `epic.md` se actualiza a `- Status: DONE` solamente cuando esta validacion final pasa despues de corregir hallazgos bloqueantes.

## QA Evidence

- Playwright MCP intento abrir `http://localhost:5173/suppliers`, pero el navegador devolvio `net::ERR_CONNECTION_REFUSED`.
- Playwright MCP intento abrir `http://localhost:5174/suppliers` como puerto alterno mencionado en evidencia previa, pero el navegador devolvio `net::ERR_CONNECTION_REFUSED`.
- Playwright MCP intento abrir `http://localhost:4000/api/health`, pero el navegador devolvio `net::ERR_CONNECTION_REFUSED`.
- Se verifico con `Get-NetTCPConnection` que no habia listeners locales activos en los puertos esperados `4000`, `5173` ni `5174` al momento del intento.
- El seed del repo documenta credencial superadmin disponible `admin@admin.com / admin`; no se encontraron credenciales seed directas para `admin` o `seller`, por lo que esos roles solo aplicaban si existian usuarios creados en la base actual.
- El QA funcional de `/suppliers`, `/suppliers/new`, `/suppliers/:id`, `/purchases`, `/purchases/new` y `/purchases/:id` quedo bloqueado porque frontend y backend no estaban accesibles; iniciar el dev server esta fuera de alcance de este ticket.
- Por el bloqueo de servidor no se pudieron ejercitar sidebar, titulos de ruta, redireccion de rutas no permitidas, flujos de creacion/edicion/recepcion/anulacion, consola interna ni requests `GET/POST/PATCH /api/suppliers`, `GET/POST/PATCH /api/purchases`, `POST /api/purchases/:id/receive` y `POST /api/purchases/:id/cancel`.
- `docs/prd/proveedores-compras-recibidas/epic.md` fue revisado y permanece en `- Status: TODO` porque la validacion final no paso.
