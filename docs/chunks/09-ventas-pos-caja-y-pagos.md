# 09 - Ventas POS, caja y pagos

## Objetivo

Construir el flujo operativo del vendedor: abrir caja, registrar venta pagada en efectivo, descontar inventario por FEFO y dejar movimientos, pago y auditoria.

## Alcance

- Apertura y cierre de caja simple.
- Busqueda de productos disponibles.
- Carrito POS.
- Venta pagada al momento.
- Pago en efectivo V1.
- Descuento de lotes por FEFO.
- Movimiento de salida por venta.
- Margen por item usando costo del lote.

## Backend

Modulos:

```text
backend/src/modules/cash/
backend/src/modules/sales/
backend/src/modules/inventory/
```

Endpoints minimos:

- `POST /api/cash-sessions/open`
- `POST /api/cash-sessions/:id/close`
- `GET /api/cash-sessions/current`
- `GET /api/pos/products`
- `POST /api/sales`
- `GET /api/sales/:id`

Reglas:

- Vendedor debe tener caja abierta para vender si se habilita esa restriccion.
- Venta se ejecuta en transaccion.
- FEFO descuenta primero vencimiento mas cercano disponible.
- Stock insuficiente cancela toda la venta.
- Cada salida genera movimiento de inventario.
- Pago queda relacionado con venta y caja.
- No hay credito ni cuentas por cobrar.

## Frontend

Modulos:

```text
frontend/src/modules/cash/
frontend/src/modules/pos/
frontend/src/modules/sales/
```

Pantallas:

- Apertura de caja.
- POS de venta.
- Confirmacion de pago efectivo.
- Cierre de caja.
- Detalle de venta.

## Contratos compartidos

Schemas:

- `CashSessionSchema`
- `OpenCashSessionSchema`
- `CloseCashSessionSchema`
- `SaleSchema`
- `CreateSaleSchema`
- `PaymentSchema`

## Verificacion

- Vendedor abre caja.
- Vendedor busca producto con stock.
- Venta descuenta lote correcto por FEFO.
- Venta crea pago efectivo.
- Caja muestra total esperado.
- Cierre calcula diferencia entre esperado y contado.

## Fuera de alcance

- QR real.
- Tarjeta.
- Credito.
- Factura SIAT real.
- Devoluciones.
