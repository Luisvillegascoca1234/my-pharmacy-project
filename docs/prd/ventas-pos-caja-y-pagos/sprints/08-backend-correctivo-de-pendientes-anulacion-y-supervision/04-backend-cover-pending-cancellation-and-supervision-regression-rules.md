# Ticket 04 - Cover Pending Cancellation And Supervision Regression Rules

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03
- Blocks: 06

## Description

Cubrir con pruebas automatizadas las reglas que bloquearon el cierre del epic: pendientes, anulacion de ventas, reversa de inventario/pago/caja y supervision por rol. La cobertura debe enfocarse en comportamiento observable y consistencia transaccional.

## Scope

- Pruebas de carritos pendientes: guardado, edicion, descarte, expiracion, revalidacion y conversion.
- Pruebas de no reserva de stock y no congelamiento de precio.
- Pruebas de anulacion: motivo obligatorio, permisos, caja abierta, venta ya anulada y caja cerrada.
- Pruebas de reposicion al mismo lote/capa y movimientos inversos.
- Pruebas de pago revertido/cancelado y esperado de caja neto.
- Pruebas de listados administrativos y filtros por rol.
- Pruebas de autorizacion para seller, admin y superadmin.

## Out Of Scope

- QA manual.
- Pruebas de navegador.
- Pruebas de carga o rendimiento.
- Reportes, SIAT, QR, tarjeta, credito o descuentos.
- Tests de UI.
- Reescritura amplia de suites no relacionadas.

## Acceptance Criteria

- La suite backend falla si un pendiente reserva stock o congela precio.
- La suite backend falla si se convierte un pendiente expirado.
- La suite backend falla si una venta anulada no repone los mismos lotes consumidos.
- La suite backend falla si el pago original se borra en lugar de quedar revertido/cancelado.
- La suite backend falla si el esperado de caja no refleja ventas netas efectivas.
- La suite backend falla si un vendedor ve o cobra operaciones ajenas no permitidas.
- Admin y superadmin quedan cubiertos para supervision y anulacion permitida.
