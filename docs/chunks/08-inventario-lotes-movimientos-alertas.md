# 08 - Inventario, lotes, movimientos y alertas

## Objetivo

Hacer visible y confiable el estado del inventario por lote, con movimientos como fuente analitica y alertas operativas basicas.

## Alcance

- Consulta de stock por producto y lote.
- Kardex o historial de movimientos.
- Ajustes manuales controlados.
- Alertas de stock bajo, agotado, proximo a vencer y vencido.
- FEFO visible para simular salida recomendada.
- Auditoria de ajustes.

## Backend

Modulo principal:

```text
backend/src/modules/inventory/
backend/src/modules/alerts/
```

Endpoints minimos:

- `GET /api/inventory/stock`
- `GET /api/inventory/products/:productId/batches`
- `GET /api/inventory/movements`
- `POST /api/inventory/adjustments`
- `GET /api/inventory/products/:productId/fefo-preview`
- `GET /api/alerts`

Reglas:

- Todo ajuste genera movimiento.
- Ajuste exige motivo.
- Solo admin y superadmin ajustan inventario.
- Lotes vencidos o bloqueados no deben salir por FEFO.
- Alertas deben derivarse de datos reales, no mantenerse como texto suelto sin relacion.

## Frontend

Modulos:

```text
frontend/src/modules/inventory/
frontend/src/modules/alerts/
```

Pantallas:

- Stock actual por lote.
- Movimientos de inventario con filtros.
- Ajuste manual.
- Panel de alertas operativas.

## Contratos compartidos

Schemas:

- `InventoryBatchSchema`
- `InventoryMovementSchema`
- `InventoryAdjustmentSchema`
- `CreateInventoryAdjustmentSchema`
- `AlertSchema`

## Verificacion

- Compra recibida aparece en stock por lote.
- Movimiento de entrada aparece en kardex.
- Ajuste manual aumenta o disminuye lote.
- Ajuste manual crea movimiento y auditoria.
- Alerta de stock bajo aparece cuando corresponde.
- FEFO preview ordena lotes por fecha de vencimiento.

## Fuera de alcance

- Venta POS.
- Devoluciones.
- Conteo fisico masivo.
- Bloqueo sanitario avanzado de lotes.
