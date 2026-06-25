# Ticket 04 - Build audit log page with filters pagination and metadata disclosure

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03
- Blocks: 05

## Description

Construir la pagina de auditoria consultable para `superadmin`, con filtros basicos, paginacion descendente y metadata completa desplegable. La pantalla debe facilitar investigacion de acciones sensibles sin mezclarla con reportes operativos de administracion general.

## Scope

- Ruta `/audit` reemplazando el placeholder actual para usuarios autorizados.
- Filtros por accion, actor, entidad, entidad afectada y rango de fechas si el contrato lo permite.
- Paginacion con total, pagina actual, tamano de pagina y orden descendente por fecha.
- Listado con resumen legible de evento sensible, actor, fecha, entidad y resultado.
- Detalle colapsable de metadata completa preservando estructura antes/despues cuando exista.

## Out Of Scope

- Edicion o eliminacion de auditoria.
- Exportar auditoria a CSV.
- Agregar nuevos eventos auditados desde frontend.
- Dar acceso a `admin` o `seller` a la pagina de auditoria.

## Acceptance Criteria

- Solo `superadmin` puede usar `/audit`; `admin` y `seller` ven acceso bloqueado por el guard de rutas.
- La pagina permite filtrar, limpiar filtros, recargar y navegar paginas sin perder estados de carga/error.
- Cada fila muestra un resumen escaneable y permite desplegar metadata completa sin truncar evidencia critica.
- Metadata vacia o no estructurada se representa de forma segura y legible.
- La pagina consume el hook/facade publico del modulo de auditoria y no importa internals del modulo.
