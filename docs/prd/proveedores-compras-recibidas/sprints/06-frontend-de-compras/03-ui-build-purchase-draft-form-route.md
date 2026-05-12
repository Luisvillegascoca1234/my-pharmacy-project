# Ticket 03 - Build purchase draft form route

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Construir `/purchases/new` y el modo editable de `/purchases/:id` cuando la compra este en `draft`. El formulario debe permitir seleccionar proveedor activo, fecha comercial, notas e items de productos activos con unidades configuradas, guardando borradores contra backend y redirigiendo a la URL estable del detalle despues de crear.

## Scope

- pagina o componentes de formulario para compras fuera de `frontend/src/modules`
- consumo de `usePurchases`, `useSuppliers` y `useProductsCatalog` desde barrels publicos
- selector de proveedor activo
- selector local de productos activos y unidades configuradas por producto
- edicion de items con cantidad, costo unitario, lote y vencimiento cuando aplique
- calculos visuales derivados para subtotal y total, manteniendo el total autoritativo en backend
- guardado de borrador y redireccion desde `/purchases/new` hacia `/purchases/:id`
- indicador visible de cambios pendientes basado en `isDirty`

## Out Of Scope

- recepcion y anulacion, salvo dejar el estado del formulario listo para bloquear recepcion con cambios pendientes
- creacion rapida de proveedor dentro del formulario
- creacion o edicion de productos/unidades desde compras
- validaciones fiscales, SIAT, pagos, cuentas por pagar o descuentos complejos
- query params sincronizados con filtros
- cambios backend

## Acceptance Criteria

- `/purchases/new` inicializa un borrador limpio con fecha comercial editable y al menos un item requerido por el contrato antes de guardar.
- Crear compra llama `POST /api/purchases` mediante el modulo y navega desde la pagina, no desde el store, a `/purchases/:id`.
- `/purchases/:id` permite editar encabezado e items solo cuando `status = draft`.
- Proveedores inactivos no se ofrecen para nuevas compras; proveedores historicos de una compra existente pueden mostrarse sin romper el detalle.
- Productos inactivos no se ofrecen para items nuevos; cada item permite elegir solo unidades configuradas para ese producto.
- Items inventariables exponen lote y vencimiento; items no inventariables no obligan a inventar datos sanitarios en UI.
- Duplicados equivalentes dentro del borrador se previenen o se muestran como error antes de guardar.
- El estado `isDirty` se actualiza con cambios de encabezado e items y vuelve a `false` tras guardado exitoso.
- Compras `received` o `cancelled` se renderizan como solo lectura.
- La UI muestra errores de validacion o backend sin colocar copy visible dentro del modulo portable.
