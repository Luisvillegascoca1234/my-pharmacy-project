# Ticket 03 - Build POS Page Search Cart And Cash Payment

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Construir la pantalla POS base para venta rapida de mostrador. La experiencia debe partir del estado de caja, permitir buscar productos vendibles, armar un carrito, cobrar en efectivo y confirmar una venta anonima con seleccion FEFO resuelta por backend.

## Scope

- Indicador de caja abierta requerido para vender.
- Busqueda por texto, codigo interno o codigo de barras.
- Resultados con nombre comercial, precio, stock vendible y proximo vencimiento cuando exista.
- Agregado de productos al carrito con cantidad entera positiva.
- Edicion de cantidad, eliminacion de item y vaciado del carrito.
- Panel de cobro efectivo con total, monto recibido y cambio.
- Confirmacion de venta anonima o consumidor final.
- Prevencion de cobro cuando la caja no esta abierta, el carrito esta vacio o el monto recibido no alcanza.

## Out Of Scope

- Carritos pendientes: guardar, retomar, editar o descartar.
- Seleccion manual de lote o alteracion de FEFO.
- Cliente formal, NIT, razon social o facturacion SIAT.
- Pagos QR, tarjeta, credito, mixtos o descuentos.
- Cantidades decimales o fraccionamiento.
- Cambios de precio manuales.

## Acceptance Criteria

- POS bloquea la confirmacion de venta si no hay caja abierta.
- La busqueda muestra productos vendibles con informacion suficiente para decidir la venta.
- El carrito consolida el mismo producto en una sola linea o maneja duplicados de forma coherente.
- Las cantidades invalidas, cero o negativas no pueden cobrarse.
- El monto recibido menor al total impide confirmar y muestra el problema.
- Al confirmar cobro se envia una venta con pago efectivo y cantidades enteras.
- Una venta confirmada limpia el carrito activo y deja disponible el comprobante para el siguiente ticket.
