# PRD: Proveedores y Compras Recibidas

## Resumen

Implementar el flujo de proveedores y compras recibidas para una farmacia: CRUD de proveedores, compras en borrador, recepción transaccional, capas de inventario por costo, movimientos de entrada, anulación controlada y auditoría.

Documentos completos:

- PRD: `docs/prd/proveedores-compras-recibidas/PRD.md`
- Epic: `docs/prd/proveedores-compras-recibidas/epic.md`
- Decisiones: `docs/prd/proveedores-compras-recibidas/decisions.md`

## Problema

El sistema ya tiene productos, unidades y conversiones, pero todavía no puede convertir una compra real en inventario disponible. Se necesita registrar compras de proveedores con consistencia transaccional, trazabilidad y soporte para costos variables por lote, algo común por variaciones de dólar.

## Solución

Crear módulos backend y frontend para proveedores y compras. Una compra en `draft` no toca inventario. Al recibirla, se validan ítems, se normalizan cantidades a unidad base, se crean capas `InventoryBatch`, se registran `InventoryMovement` y se audita la operación. Si una recepción fue error, se podrá anular solo si las capas creadas siguen intactas.

## Implementación

- Backend modular con `suppliers`, `purchases` e `inventory`.
- Contratos compartidos Zod y respuesta paginada genérica.
- Prisma models para proveedores, compras, ítems, capas de inventario y movimientos.
- Endpoints paginados y rutas de detalle.
- Transacciones explícitas para recepción y anulación.
- Frontend con rutas `/suppliers`, `/suppliers/new`, `/suppliers/:id`, `/purchases`, `/purchases/new` y `/purchases/:id`.
- Zustand separado para proveedores y compras, manejando filtros, paginación, detalle, drafts, `isDirty`, errores y resets.

## Testing

- Probar services backend de compras como núcleo transaccional.
- Cubrir recepción válida, fallas por ítem inválido, reversa intacta y bloqueo de reversa consumida.
- Probar proveedores, paginación, NIT opcional único y auditoría.
- Probar stores Zustand para filtros, paginación, carga, reset e `isDirty`.

## Epic principal

`proveedores-compras-recibidas`: entregar el flujo completo desde gestión de proveedores hasta recepción que genera inventario y movimientos.

## Estado de cierre

El epic sigue en `TODO`. La validacion final registrada en el Sprint 08 quedo bloqueada porque los puntos locales de frontend y backend rechazaron conexion; no hay evidencia exitosa para cerrar el circuito de proveedores, compras recibidas, recepcion, anulacion y permisos. El cierre debe reintentarse cuando el entorno local responda y `GET /api/health` confirme disponibilidad.

## Fuera de alcance

- SIAT y `documentNumber`.
- Pagos a proveedores.
- Cuentas por pagar.
- Pantalla de stock y kardex visual.
- Ajustes manuales, alertas y FEFO preview.
- Venta POS.
- Sincronización de filtros con query params.
