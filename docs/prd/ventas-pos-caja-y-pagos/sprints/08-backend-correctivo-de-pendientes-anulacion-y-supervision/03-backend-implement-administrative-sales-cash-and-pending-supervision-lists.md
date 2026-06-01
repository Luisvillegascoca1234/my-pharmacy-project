# Ticket 03 - Implement Administrative Sales Cash And Pending Supervision Lists

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Implementar listados backend paginados para supervision administrativa de ventas, cajas y pendientes. Admin y superadmin deben poder revisar operaciones de mostrador por fecha, vendedor, caja y estado; vendedor debe quedar limitado a sus datos permitidos.

## Scope

- Listado de ventas propias para vendedor.
- Listado de ventas de todos para admin/superadmin con filtros operativos.
- Listado de cajas supervisables con estado, vendedor, apertura, cierre, esperado, contado y diferencia.
- Cierre de caja ajena ya existente reconciliado con permisos y listados administrativos.
- Listado de pendientes de todos para admin/superadmin.
- Paginacion consistente en ventas, cajas y pendientes.
- Filtros por fecha, vendedor, caja y estado cuando el contrato lo contemple.

## Out Of Scope

- Reportes analiticos completos.
- Graficos, dashboards o exportaciones.
- Desglose de billetes y monedas.
- Auditoria historica global fuera del flujo de ventas/caja.
- Nuevas metricas financieras.
- UI nueva.
- SIAT, QR, tarjeta o credito.

## Acceptance Criteria

- Vendedor solo lista ventas y pendientes propios cuando corresponde.
- Admin y superadmin pueden listar ventas, cajas y pendientes de todos con paginacion.
- Las cajas abiertas y cerradas exponen datos suficientes para supervision y cierre ajeno.
- Los filtros aceptados no permiten saltarse restricciones de rol.
- Las respuestas paginadas mantienen una forma consistente con el resto de la API.
- Los listados administrativos no incluyen operaciones fuera del alcance V1.
