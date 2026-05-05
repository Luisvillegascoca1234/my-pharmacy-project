# 10 - Facturacion, devoluciones, auditoria y reportes

## Objetivo

Cerrar el primer ciclo administrativo: separar venta de factura, permitir devoluciones controladas, exponer auditoria completa y generar reportes exportables.

## Alcance

- Factura como entidad fiscal separada de venta.
- Estados SIAT preparados.
- Anulacion de factura restringida.
- Devolucion controlada de venta.
- Auditoria consultable.
- Reportes operativos iniciales.
- Exportacion CSV.

## Backend

Modulos:

```text
backend/src/modules/billing/
backend/src/modules/returns/
backend/src/modules/audit/
backend/src/modules/reports/
backend/src/modules/exports/
```

Endpoints minimos:

- `POST /api/billing/invoices/from-sale/:saleId`
- `POST /api/billing/invoices/:id/cancel`
- `GET /api/billing/invoices`
- `POST /api/returns`
- `GET /api/audit-logs`
- `GET /api/reports/daily-sales`
- `GET /api/reports/inventory-valuation`
- `GET /api/reports/expiring-products`
- `GET /api/exports/inventory-movements.csv`
- `GET /api/exports/sales.csv`

Reglas:

- Venta y factura no son la misma entidad.
- Solo admin y superadmin anulan facturas.
- Devolucion debe referenciar venta original y lotes involucrados.
- Devolucion impacta inventario y caja segun estado de venta/factura.
- Reportes se apoyan en `inventory_movements`, ventas, compras, pagos e invoices.
- CSV usa fechas ISO, cantidades en unidad base e IDs estables.

## Frontend

Modulos:

```text
frontend/src/modules/billing/
frontend/src/modules/returns/
frontend/src/modules/audit/
frontend/src/modules/reports/
frontend/src/modules/exports/
```

Pantallas:

- Facturas por estado.
- Anulacion de factura.
- Registro de devolucion.
- Auditoria con filtros.
- Reportes iniciales.
- Botones de exportacion CSV.

## Contratos compartidos

Schemas:

- `InvoiceSchema`
- `CreateInvoiceFromSaleSchema`
- `CancelInvoiceSchema`
- `SaleReturnSchema`
- `CreateSaleReturnSchema`
- `AuditLogSchema`
- `ReportFilterSchema`

## Verificacion

- Venta puede generar factura en estado preparado.
- Admin o superadmin anula factura.
- Seller no puede anular factura.
- Devolucion registra motivo y usuario autorizador.
- Devolucion genera movimientos si retorna stock.
- Auditoria muestra eventos sensibles.
- Reporte de ventas diarias refleja ventas reales.
- CSV de movimientos puede abrirse con columnas limpias.

## Fuera de alcance

- Integracion SIAT completa si no entra en V1.
- Data warehouse.
- BI externo.
- QR integrado.
- Notas fiscales complejas fuera del alcance academico inicial.
