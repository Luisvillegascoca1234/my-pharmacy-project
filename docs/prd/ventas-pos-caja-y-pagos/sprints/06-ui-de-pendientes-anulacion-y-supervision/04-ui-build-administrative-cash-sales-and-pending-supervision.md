# Ticket 04 - Build Administrative Cash Sales And Pending Supervision

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03
- Blocks: 06

## Description

Construir las vistas administrativas para supervisar caja, ventas y pendientes de todos los vendedores. Admin y superadmin deben poder detectar cajas abiertas, diferencias, ventas anulables y pendientes obsoletos, ademas de cerrar caja ajena con monto contado final.

## Scope

- Vista administrativa de cajas con estado, vendedor, apertura, esperado y diferencia cuando aplique.
- Cierre de caja ajena con monto contado final y nota opcional.
- Vista de ventas supervisables con filtros por fecha, vendedor, caja y estado cuando esten disponibles.
- Vista de pendientes de todos con estado de expiracion y accion para descartar.
- Acceso desde detalle administrativo hacia anulacion permitida.
- Estados de acceso denegado para vendedor.
- Resumen visible de intervencion administrativa: quien abrio y quien cierra/anula cuando la respuesta lo expone.

## Out Of Scope

- Dashboard analitico completo.
- Exportaciones CSV.
- Graficos de margen o rotacion.
- Reapertura de caja cerrada.
- Cierre con desglose de billetes y monedas.
- Configuracion de permisos.
- Auditoria historica global fuera del flujo de ventas/caja.

## Acceptance Criteria

- Admin y superadmin pueden ver cajas de vendedores y distinguir abiertas de cerradas.
- Admin y superadmin pueden cerrar caja ajena ingresando monto contado final.
- El cierre ajeno muestra diferencia calculada y usuario responsable del cierre si la respuesta lo expone.
- Admin y superadmin pueden ver pendientes de todos y descartar los que correspondan.
- La vista administrativa permite filtrar o acotar ventas por criterios operativos basicos.
- Un vendedor no ve acciones administrativas de cierre ajeno ni supervision global.
- Las acciones administrativas muestran confirmacion y estado de carga para evitar doble envio.
