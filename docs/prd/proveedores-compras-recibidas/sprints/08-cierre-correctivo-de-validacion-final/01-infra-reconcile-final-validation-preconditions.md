# Ticket 01 - Reconcile Final Validation Preconditions

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Reconciliar las precondiciones de la validacion final que quedaron bloqueadas en el Sprint 07. Este ticket debe dejar claro que la validacion se hara sobre el dev server local disponible, con rutas, credenciales y datos minimos conocidos antes de intentar cerrar el epic.

## Scope

- evidencia del bloqueo anterior en el Sprint 07
- URL local de frontend para rutas de proveedores y compras
- URL local de backend para salud, autenticacion y endpoints de proveedores/compras
- credencial seed disponible `admin@admin.com / admin`
- datos minimos necesarios para crear proveedor, crear compra, recibir compra y anular con motivo
- lista de flujos que deben cubrirse antes de permitir el cierre del epic

## Out Of Scope

- iniciar o detener dev servers
- modificar funcionalidad de proveedores, compras, inventario o autenticacion
- agregar usuarios seed nuevos como requisito de cierre
- ampliar alcance a SIAT, pagos, caja, POS, reportes o inventario visual
- ejecutar QA de navegador dentro de este ticket

## Acceptance Criteria

- El bloqueo del Sprint 07 queda resumido como antecedente: frontend/backend inaccesibles, no fallo funcional confirmado.
- Quedan definidos los puntos de entrada de validacion: `/suppliers`, `/suppliers/new`, `/suppliers/:id`, `/purchases`, `/purchases/new` y `/purchases/:id`.
- Quedan definidos los endpoints relevantes de cierre: proveedores, compras, recepcion y anulacion.
- Queda documentado que `seller` se valida solo si existe credencial o sesion disponible para ese rol.
- El ticket 02 puede ejecutarse sin redescubrir las precondiciones basicas.

## Preconditions For Ticket 02

### Antecedente del Sprint 07

La validacion final del Sprint 07 quedo bloqueada por infraestructura local inaccesible: `http://localhost:5173/suppliers`, `http://localhost:5174/suppliers` y `http://localhost:4000/api/health` respondieron `net::ERR_CONNECTION_REFUSED`, y no habia listeners locales activos en `4000`, `5173` ni `5174` al momento del intento. Ese resultado no confirma fallo funcional en proveedores, compras, recepcion ni anulacion; solo deja pendiente la validacion con dev server disponible.

### Puntos de entrada locales

- Frontend principal: `http://localhost:5173`
- Backend principal: `http://localhost:4000/api`
- Salud backend: `GET http://localhost:4000/api/health`
- Autenticacion: `POST http://localhost:4000/api/auth/login`, `GET http://localhost:4000/api/auth/me`, `POST http://localhost:4000/api/auth/logout`
- Documentacion API de apoyo: `http://localhost:4000/api/docs`

Rutas web que debe cubrir el ticket 02:

- `http://localhost:5173/suppliers`
- `http://localhost:5173/suppliers/new`
- `http://localhost:5173/suppliers/:id`
- `http://localhost:5173/purchases`
- `http://localhost:5173/purchases/new`
- `http://localhost:5173/purchases/:id`

### Endpoints de cierre

Proveedores:

- `GET /api/suppliers`
- `GET /api/suppliers/:id`
- `POST /api/suppliers`
- `PATCH /api/suppliers/:id`

Compras:

- `GET /api/purchases`
- `GET /api/purchases/:id`
- `POST /api/purchases`
- `PATCH /api/purchases/:id`
- `POST /api/purchases/:id/receive`
- `POST /api/purchases/:id/cancel`

### Credenciales y roles

- Credencial seed disponible: `admin@admin.com / admin`.
- Esa credencial corresponde a `superadmin` y permite validar proveedores y compras.
- `admin` se valida solo si existe credencial o sesion disponible para ese rol en la base local.
- `seller` se valida solo si existe credencial o sesion disponible para ese rol. Si no existe, el ticket 02 debe registrar la ausencia de credencial sin bloquear por si sola el cierre funcional de proveedores/compras.

### Datos minimos de validacion

Proveedor:

- Crear un proveedor activo con `businessName` de al menos 2 caracteres.
- `nit`, `phone`, `address` y `contactName` son opcionales; si se usa `nit`, debe evitar duplicados.
- Conservar el `id` retornado para abrir `/suppliers/:id` y para crear la compra.

Compra en borrador:

- Requiere `supplierId` de proveedor activo.
- Requiere `purchaseDate` en formato `YYYY-MM-DD`.
- Requiere al menos un item con `productId`, `unitId`, `quantity` mayor a 0 y `unitCost` con hasta 2 decimales.
- El producto elegido debe estar activo y tener la unidad comercial configurada.
- Para trazabilidad farmaceutica de lote, usar `batchNumber` y `expirationDate` cuando el producto sea inventariable o cuando el flujo de recepcion lo solicite.

Recepcion:

- La compra debe estar en estado `draft`.
- La compra debe estar guardada antes de recibir; si la UI muestra cambios pendientes, la recepcion debe quedar bloqueada hasta guardar o descartar.
- `receiveNotes` es opcional.

Anulacion:

- La anulacion requiere `cancelReason` con motivo operativo claro de al menos 3 caracteres.
- Para compra `received`, la anulacion solo debe pasar si las capas generadas por la recepcion siguen intactas.
- Si la compra ya fue consumida por salidas posteriores, el bloqueo esperado debe documentarse con URL, paso exacto y respuesta observada.

### Flujos requeridos antes de cierre de epic

- Login con `superadmin` seed y confirmacion de sesion activa.
- Salud backend accesible.
- Proveedores: listar, filtrar, crear, abrir detalle por URL, editar y cambiar estado.
- Compras: listar, filtrar, crear borrador, abrir detalle por URL, editar borrador y validar bloqueo de recepcion con cambios pendientes.
- Recepcion: recibir una compra guardada y verificar estado `received`.
- Anulacion: anular con motivo una compra apta y verificar estado `cancelled`.
- Autorizacion: confirmar que `seller` no accede a proveedores ni compras solo si existe credencial o sesion disponible para ese rol.
- Consola y requests: registrar cualquier error relevante nuevo o respuesta 4xx/5xx inesperada en las rutas del alcance.

## Completion Notes

- Se reconcilio el bloqueo del Sprint 07 como antecedente de infraestructura local inaccesible, sin convertirlo en fallo funcional confirmado.
- Se definieron URLs locales, endpoints, credencial seed, roles condicionados y datos minimos para que el ticket 02 ejecute la validacion final sin redescubrir precondiciones basicas.
- No se modifico funcionalidad ni se ejecuto QA de navegador en este ticket.
