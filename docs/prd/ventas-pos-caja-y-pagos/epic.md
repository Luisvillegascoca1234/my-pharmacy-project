# Epic - Ventas POS, Caja y Pagos

- PRD: ./PRD.md
- Status: DONE
- Slug: ventas-pos-caja-y-pagos

## Goal

Implementar el flujo operativo de mostrador para que la farmacia pueda abrir caja, vender productos disponibles con pago efectivo, descontar inventario por FEFO, guardar carritos pendientes, anular ventas permitidas y cerrar caja con diferencia calculada.

## Expected Result

Al finalizar el epic, un usuario `seller` podra:

- Abrir su caja con monto inicial cero o mayor.
- Ver su caja actual desde POS.
- Buscar productos activos y vendibles por texto o codigo.
- Armar, editar, vaciar y cobrar un carrito.
- Guardar y retomar carritos pendientes propios.
- Cobrar en efectivo registrando monto recibido y cambio.
- Crear ventas anonimas con comprobante interno.
- Descontar inventario automaticamente por FEFO.
- Anular ventas propias del dia mientras su caja siga abierta.
- Cerrar su caja ingresando monto contado final.

Un usuario `admin` o `superadmin` podra:

- Supervisar ventas y cajas.
- Cerrar caja ajena con monto contado final.
- Ver carritos pendientes de todos y descartarlos.
- Anular ventas permitidas de cualquier vendedor mientras la caja asociada siga abierta.

## Closure Evidence

El cierre documental posterior al correctivo confirma que los sprints 01 a 08 dejaron cubierto el alcance V1 de caja, venta POS en efectivo, descuento FEFO, comprobante interno, carritos pendientes, anulacion controlada y supervision administrativa. Sprint 08 resolvio la brecha que quedaba sobre API ejecutable para pendientes POS, anulacion de ventas y supervision: el flujo permite guardar, editar, listar, descartar, expirar y convertir pendientes; anular ventas permitidas con motivo, pago revertido, reposicion por lote, movimientos inversos y caja neta; y revisar ventas, cajas y pendientes con permisos administrativos.

Con la limpieza final de referencias del Sprint 09 completada, el epic queda en `DONE`. El cierre no agrega reglas comerciales nuevas ni amplia los limites V1 aceptados: pago efectivo, comprobante interno, FEFO, caja abierta para anulacion, carritos pendientes sin reserva ni precio congelado, supervision administrativa y exclusiones de SIAT, medios de pago ampliados, devoluciones posteriores al cierre y reapertura de caja.

## Product Scope

- Apertura de caja por usuario.
- Caja actual con monto inicial, ventas efectivas, anulaciones, esperado y estado.
- Cierre de caja con monto contado, diferencia y nota opcional.
- Cierre de caja ajena por admin/superadmin.
- POS de mostrador con busqueda/listado, carrito y panel de cobro.
- Busqueda por nombre, codigo interno o codigo de barras.
- Visualizacion de stock vendible y proximo vencimiento.
- Advertencia por proximidad de vencimiento sin bloqueo.
- Venta anonima o consumidor final.
- Pago unico en efectivo con monto recibido y cambio.
- Comprobante interno con correlativo global.
- Descuento automatico FEFO, incluyendo consumo de varios lotes.
- Movimientos de inventario por salida de venta.
- Margen por item basado en costo real de los lotes consumidos.
- Carritos pendientes con nombre/nota, expiracion a 3 dias y revalidacion al cobrar.
- Anulacion controlada de ventas mientras la caja siga abierta.
- Reposicion de inventario a los mismos lotes al anular.
- Vista de detalle de venta y supervision por rol.

## Technical Scope

- Contratos compartidos para caja, venta, pago, anulacion, busqueda POS y carritos pendientes.
- Estados operativos para caja, venta, pago y carrito pendiente.
- Persistencia para sesiones de caja, pagos, ventas, items, consumos por lote y pendientes.
- Correlativos globales legibles para cajas y ventas.
- Operaciones transaccionales para crear venta, consumir inventario, registrar pago, anular venta y cerrar caja.
- FEFO sobre inventario disponible, excluyendo lotes no vendibles.
- Movimientos de inventario de salida y reversa con referencias auditables.
- Calculo de totales, cambio, esperado de caja, diferencia y margen.
- Autorizacion por rol para venta, cierre ajeno, anulacion y supervision.
- Busqueda POS paginada o limitada para productos vendibles.
- API documentada de forma minima para los flujos nuevos.
- Experiencia frontend de POS, caja, pendientes, detalle de venta y supervision administrativa.
- Estado cliente para carrito activo, caja actual, pendientes, resultados de busqueda, cobro y errores.

## Sprint Plan

1. Contratos, estados y persistencia: definir contratos compartidos, estados operativos, modelos de caja, venta, pago, consumos y pendientes, junto con documentacion minima de API.
2. Backend de caja: apertura, caja actual, cierre propio, cierre ajeno, totales esperados, diferencias, permisos y auditoria.
3. Backend de ventas y FEFO: busqueda POS, validacion de stock, creacion transaccional de venta, pago efectivo, consumos por lote, movimientos y margen.
4. Backend de anulaciones y carritos pendientes: guardar, editar, expirar, retomar, convertir pendientes; anular ventas con reversa de inventario, pago y caja.
5. UI de caja y POS base: estado de caja, apertura, busqueda, carrito, cobro efectivo, comprobante y errores principales.
6. UI de pendientes, anulacion y supervision: lista de pendientes, detalle de venta, anulacion con motivo, cierre de caja y vistas administrativas.
7. Integracion final: permisos visibles, navegacion, OpenAPI, pruebas de dominio y cierre documental.

## Ticket Category Hints

- `INFRA`: contratos compartidos, migraciones, estados operativos, correlativos, OpenAPI, semillas si hicieran falta.
- `BACKEND`: caja, ventas, pagos, FEFO, movimientos de inventario, anulaciones, carritos pendientes, permisos y pruebas de dominio.
- `UI`: POS, apertura/cierre de caja, cobro efectivo, carritos pendientes, detalle de venta, anulacion y supervision administrativa.

## Dependencies

- Catalogo de productos con precio de venta, estado, codigo interno y codigo de barras opcional.
- Inventario por capas/lotes con cantidad disponible, vencimiento, estado y costo base.
- Movimientos de inventario como registro analitico.
- Roles base `seller`, `admin` y `superadmin`.
- Usuario autenticado disponible para asociar caja, ventas, anulaciones y auditoria.
- Flujo de compras recibidas e inventario estable antes de ventas POS.

## Out of Scope

- QR real, tarjeta, pagos mixtos y credito.
- Facturacion SIAT real.
- Cliente formal con NIT o razon social.
- Descuentos, promociones, impuestos visibles o cambio manual de precio.
- Devoluciones despues del cierre de caja.
- Reapertura o modificacion de caja cerrada.
- Reasignacion de carritos pendientes.
- Reserva de stock por pendientes.
- Fraccionamiento o cantidades decimales.
- Reportes analiticos completos.

## Notes for create-epic-sprint

- Priorizar caja y venta transaccional antes de UI avanzada.
- Mantener FEFO como regla obligatoria de salida de inventario.
- No crear tickets de SIAT, QR real, tarjeta ni credito en este epic.
- Incluir anulacion en el alcance inicial porque fue decision explicita del usuario.
- Incluir carritos pendientes en el alcance inicial con expiracion de 3 dias.
- Tratar carritos pendientes como preparacion operativa, sin reserva de stock ni precio.
- Las pruebas de FEFO, caja, pago y anulacion son parte critica del backend.
- La UI debe mantener el flujo rapido de mostrador: buscar, agregar, cobrar.
- No planificar QA manual salvo solicitud explicita del usuario.

## Documentation and Thesis Impact

Este epic si requiere un sprint final de documentacion y tesis. La razon es que introduce el flujo comercial principal de salida de inventario: venta POS, caja, pagos, FEFO, anulacion, movimientos, margen y comprobante interno.

La evidencia afectara secciones sobre caso de estudio, reglas de negocio de farmacia, control de inventario por lote, metodo FEFO, caja simple, trazabilidad, auditoria operativa y pruebas funcionales. Tambien puede requerir documentacion de uso para vendedor y administrador, especialmente apertura/cierre de caja, cobro efectivo, anulacion y manejo de carritos pendientes.
