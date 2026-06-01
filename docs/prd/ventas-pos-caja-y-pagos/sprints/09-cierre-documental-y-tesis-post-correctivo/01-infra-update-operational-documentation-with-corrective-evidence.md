# Ticket 01 - Update Operational Documentation With Corrective Evidence

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Actualizar la documentacion operativa de farmacia con la evidencia del Sprint 08, donde carritos pendientes, anulacion de ventas y supervision administrativa pasaron de brecha tecnica a flujo ejecutable. La documentacion debe explicar el comportamiento aprobado a nivel de negocio y operacion, sin describir la estructura interna del codigo.

## Scope

- guias de ventas POS, caja y pagos, anulaciones, navegacion operativa y reglas transversales
- `docs/chunks/09-ventas-pos-caja-y-pagos.md` como fuente narrativa del flujo POS/caja/pagos
- notas de alcance V1 que distinguen venta operativa interna, comprobante interno y facturacion fiscal futura
- reglas de carritos pendientes: 3 dias de expiracion, sin reserva de stock, sin congelar precio y cobro con revalidacion
- reglas de anulacion: motivo obligatorio, caja abierta, reversa de pago, reposicion por lote y ajuste neto de caja
- reglas de supervision: admin/superadmin pueden revisar operaciones, descartar pendientes permitidos y cerrar caja ajena

## Out Of Scope

- cambios de codigo funcional o UI
- documentacion de SIAT, QR real, tarjeta, credito o pagos mixtos como capacidades disponibles
- reportes analiticos completos
- detalles de estructura interna del codigo, rutas internas o organizacion de carpetas
- QA manual o navegacion exploratoria

## Acceptance Criteria

- Las guias operativas ya no presentan pendientes POS, anulacion o supervision como capacidades ausentes si el Sprint 08 las marco resueltas.
- La documentacion mantiene terminologia farmaceutica clara: lote, vencimiento, FEFO, caja, comprobante interno, anulacion y trazabilidad.
- Los limites de V1 quedan explicitos: pago efectivo, sin factura fiscal, sin pagos mixtos, sin devoluciones posteriores a cierre y sin reapertura de caja.
- Las reglas de caja abierta, cierre ajeno administrativo, anulacion y pendientes coinciden con `PRD.md` y `decisions.md`.
- No se agregan referencias a estructura interna del codigo ni instrucciones tecnicas de implementacion.
