# Decisions - Proveedores y Compras Recibidas

## Dominio

- Los proveedores pueden crearse sin NIT.
- Si existe NIT, debe ser único.
- Las compras tienen estados `draft`, `received` y `cancelled`.
- `documentNumber` queda diferido para SIAT.
- `purchaseDate` es obligatoria y representa fecha comercial.
- `receivedAt` usa fecha/hora del servidor.
- `notes`, `receiveNotes` y `cancelReason` son campos separados.
- `cancelReason` es obligatorio para cualquier anulación.

## Inventario

- Se usan capas internas de `InventoryBatch` para soportar costos distintos en el mismo lote físico.
- Cada ítem inventariable recibido crea una capa.
- La UI de inventario futura agrupará por producto, número de lote y vencimiento.
- Las ventas futuras consumirán por FEFO y, en empate, por capa más antigua.
- El precio de venta no cambia por mezclar capas; el margen se calcula con costos reales de las capas consumidas.
- `InventoryMovement` referencia la capa exacta con `batchId`.
- `InventoryMovement` también guarda `productId` para consultas.
- Recepción usa cantidad positiva y anulación usa cantidad negativa.
- Las capas anuladas no se borran; quedan en `status = cancelled` y `availableQuantity = 0`.

## Compras

- `POST /api/purchases` exige al menos un ítem.
- `PATCH /api/purchases/:id` reemplaza encabezado e ítems completos mientras la compra está en `draft`.
- La recepción solo se permite si el formulario no tiene cambios pendientes.
- El total se calcula en backend.
- La unidad de compra debe estar configurada en `ProductUnit`.
- `PurchaseItem` guarda snapshot de conversión y costos.
- Productos inactivos no se pueden agregar ni recibir.
- Ítems no inventariables pueden recibirse sin crear inventario.
- Ítems duplicados equivalentes se rechazan.

## Reversa

- Una compra `draft` puede anularse con motivo.
- Una compra `received` puede anularse solo si todas sus capas exactas conservan la cantidad original.
- Si alguna capa ya fue consumida, la anulación directa se bloquea.
- La anulación recibida crea movimientos inversos y auditoría.

## Frontend

- Proveedores tendrán rutas `/suppliers`, `/suppliers/new` y `/suppliers/:id`.
- Compras tendrán rutas `/purchases`, `/purchases/new` y `/purchases/:id`.
- Zustand manejará todo el estado de proveedores y compras.
- Habrá stores separados: `SuppliersStore` y `PurchasesStore`.
- Cada store tendrá lista, filtros, paginación, detalle seleccionado, `draftForm`, `isDirty`, status, error, acciones async y reset.
- Las páginas llaman `load*` al montar.
- Las páginas resetean el store completo al desmontar, incluso al navegar de lista a detalle.
- Los filtros y paginación no se sincronizan con query params en esta versión.

## Paginación

- `page` es 1-based.
- `pageSize` default es 20.
- `pageSize` máximo es 100.
- Cambiar filtros resetea `page` a 1.
- Cambiar página conserva filtros.
