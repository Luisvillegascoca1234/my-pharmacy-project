# Ticket 04 - Cover Cancellation And Pending Cart Domain Rules

- Status: TODO
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03
- Blocks: 07

## Description

Agregar pruebas automatizadas para anulacion de ventas y ciclo de vida de carritos pendientes. Las pruebas deben cubrir reglas de permisos, caja abierta, reversa de inventario/pago/caja, expiracion y conversion transaccional.

## Scope

- Pruebas de anulacion valida.
- Pruebas de bloqueo por caja cerrada o venta ya anulada.
- Pruebas de permisos de vendedor y admin/superadmin.
- Pruebas de reposicion de inventario y movimientos inversos.
- Pruebas de pago revertido y ajuste de caja.
- Pruebas de guardado, edicion, descarte, expiracion y conversion de pendientes.
- Fakes o utilidades de prueba necesarias para aislar reglas.

## Out Of Scope

- Pruebas de UI o navegador.
- Pruebas de QR, tarjeta, credito o SIAT.
- Pruebas de reportes.
- Pruebas de devoluciones posteriores al cierre.

## Acceptance Criteria

- Hay prueba para anulacion valida de venta propia del dia con caja abierta.
- Hay prueba para bloqueo de anulacion de caja cerrada.
- Hay prueba para bloqueo de anulacion por vendedor sobre venta ajena.
- Hay prueba para anulacion por admin/superadmin de venta ajena permitida.
- Hay prueba para reposicion a los mismos lotes y movimientos `sale_cancelled`.
- Hay prueba para pago revertido y esperado de caja ajustado.
- Hay prueba para guardar y editar pendiente sin tocar inventario ni caja.
- Hay prueba para pendiente expirado no convertible.
- Hay prueba para conversion exitosa a venta y marcado como convertido.
- Hay prueba para fallo de conversion que conserva el pendiente activo.
