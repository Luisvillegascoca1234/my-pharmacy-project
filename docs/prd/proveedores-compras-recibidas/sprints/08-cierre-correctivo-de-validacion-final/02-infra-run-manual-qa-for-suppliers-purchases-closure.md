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

- Entorno local disponible: `http://localhost:5173/` respondio, `GET http://localhost:4000/api/health` respondio `status: ok` y se inicio sesion con `admin@admin.com / admin`.
- Proveedores:
  - `/suppliers` cargo sin errores relevantes y permitio busqueda por `Sprint 08`.
  - `/suppliers/new` creo el proveedor farmaceutico `Distribuidora Sprint 08`.
  - `/suppliers/:id` abrio por URL directa, guardo edicion a `Distribuidora Sprint 08 Editada`, desactivo el proveedor y luego lo reactivo.
- Datos minimos para compras: se preparo proveedor activo, categoria farmaceutica, unidad `UND` y producto inventariable `Producto QA Sprint 08` con lote y vencimiento obligatorios.
- Compras:
  - `/purchases` cargo el listado y filtro por proveedor.
  - `/purchases/new` creo un borrador desde UI con `Producto QA Sprint 08`, lote `L-S8-NEW`, vencimiento `2027-10-31`, cantidad `4` y costo unitario `12.50`.
  - `/purchases/:id` abrio el detalle por URL directa, mostro borrador sincronizado y acciones de guardar, recibir y anular.
  - En borrador, una edicion pendiente bloqueo la recepcion hasta guardar; despues de guardar, la compra se recibio con notas de recepcion.
  - Una compra recibida intacta mostro accion de anulacion, exigio motivo y quedo `Anulada` con `Anulacion UI Sprint 08`.
- API de apoyo: se confirmo el ciclo transaccional de compra inventariable `draft -> received -> cancelled` con lote y vencimiento, incluyendo total esperado y motivo de anulacion.
- Rol `seller`: no habia credencial seed disponible para iniciar sesion como seller; se mantiene como limitacion no bloqueante segun el ticket 01, porque la validacion final se completo con usuario autorizado.
- Consola del navegador: sin errores relevantes durante los flujos cubiertos despues de la autenticacion.

## Completion Notes

- El ticket 02 queda ejecutado con evidencia exitosa sobre proveedores, compras, recepcion y anulacion.
- La validacion final paso para el circuito farmaceutico cubierto y el ticket 03 queda habilitado para marcar el epic como `DONE`.
- La unica limitacion registrada es la ausencia de credencial seed para validar sesion `seller`; no bloquea el cierre funcional del epic.
