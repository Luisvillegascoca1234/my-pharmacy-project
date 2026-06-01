# Ticket 04 - Update Pharmaceutical Workflow Documentation

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03
- Blocks: 05

## Description

Actualizar la documentacion operativa del flujo de mostrador para que explique ventas POS, caja, pagos, FEFO, pendientes, anulacion y supervision con lenguaje propio del rubro farmaceutico. La documentacion debe describir que debe lograr el usuario y que reglas gobiernan el flujo, sin explicar la estructura interna del codigo.

## Scope

- Apertura y cierre de caja por usuario.
- Cierre de caja ajena por admin/superadmin.
- Venta anonima con pago efectivo, monto recibido y cambio.
- Descuento automatico por FEFO y advertencias por proximidad de vencimiento.
- Carritos pendientes con expiracion a 3 dias, sin reserva de stock y sin precio congelado.
- Anulacion de ventas permitidas con motivo mientras la caja asociada sigue abierta.
- Diferencias entre comprobante interno y factura fiscal.
- Limites V1: sin SIAT real, QR, tarjeta, credito, descuentos, NIT ni cantidades decimales.

## Out Of Scope

- Explicar carpetas, archivos, modulos internos o estructura tecnica del codigo.
- Manual de instalacion o despliegue.
- Documentacion de API para desarrolladores.
- Reportes analiticos completos.
- Facturacion fiscal real.
- Nuevas reglas no aceptadas en el PRD.

## Acceptance Criteria

- La documentacion esta escrita en espanol claro con terminologia farmaceutica consistente.
- El vendedor puede entender cuando abrir caja, como cobrar, cuando guardar pendiente y cuando una venta no puede confirmarse.
- Admin y superadmin pueden entender supervision, cierre ajeno, descarte de pendientes y anulacion permitida.
- FEFO se explica como regla automatica de salida por vencimiento, sin pedir seleccion manual de lote.
- Los limites de V1 quedan explicitados como alcance, no como fallas.
- No se menciona estructura interna del codigo ni detalles de implementacion de bajo nivel.

## Execution Notes

- Se agrego `docs/prd/ventas-pos-caja-y-pagos/flujo-operativo-farmaceutico.md` como guia operativa de mostrador para vendedor, admin y superadmin.
- Se actualizo `docs/chunks/09-ventas-pos-caja-y-pagos.md` para reemplazar referencias tecnicas por reglas operativas de caja, POS, pago efectivo, FEFO, pendientes, anulacion, supervision y limites V1.
- Se enlazo la guia operativa desde `docs/prd/ventas-pos-caja-y-pagos/issue.md`.
- Estado posterior al correctivo backend: la documentacion debe tratar pendientes, anulacion y listados completos de supervision como reglas V1 con contrato operativo reconciliado. La deuda restante es validar el cierre final del epic y documentar cualquier diferencia residual.
- No se ejecuto QA manual ni pruebas de navegador.
