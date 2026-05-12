# Ticket 03 - Build Supplier Create And Detail Routes

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 05

## Description

Crear las rutas `/suppliers/new` y `/suppliers/:id` con formulario de proveedor para alta y edicion. El flujo debe permitir editar datos comerciales, guardar cambios, activar o desactivar proveedores sin borrar historial, y cargar el detalle directamente desde URL usando el hook/facade del modulo.

## Scope

- rutas frontend `/suppliers/new` y `/suppliers/:id`
- pantalla o componentes locales de formulario de proveedor
- carga de detalle por `id`
- creacion con redireccion posterior a `/suppliers/:id` desde la pagina
- edicion de `businessName`, `nit`, `phone`, `address`, `contactName` y `status`
- bloqueo visual o confirmacion conservadora para cambiar estado cuando corresponda

## Out Of Scope

- creacion rapida de proveedor desde compras
- historial de compras del proveedor
- eliminacion fisica de proveedores
- carga de documentos SIAT o datos fiscales avanzados
- sincronizacion de filtros por query params
- cambios backend o nuevos campos de dominio

## Acceptance Criteria

- `/suppliers/new` inicia un formulario limpio, permite NIT vacio y guarda usando `POST /api/suppliers`.
- Al crear correctamente, la pagina navega a `/suppliers/:id`; la navegacion vive en la pagina, no en el store.
- `/suppliers/:id` carga detalle por URL, muestra estado de carga/error/not-found y permite editar mientras el rol tenga acceso.
- Guardar detalle usa `PATCH /api/suppliers/:id`, conserva el proveedor seleccionado actualizado y limpia `isDirty`.
- El formulario valida campos con los limites del contrato compartido antes de enviar cuando sea razonable para la UI.
- El cambio `active`/`inactive` esta disponible como accion explicita y no implica borrar historial.
- Si hay cambios pendientes, la pantalla refleja `isDirty` y evita perderlos accidentalmente en acciones destructivas del propio formulario.
- El store se resetea al desmontar la ruta, incluso al navegar entre lista y detalle, de acuerdo con la decision del PRD.
