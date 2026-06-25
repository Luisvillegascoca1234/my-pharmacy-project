# Ticket 03 - Implement inventory valuation and expiring products reports

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Implementar reportes backend de valuacion de inventario y productos proximos a vencer. Ambos reportes deben usar lotes disponibles como fuente de trazabilidad farmaceutica y responder sin generar auditoria.

## Scope

- Registrar `GET /reports/inventory-valuation`.
- Registrar `GET /reports/expiring-products`.
- Proteger ambas rutas para `admin` y `superadmin`; `seller` no debe acceder.
- Validar `InventoryValuationReportQuerySchema` y `ExpiringProductsReportQuerySchema`.
- Calcular valuacion por producto usando costo base real de lotes disponibles.
- Excluir lotes agotados, cancelados o no disponibles de valuacion.
- Incluir detalle por lote con vencimiento, cantidad disponible, costo base y valor.
- Calcular proximos vencimientos con parametro `days`, default 30, y zona horaria `America/La_Paz`.
- Marcar `audited: false` y no escribir `AuditLog`.

## Out Of Scope

- Alertas automaticas de vencimiento.
- Ajustes de inventario.
- Exportaciones CSV.
- UI expandible por lote.

## Acceptance Criteria

- Valuacion suma lotes disponibles por producto y expone detalle por lote.
- Lotes agotados o cancelados no aportan valor.
- Vencimientos respeta `days`, default 30 y fechas operativas Bolivia.
- Las respuestas validan contra schemas compartidos.
- Consultar reportes visuales no crea eventos de auditoria.
