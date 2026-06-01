# Ticket 02 - Run Manual QA For Suppliers Purchases Closure

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Ejecutar la validacion manual final que quedo bloqueada en el Sprint 07, usando Playwright MCP sobre los flujos web de proveedores y compras recibidas. Este ticket produce evidencia; el cierre formal del epic queda para el ticket 03.

## Scope

- navegacion por `/suppliers`, `/suppliers/new`, `/suppliers/:id`, `/purchases`, `/purchases/new` y `/purchases/:id`
- sidebar, titulos de ruta, deep links y redireccion de rutas no permitidas
- listado, busqueda, filtros, paginacion, creacion, edicion, desactivacion/reactivacion de proveedores
- listado, filtros, creacion de borrador, detalle, edicion, bloqueo por cambios pendientes, recepcion y anulacion de compras
- consola del navegador y requests relevantes de proveedores, compras, recepcion y anulacion
- validacion de rol `superadmin` y, si existen credenciales disponibles, `admin` y `seller`

## Out Of Scope

- iniciar o detener dev servers
- pruebas automatizadas nuevas
- QA de SIAT, pagos, caja, POS, reportes, kardex visual o stock por lote
- corregir hallazgos funcionales dentro de este mismo ticket sin registrarlos
- marcar `epic.md` como `DONE` antes del ticket 03

## Acceptance Criteria

- Playwright MCP se usa para cubrir las rutas web del alcance.
- Admin o superadmin puede completar el flujo de proveedor: listar, filtrar, crear, editar, cambiar estado y abrir detalle por URL.
- Admin o superadmin puede completar el flujo de compra: listar, filtrar, crear borrador, editar, bloquear recepcion con cambios pendientes, recibir y anular con motivo.
- Seller no accede accidentalmente a proveedores o compras cuando exista forma de validar ese rol.
- No aparecen errores relevantes nuevos en consola ni respuestas 4xx/5xx inesperadas durante los flujos cubiertos.
- Si aparece un bloqueo, queda documentado con URL, paso exacto, resultado observado y accion siguiente.
- Si la validacion pasa, el ticket 03 queda desbloqueado para cerrar el epic.

## QA Evidence

- Playwright MCP intento abrir `http://localhost:5173/`, pero el navegador devolvio `net::ERR_CONNECTION_REFUSED`.
- Validacion de puertos locales:
  - `Test-NetConnection -ComputerName localhost -Port 5173`: `TcpTestSucceeded: False`.
  - `Test-NetConnection -ComputerName localhost -Port 5174`: `TcpTestSucceeded: False`.
  - `Test-NetConnection -ComputerName localhost -Port 4000`: `TcpTestSucceeded: False`.
- `Invoke-RestMethod -Uri http://localhost:4000/api/health -Method Get -TimeoutSec 5` rechazo conexion con el mensaje: `No se puede establecer una conexion ya que el equipo de destino denego expresamente dicha conexion. (localhost:4000)`.
- Paso exacto bloqueado: navegar a `http://localhost:5173/` como punto de entrada al frontend para iniciar login y recorrer `/suppliers`, `/suppliers/new`, `/suppliers/:id`, `/purchases`, `/purchases/new` y `/purchases/:id`.
- Resultado observado: frontend y backend locales no estaban accesibles en los puertos definidos por el ticket 01; por eso no se pudo autenticar `admin@admin.com / admin`, ni ejercitar flujos de proveedores, compras, recepcion, anulacion, sidebar, titulos de ruta, deep links, redireccion de rutas no permitidas, consola interna ni requests funcionales del alcance.
- Accion siguiente: levantar o exponer el dev server local en `http://localhost:5173` y `http://localhost:4000/api`, confirmar `GET /api/health`, y reintentar el QA manual antes de ejecutar el ticket 03.

## Completion Notes

- El ticket 02 queda ejecutado como intento de QA manual con bloqueo de infraestructura documentado.
- La validacion final no paso y el ticket 03 no queda habilitado para marcar el epic como `DONE`; solo puede registrar el bloqueo restante.
- No se modifico funcionalidad ni se inicio/detuvo ningun dev server, porque esta fuera de alcance.
