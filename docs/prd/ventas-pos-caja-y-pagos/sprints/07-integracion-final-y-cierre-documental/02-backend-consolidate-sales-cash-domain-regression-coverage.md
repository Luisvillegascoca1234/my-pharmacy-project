# Ticket 02 - Consolidate Sales Cash Domain Regression Coverage

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 03

## Description

Consolidar la cobertura automatizada de reglas criticas del dominio de ventas, caja, pagos, FEFO, pendientes y anulaciones. Este ticket debe cerrar huecos de regresion detectados despues de integrar backend y frontend, priorizando comportamiento observable y consistencia transaccional.

## Scope

- Apertura de caja con monto cero o mayor y rechazo de monto negativo.
- Unica caja abierta por usuario.
- Cierre propio y cierre ajeno con esperado, contado y diferencia.
- Venta con caja abierta, pago efectivo, cambio y rechazo de pago insuficiente.
- Asignacion FEFO, consumo de varios lotes y rechazo por stock insuficiente.
- Movimientos de salida y reversa con referencia auditable.
- Anulacion con motivo, permisos por rol, bloqueo por caja cerrada y reposicion a los mismos lotes.
- Carritos pendientes: expiracion a 3 dias, revalidacion de precio/stock, conversion a venta y conservacion ante fallo de cobro.

## Out Of Scope

- Pruebas manuales.
- Pruebas de carga o rendimiento.
- Facturacion SIAT.
- QR, tarjeta, credito o pagos mixtos.
- Descuentos, promociones, cliente formal o NIT.
- Reapertura de caja cerrada.
- Refactors amplios que no respondan a una brecha de regresion.

## Acceptance Criteria

- Las pruebas automatizadas cubren las reglas criticas que podrian romper caja, inventario o auditoria.
- Los casos de permisos diferencian vendedor, admin y superadmin.
- Las pruebas de FEFO verifican consumo de lote correcto y rechazo total cuando no alcanza el stock vendible.
- Las pruebas de anulacion verifican motivo obligatorio, caja abierta, reversa de pago y movimientos inversos.
- Las pruebas de pendientes verifican expiracion, revalidacion y no reserva de stock.
- Cualquier regla que no pueda cubrirse queda documentada con razon y riesgo residual.

## Execution Notes

- Se consolido cobertura automatizada para apertura de caja con monto cero y monto positivo, rechazo de monto negativo, caja unica abierta por usuario, cierre propio y cierre administrativo con diferencia esperada.
- Se consolido cobertura automatizada para venta con caja abierta, pago efectivo, cambio, rechazo por pago insuficiente, rechazo sin caja abierta, consumo FEFO de una o varias capas, rechazo total por stock insuficiente y movimientos de salida con referencia auditable.
- Estado posterior al correctivo backend: la brecha de disponibilidad de anulacion de ventas y carritos pendientes queda reemplazada por deuda de validacion final. Riesgo restante: ejecutar el guardrail de cierre para confirmar regresion automatizada completa de motivo obligatorio, permisos, caja cerrada, reversa de pago, movimientos inversos, expiracion, revalidacion y conversion.
