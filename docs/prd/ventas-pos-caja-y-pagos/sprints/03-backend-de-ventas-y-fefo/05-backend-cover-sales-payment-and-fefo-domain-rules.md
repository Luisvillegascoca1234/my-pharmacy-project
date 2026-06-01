# Ticket 05 - Cover Sales Payment And FEFO Domain Rules

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04
- Blocks: 08

## Description

Agregar pruebas automatizadas para venta POS, pago efectivo, FEFO y margen. Las pruebas deben proteger las reglas de dominio mas riesgosas: caja abierta, stock vendible, transaccion completa, movimientos de salida y calculo economico por lote.

## Scope

- Pruebas de busqueda POS.
- Pruebas de creacion de venta con caja abierta.
- Pruebas de rechazo sin caja abierta.
- Pruebas de pago efectivo y cambio.
- Pruebas de FEFO con uno y varios lotes.
- Pruebas de stock insuficiente y rollback.
- Pruebas de movimientos de inventario y margen.

## Out Of Scope

- Pruebas de anulacion de venta.
- Pruebas de carritos pendientes.
- Pruebas de UI o navegador.
- Pruebas de SIAT, QR, tarjeta o credito.

## Acceptance Criteria

- Hay prueba para busqueda que excluye productos sin stock vendible.
- Hay prueba para venta rechazada sin caja abierta.
- Hay prueba para pago insuficiente.
- Hay prueba para venta valida con un solo lote.
- Hay prueba para venta valida repartida en varios lotes FEFO.
- Hay prueba para stock insuficiente que no deja venta, pago, movimiento ni descuento parcial.
- Hay prueba para margen usando costo real de capa consumida.
- Hay prueba para detalle de venta con permisos de vendedor y admin/superadmin.
