# Ticket 02 - Build Suppliers List Route

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Construir la pantalla `/suppliers` para que `admin` y `superadmin` puedan consultar proveedores con paginacion, busqueda y filtro por estado usando el modulo de datos creado en el ticket 01. La pagina debe reemplazar el placeholder de modulo para proveedores y mantener la composicion visual consistente con `frontend/src/pages/products-page.tsx` y las primitivas UI existentes.

## Scope

- `frontend/src/pages/suppliers-page.tsx` o carpeta equivalente bajo `frontend/src/pages/suppliers`
- componentes locales de pagina si el patron existente lo requiere
- consumo publico de `frontend/src/modules/suppliers`
- estados de carga, error, vacio, busqueda, filtro por estado y paginacion
- enlaces o acciones hacia `/suppliers/new` y `/suppliers/:id`

## Out Of Scope

- formularios de creacion y edicion completos
- modulo o rutas de compras
- query params sincronizados con filtros
- permisos nuevos o cambios de backend
- pruebas E2E o QA manual

## Acceptance Criteria

- `/suppliers` renderiza una lista paginada con razon social, NIT cuando exista, contacto disponible, estado y acciones de detalle/edicion.
- La busqueda y el filtro por estado llaman al hook/modulo de proveedores, resetean `page` a 1 y no cargan datos por cliente fuera del contrato backend.
- La paginacion usa la metadata de `SuppliersListResponse` y conserva filtros al cambiar de pagina.
- La pantalla muestra estados profesionales de carga, error y vacio sin romper el layout en desktop o mobile.
- La accion principal navega a `/suppliers/new`; cada fila puede navegar a `/suppliers/:id`.
- El contenido visible de cliente esta en espanol y fuera de `frontend/src/modules`.
- La pagina consume solo el barrel publico del modulo de proveedores, no imports profundos de API/store internos.
- Al desmontar la pagina se resetea el estado de proveedores segun la decision del PRD.
