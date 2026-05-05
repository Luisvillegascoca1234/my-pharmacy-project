# 07 - Proveedores y compras recibidas

## Objetivo

Registrar proveedores y compras, y convertir una compra recibida en lotes de inventario con movimientos de entrada. Este es el primer flujo fuerte de consistencia transaccional.

## Alcance

- CRUD de proveedores.
- Compra en borrador.
- Detalle de compra con unidad comercial.
- Recepcion de compra.
- Creacion o actualizacion de lote.
- Movimiento de inventario de entrada.
- Auditoria de recepcion.

## Backend

Modulos:

```text
backend/src/modules/suppliers/
backend/src/modules/purchases/
backend/src/modules/inventory/
```

Endpoints minimos:

- `GET /api/suppliers`
- `POST /api/suppliers`
- `PATCH /api/suppliers/:id`
- `GET /api/purchases`
- `GET /api/purchases/:id`
- `POST /api/purchases`
- `PATCH /api/purchases/:id`
- `POST /api/purchases/:id/receive`
- `POST /api/purchases/:id/cancel`

Reglas:

- Compra en borrador no modifica inventario.
- Compra recibida crea lotes y movimientos dentro de una transaccion.
- Cada item debe tener lote y vencimiento.
- Cantidad debe normalizarse a unidad base.
- Compra recibida no debe editarse como borrador.
- Compra anulada se conserva para auditoria.

## Frontend

Modulos:

```text
frontend/src/modules/suppliers/
frontend/src/modules/purchases/
```

Pantallas:

- Lista de proveedores.
- Lista de compras.
- Formulario de compra en borrador.
- Vista de recepcion con validacion de lotes y vencimientos.

## Contratos compartidos

Schemas:

- `SupplierSchema`
- `PurchaseSchema`
- `PurchaseItemSchema`
- `CreatePurchaseSchema`
- `ReceivePurchaseSchema`

## Verificacion

- Admin o superadmin crea proveedor.
- Admin o superadmin crea compra borrador.
- Recibir compra genera lote disponible.
- Recibir compra genera `inventory_movements`.
- La operacion falla completa si un item es invalido.
- Auditoria registra recepcion.

## Fuera de alcance

- Pago a proveedores.
- Cuentas por pagar.
- Descuentos complejos de compra.
- Importacion desde factura de proveedor.
