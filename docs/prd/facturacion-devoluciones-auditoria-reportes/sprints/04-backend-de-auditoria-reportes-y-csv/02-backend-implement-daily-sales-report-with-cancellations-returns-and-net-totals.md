# Ticket 02 - Implement daily sales report with cancellations returns and net totals

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Implementar el reporte backend de ventas diarias para comparar ventas brutas, anulaciones, devoluciones y neto operativo. El reporte debe usar cortes diarios en zona horaria de Bolivia y no generar auditoria por consulta visual.

## Scope

- Crear o completar el modulo `reports` con rutas, controller, service, repository y tipos.
- Registrar `GET /reports/daily-sales`.
- Proteger la ruta para `admin` y `superadmin`; `seller` no debe acceder.
- Validar `DailySalesReportQuerySchema` y responder con `DailySalesReportResponseSchema`.
- Interpretar `fromDate` y `toDate` como dias operativos en `America/La_Paz`.
- Calcular ventas brutas, anulaciones, devoluciones, neto, cantidad de ventas, cantidad de anulaciones y cantidad de devoluciones.
- Tratar ventas `returned` y pagos `refunded` como devoluciones, separadas de anulaciones POS.
- Marcar `audited: false` y no escribir `AuditLog`.

## Out Of Scope

- Exportacion CSV.
- Reportes BI avanzados o data warehouse.
- Pantallas y graficos.
- Auditoria de consultas visuales.

## Acceptance Criteria

- El reporte agrupa por dia operativo Bolivia y respeta el rango solicitado.
- Ventas netas restan anulaciones y devoluciones segun contratos compartidos.
- Anulaciones y devoluciones quedan diferenciadas en monto y conteo.
- La respuesta valida contra `DailySalesReportResponseSchema`.
- Consultar el reporte no crea eventos de auditoria.
