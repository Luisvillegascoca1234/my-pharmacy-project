# Ticket 04 - Implement sales and inventory movements CSV exports with download audit

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03
- Blocks: 05

## Description

Implementar exportaciones CSV backend para ventas y movimientos de inventario. Las descargas deben usar separador punto y coma, fechas ISO, filtros basicos y registrar auditoria de extraccion de datos sensibles.

## Scope

- Crear o completar el modulo `exports` con rutas, controller, service, repository y tipos.
- Registrar `GET /exports/sales.csv` o la ruta documentada equivalente para ventas.
- Registrar `GET /exports/inventory-movements.csv` o la ruta documentada equivalente para movimientos.
- Proteger ambas rutas para `admin` y `superadmin`; `seller` no debe acceder.
- Validar `SalesCsvExportQuerySchema` y `InventoryMovementsCsvExportQuerySchema`.
- Exportar `sales.csv` con una fila por venta, estado, vendedor, caja, total, costo, margen, fechas y devolucion cuando aplique.
- Exportar `inventory-movements.csv` con una fila por movimiento, producto, lote, cantidad, costo, referencia, actor, motivo y fecha.
- Usar separador `;`, `text/csv; charset=utf-8` y fechas ISO.
- Registrar auditoria de cada descarga CSV con filtros usados, actor, archivo y cantidad de filas.

## Out Of Scope

- CSV por item vendido separado.
- XLSX u otros formatos.
- Pantallas de exportacion.
- Auditoria de consultas visuales de reportes.

## Acceptance Criteria

- `sales.csv` usa una fila por venta y respeta filtros de fecha.
- `inventory-movements.csv` usa una fila por movimiento y respeta filtros de fecha.
- Ambos CSV usan separador punto y coma y fechas ISO.
- Cada descarga crea un evento de auditoria.
- Las respuestas mantienen contrato o cabeceras documentadas sin romper OpenAPI.
