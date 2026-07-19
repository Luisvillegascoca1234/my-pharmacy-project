# Informe final de QA integral

| Campo | Resultado |
| --- | --- |
| Versión evaluada | `467746b` más correcciones del ciclo QA |
| Fecha y entorno | 2026-07-18, desarrollo local, zona `America/La_Paz` |
| Verificaciones automatizadas | 189 backend + 123 frontend; 312 aprobadas |
| Typecheck | Aprobado en shared, backend, frontend y documentación |
| Build de producción | Aprobado en shared, backend, frontend y documentación |
| Recorrido maestro | Aprobado |
| S1 / S2 / S3 / S4 abiertos | 0 / 0 / 0 / 1 observación técnica |
| Cobertura de páginas del manual | 31 de 31 páginas operativas abiertas y contrastadas |
| Reconciliación de inventario | Aprobada por lote, costo y FEFO |
| Reconciliación de caja | Aprobada; cierres de prueba con diferencia cero |
| Reconciliación de reportes y CSV | Aprobada |
| Limitaciones aceptadas de facturación | Sin SIAT real, CUF, CUFD, QR fiscal ni anulación tributaria |
| Riesgos residuales | Bundle principal de frontend mayor a 500 kB; Firefox no está instalado en el entorno |
| Recomendación | APROBADO CON OBSERVACIONES |

## Matriz de casos y resultados

| ID | Área | Evidencia principal | Resultado |
| --- | --- | --- | --- |
| QA-001 | Autenticación y sesión | Acceso efectivo con Superadministrador, Administrador y Vendedor; rutas protegidas por rol | Aprobado |
| QA-002 | Roles institucionales | Menú y acceso directo contrastados para los tres roles | Aprobado |
| QA-003 | Catálogos y abastecimiento | Compra en borrador sin stock y recepción de dos lotes `QA-FEFO-A-20260718163451` y `QA-FEFO-B-20260718163451` | Aprobado |
| QA-004 | Pendiente POS | Cambio de precio 5,00 → 5,50 bloqueó el cobro hasta aceptar el precio vigente | Aprobado |
| QA-005 | Caja | Caja `cmrqtsh950011udcsfszmfwqg`: inicial 100, esperado 127,50, contado 127,50, diferencia 0 | Aprobado |
| QA-006 | FEFO multicapa | Venta consumió 3 unidades del lote A a costo 1,25 y 2 del lote B a costo 1,75 | Aprobado |
| QA-007 | Anulación operativa | Venta `cmrqtu8n6001vudcsxf4jvc20` anulada; pago revertido y lotes originales repuestos | Aprobado |
| QA-008 | Bloqueo posterior al cierre | Anulación posterior al cierre respondió 409 | Aprobado |
| QA-009 | Devolución administrativa | Venta `cmrqtu8rn002judcsygmd9sek` devuelta totalmente; pago reembolsado y lotes originales repuestos | Aprobado |
| QA-010 | Factura preparada interna | `INV-000001` creada y cancelada sin efecto en inventario o caja; duplicado bloqueado | Aprobado |
| QA-011 | Reportes | Bruto 55, anulaciones 27,50, devoluciones 22, neto 5,50 | Aprobado |
| QA-012 | CSV | Ventas y movimientos en `text/csv; charset=utf-8`, separador `;`, filas reconciliadas | Aprobado |
| QA-013 | Auditoría | Eventos de compra, recepción, pendiente, venta, anulación, devolución, factura, caja y CSV presentes | Aprobado |
| QA-014 | Idempotencia secuencial | Misma clave devolvió venta `cmrqu39zs0007ud1gdgwvwadg` y el mismo pago en ambos intentos | Aprobado |
| QA-015 | Idempotencia concurrente | Dos solicitudes simultáneas devolvieron una sola venta `cmrqubi05001tud1g76tfdtn1` | Aprobado |
| QA-016 | Última unidad concurrente | Una venta aprobada y una rechazada con `SALE_STOCK_INSUFFICIENT`; lote sin stock negativo | Aprobado |
| QA-017 | Responsive | POS y manual a 390 × 844 sin desbordamiento horizontal ni controles críticos fuera de pantalla | Aprobado |
| QA-018 | Búsqueda documental | `lote`, `FEFO`, `caja`, `anulación`, `devolución`, `comprobante interno` y `SIAT` devolvieron resultados relevantes | Aprobado |

## Matriz de permisos

| Superficie | Vendedor | Administrador | Superadministrador | Resultado |
| --- | --- | --- | --- | --- |
| POS, pendientes, caja propia, ventas propias, alertas y consulta básica de catálogo/lotes | Permitido | Permitido | Permitido | Aprobado |
| Supervisión POS, compras, proveedores, movimientos, ajustes, comprobantes internos, devoluciones, reportes y CSV | Denegado | Permitido | Permitido | Aprobado |
| Usuarios, roles y facultades, configuración global y Configuración SIAT | Denegado | Denegado | Permitido | Aprobado |
| Registro de auditoría completo | Denegado | Denegado | Permitido | Aprobado |

Los permisos fueron comprobados en menú, acceso directo a ruta y servicio. El Vendedor recibió 403 al exportar y el Administrador recibió 403 al consultar auditoría.

## Matriz aplicación ↔ manual

| ID | Área | Páginas contrastadas | Evidencia en aplicación | Resultado | Clasificación |
| --- | --- | --- | --- | --- | --- |
| DOC-001 | Acceso, navegación y dashboard | Inicio, Primeros pasos, Guía de navegación general, Consejos operativos | Login, sidebar por rol, dashboard y salud del servidor | Aprobado | Conforme |
| DOC-002 | Roles, usuarios y facultades | Roles y facultades, Guía de usuarios, Guía de módulos administrativos | Usuarios, roles fijos y restricciones de gobierno | Aprobado | Conforme tras corrección |
| DOC-003 | Unidades, categorías y productos | Unidades y conversiones, Guía de unidades y categorías, Catálogo farmacéutico, Guía de productos | Catálogos, unidad base y presentaciones | Aprobado | Conforme |
| DOC-004 | Proveedores y compras | Proveedores, Guía de proveedores, Compras recibidas, Guía de compras recibidas | Borrador, recepción y lotes de origen | Aprobado | Conforme |
| DOC-005 | Inventario | Inventario por lote, Guía de lotes y stock, Movimientos y kardex, Guía de movimientos y kardex, Guía de ajustes manuales | Stock por lote, FEFO, movimientos y ajustes | Aprobado | Conforme |
| DOC-006 | Alertas | Alertas operativas, Guía de alertas operativas | Alertas de stock y vencimiento | Aprobado | Conforme |
| DOC-007 | POS y caja | Ventas POS, Caja y pagos, Reglas transversales | Pendientes, cobro efectivo, FEFO, idempotencia y caja | Aprobado | Conforme tras corrección |
| DOC-008 | Reversas | Devoluciones y anulaciones | Anulación con caja abierta y devolución total posterior al cierre | Aprobado | Conforme |
| DOC-009 | Facturación preparada | Facturación preparada, Glosario farmacéutico | Comprobante interno y factura preparada sin SIAT real | Aprobado | Conforme tras corrección |
| DOC-010 | Análisis y trazabilidad | Reportes y exportaciones, Guía de módulos administrativos | Reportes, CSV auditado y auditoría completa | Aprobado | Conforme |

Las 31 páginas del índice abrieron sin error. Los enlaces del índice, navegación anterior/siguiente, anclas observadas y búsqueda global funcionaron. La terminología distingue comprobante interno POS, factura preparada interna y factura fiscal real.

## Defectos corregidos

| ID | Severidad | Módulo | Esperado | Obtenido inicial | Corrección | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| QA-DEF-001 | S2 | Venta POS | Reintentar el mismo cobro no duplica venta, pago, stock ni caja | Dos solicitudes iguales creaban `V-000004` y `V-000005` | Clave idempotente persistida por vendedor, reuso transaccional y cliente con clave estable por intento | CERRADO |
| QA-DEF-002 | S3 | Manual | Nombres de navegación iguales a la aplicación y sin sugerir SIAT real | Dos guías decían “facturas SIAT” y una conservaba “Roles y permisos” | Actualización a “Comprobantes internos”, “Devoluciones administrativas” y “Roles y facultades” | CERRADO |

## Observaciones y límites

- Vite informa que el bundle principal minificado mide aproximadamente 1,10 MB (283 kB gzip). No produjo demora indefinida ni bloqueo durante el ciclo, pero conviene incorporar división por rutas en una mejora de rendimiento posterior.
- Firefox no está instalado en el entorno. La compatibilidad se comprobó en el navegador integrado y mediante builds de producción; queda pendiente una segunda pasada con motor Gecko cuando esté disponible.
- La facturación V1 es exclusivamente interna. No existe emisión SIAT real, CUF, CUFD funcional, QR fiscal ni anulación tributaria.

## Conclusión

El recorrido farmacéutico principal, las reglas negativas, la trazabilidad por lote, la conciliación monetaria, los permisos y la documentación pasan. No quedan defectos S1, S2 o S3 abiertos. La liberación se recomienda como **APROBADO CON OBSERVACIONES** por el tamaño del bundle y la ausencia de Firefox en el entorno de QA.
