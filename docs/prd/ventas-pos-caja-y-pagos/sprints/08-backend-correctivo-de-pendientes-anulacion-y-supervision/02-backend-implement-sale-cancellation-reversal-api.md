# Ticket 02 - Implement Sale Cancellation Reversal API

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Implementar la anulacion ejecutable de ventas confirmadas mientras la caja asociada siga abierta. La operacion debe ser transaccional: exigir motivo, validar permisos, marcar venta y pago como anulados/revertidos, reponer los mismos lotes consumidos, generar movimientos inversos y ajustar el esperado de caja.

## Scope

- Endpoint de anulacion de venta con motivo obligatorio.
- Estado cancelado para venta y pago revertido/cancelado sin borrar evidencia.
- Validacion de venta existente, estado confirmado y caja asociada abierta.
- Permisos: vendedor solo ventas propias del dia; admin/superadmin ventas de cualquier vendedor con caja abierta.
- Reposicion a los mismos lotes o capas consumidas por la venta original.
- Movimiento inverso por cada consumo de lote.
- Recalculo o ajuste del esperado de caja con ventas netas efectivas.
- Auditoria con usuario, fecha y motivo de anulacion.

## Out Of Scope

- Anular ventas de cajas cerradas.
- Devoluciones posteriores al cierre.
- Reapertura de caja.
- Facturacion SIAT, nota fiscal o nota de credito.
- Reimpresion o documento fiscal.
- Modificar items de venta confirmada.
- UI para anulacion.

## Acceptance Criteria

- Una venta confirmada puede anularse si su caja asociada sigue abierta y el actor tiene permiso.
- Toda anulacion exige motivo valido.
- Una venta ya anulada no puede anularse de nuevo.
- Una venta de caja cerrada se rechaza.
- Cada lote consumido por la venta se repone al mismo lote/capa.
- Cada reposicion genera movimiento inverso auditable.
- El pago queda marcado como revertido/cancelado y conserva el pago original.
- El esperado de caja excluye la venta anulada.
- La respuesta expone estado cancelado y datos de anulacion necesarios para UI y auditoria.
