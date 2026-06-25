# Decisiones - Facturacion, Devoluciones, Auditoria y Reportes

## Decisiones cerradas

1. Las devoluciones posteriores al cierre de caja se permiten como devolucion administrativa, separada de anulacion POS.
2. La devolucion registra `refundAmount`, pero no impacta directamente una sesion de caja V1.
3. La devolucion V1 es total, no parcial.
4. Una venta facturada exige cancelar la factura preparada antes de registrar devolucion.
5. La factura V1 usa solo estados `prepared` y `cancelled`.
6. La factura preparada tiene correlativo interno propio separado del correlativo de venta.
7. La factura permite datos fiscales opcionales: `customerNit` y `customerBusinessName`.
8. Los reportes obligatorios V1 son ventas diarias, valuacion de inventario y productos proximos a vencer.
9. Las exportaciones CSV respetan filtros basicos por query params.
10. La auditoria consultable queda limitada a `superadmin`.
11. El endpoint de auditoria puede mostrar metadata completa; la UI puede colapsarla.
12. La devolucion repone stock disponible a los mismos lotes originales.
13. Una factura preparada puede cancelarse aunque la venta siga vigente.
14. El reporte de ventas diarias muestra bruto, anulaciones, devoluciones y neto.
15. Una venta anulada no puede facturarse despues.
16. Una venta sin factura preparada puede devolverse directamente si cumple reglas.
17. Una venta con factura cancelada puede devolverse.
18. Reportes y exportaciones son para `admin` y `superadmin`, no para `seller`.
19. La valuacion usa costo base real de cada lote disponible.
20. El reporte de vencimientos acepta `days` con default 30.
21. `sales.csv` usa una fila por venta.
22. `inventory-movements.csv` usa una fila por movimiento.
23. CSV usa separador punto y coma.
24. La pantalla de facturas permite preparar factura desde ventas elegibles.
25. La devolucion total vive en pantalla propia administrativa.
26. Reportes y exportaciones se mantienen como pantallas separadas.
27. Se agrega navegacion de devoluciones para `admin` y `superadmin`.
28. La venta devuelta agrega estado `returned`.
29. El pago de venta devuelta agrega estado `refunded`.
30. La devolucion agrega movimiento `sale_returned`.
31. La entidad de devolucion se nombra `SaleReturn`.
32. Una venta puede tener maximo una devolucion V1.
33. Factura sin datos fiscales guarda `customerNit` como `0` y `customerBusinessName` como `Consumidor final`.
34. Cancelacion de factura exige motivo entre 5 y 500 caracteres.
35. Devolucion total exige motivo entre 5 y 500 caracteres.
36. Reportes por rango usan zona horaria `America/La_Paz`.
37. Defaults: ventas diarias dia actual, valuacion estado actual, vencimientos 30 dias.
38. Facturas, devoluciones y auditoria son paginadas desde V1.
39. Listados administrativos ordenan mas recientes primero.
40. OpenAPI queda actualizado para el cierre administrativo V1.
41. Documentacion operativa queda actualizada sin describir estructura interna.
42. El comprobante interno sigue visible para ventas `returned`.
43. Una factura cancelada permite generar otra factura preparada para la misma venta vigente.
44. Si la caja sigue abierta y la venta es anulable, se bloquea devolucion y se usa anulacion POS.
45. La devolucion guarda snapshot de items/lotes devueltos.
46. La valuacion muestra agregado por producto y detalle por lote.
47. Exportar CSV genera auditoria; consultar reportes visuales no.
48. El alcance se divide mediante `$to-prd` antes de sprints y tickets.
49. Se asume que no hay usuarios activos; la migracion puede ser destructiva.
50. Se incluyen pruebas automatizadas de dominio; no se planifica QA manual salvo solicitud explicita.

## Supuestos no bloqueantes

- La factura preparada no representa emision fiscal real ni respuesta SIAT.
- El texto de UI debe diferenciar factura preparada, comprobante interno, anulacion POS y devolucion administrativa.
- La documentacion de usuario debe usar jerga farmaceutica y operativa, no detalles de implementacion.

## Reconciliacion de Cierre V1

- Las decisiones 1 a 50 fueron contrastadas contra la evidencia de sprints 01 a 06 y permanecen vigentes para el cierre administrativo V1.
- Las capacidades de facturacion preparada, devolucion administrativa total, auditoria consultable, reportes operativos y CSV se registran como entregadas en V1, no como deuda futura.
- Sprint 07 quedo completado como cierre documental e infraestructura: documentacion operativa, contratos publicados, evidencia academica, registros de planificacion, limpieza y guardrails finales.
- El ticket final de validacion completo los guardrails de cierre; el epic queda registrado como `DONE`.
- Las limitaciones V1 se mantienen como alcance excluido deliberado: sin SIAT real, sin QR fiscal, sin devoluciones parciales, sin reapertura de caja cerrada, sin BI avanzado y sin CSV por item vendido.
