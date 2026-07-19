# Plan integral de QA de la aplicación farmacéutica

## 1. Propósito

Validar de principio a fin que la aplicación permita operar una jornada farmacéutica V1 con datos íntegros, trazabilidad por lote, dispensación FEFO, control de caja, permisos por rol y evidencia de auditoría; además, contrastar cada comportamiento visible con la aplicación de documentación y su manual de usuario.

Este documento define la ejecución. No registra todavía resultados de pruebas.

## 2. Resultado esperado del ciclo

Al terminar el ciclo debe ser posible responder con evidencia:

- si una farmacia de una sola sucursal puede preparar catálogos, abastecer inventario, vender, cobrar, anular, cerrar caja, gestionar una devolución administrativa y consultar sus resultados;
- si toda entrada o salida conserva producto, unidad base, lote, cantidad, costo, usuario, fecha, motivo y documento de origen;
- si cada rol ve y ejecuta únicamente las operaciones autorizadas;
- si los totales de inventario, caja, reportes y exportaciones coinciden con las operaciones realizadas;
- si el manual describe fielmente la interfaz, las reglas y las limitaciones vigentes;
- si las funciones incompletas de facturación están correctamente delimitadas y no se presentan como facturación fiscal real.

## 3. Alcance

### 3.1 Incluido

- Inicio y cierre de sesión.
- Navegación, rutas directas y conservación de sesión.
- Dashboard y estados de servicio.
- Usuarios, roles fijos y facultades.
- Unidades, categorías, productos y conversiones.
- Proveedores.
- Compras en borrador, recepción y anulación cuando corresponda.
- Inventario por lote, vencimiento, movimientos, ajustes y alertas.
- Apertura y cierre de caja.
- Venta POS en efectivo y comprobante interno.
- Carritos pendientes.
- Supervisión operativa.
- Anulación de venta con caja abierta.
- Factura preparada interna y su cancelación administrativa.
- Devolución administrativa total posterior al cierre de caja.
- Reportes, exportaciones CSV y auditoría.
- Permisos de Superadministrador, Administrador y Vendedor.
- Validaciones funcionales, consistencia transaccional, accesibilidad básica, adaptación responsive, seguridad operativa, rendimiento percibido y manejo de errores.
- Navegación, búsqueda y exactitud de la aplicación de documentación.

### 3.2 Facturación: alcance parcial aceptado

La facturación fiscal real está incompleta por decisión de alcance y esto **no bloquea la aprobación de V1**.

Se valida como capacidad V1:

- preparación de una factura interna desde una venta elegible;
- correlativo y datos comerciales mínimos;
- estados y detalle del documento interno;
- cancelación administrativa con motivo por Admin o Superadministrador;
- conservación de evidencia y auditoría;
- separación visible entre venta, comprobante interno POS y factura preparada interna.

Se registra como limitación aceptada, no como defecto:

- ausencia de emisión fiscal real;
- ausencia de integración con SIAT/SIN;
- ausencia de CUF, CUFD funcional, QR fiscal y XML tributario;
- ausencia de envío, validación, rechazo o anulación tributaria real;
- configuración SIAT informativa o incompleta.

Sí constituye defecto:

- llamar “factura fiscal”, “documento validado por SIAT” o equivalente a un documento interno;
- mostrar CUF, QR o respuesta del SIN ficticios como reales;
- permitir que un Vendedor cancele una factura preparada;
- hacer que preparar o cancelar el documento interno cambie inventario, pago o caja sin una regla aprobada;
- contradecir en la aplicación o el manual los límites anteriores.

### 3.3 Fuera de alcance del ciclo

- Multi-sucursal.
- Crédito, cuentas por cobrar y pagos mixtos.
- Pago real con QR, tarjeta o transferencia.
- Pacientes e historia clínica.
- Devoluciones parciales.
- Reapertura de cajas cerradas.
- Facturación fiscal SIAT real.
- Pruebas de dispositivos físicos, impresoras fiscales o lectores de código de barras no conectados al entorno.

## 4. Fuentes de verdad y regla de contraste

Se usarán en conjunto:

1. reglas operativas y farmacéuticas aprobadas;
2. comportamiento observable de la aplicación;
3. contratos y respuestas de los servicios;
4. manual de usuario de la aplicación de documentación.

Ante una diferencia se clasificará así:

- **Defecto funcional:** la aplicación incumple una regla aprobada.
- **Defecto documental:** la aplicación funciona según la regla aprobada, pero el manual dice otra cosa, omite una precondición o usa una denominación incorrecta.
- **Brecha de alcance:** el manual o la interfaz promete una capacidad todavía no aprobada o implementada.
- **Limitación aceptada:** comportamiento expresamente excluido, como SIAT real.
- **Ambigüedad:** no existe una regla suficiente para decidir; debe resolverse antes de aprobar el caso.

La documentación solo se considera aprobada cuando describe comportamiento comprobado. No se corregirá una falla funcional cambiando el manual para ocultarla.

## 5. Entorno, accesos y preparación

### 5.1 Entornos

- Aplicación operativa: `http://localhost:5173`.
- Aplicación de documentación: `http://localhost:3001`.
- Servicios locales y base de datos del entorno de desarrollo.

Si un servicio utiliza otro puerto, se registrará el valor real en la evidencia de ejecución.

### 5.2 Usuarios semilla

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| Superadministrador | `admin@admin.com` | `admin` |
| Administrador | `admin@farmacia.local` | `admin` |
| Vendedor | `vendedor@farmacia.local` | `admin` |

Las credenciales son exclusivas del entorno local de prueba.

### 5.3 Navegadores y tamaños mínimos

- Chromium de escritorio: 1440 × 900 y 1280 × 720.
- Chromium móvil: 390 × 844.
- Firefox o equivalente como segunda comprobación de escritorio.

### 5.4 Preparación de datos

Usar el prefijo único `QA-AAAAMMDD-XX` en nombres, códigos, lotes y documentos. Preparar:

- una categoría de medicamento;
- unidades `Tableta`, `Blíster` y `Caja`;
- conversiones 1 blíster = 10 tabletas y 1 caja = 100 tabletas;
- un proveedor activo y uno inactivo;
- un medicamento activo con lote y vencimiento obligatorios;
- dos lotes vigentes del mismo medicamento, con vencimientos distintos;
- un lote vencido y uno bloqueado o no apto;
- stock próximo al mínimo y stock agotado;
- usuarios activos de los tres roles;
- fechas y montos que permitan calcular manualmente los resultados.

Antes del ciclo integral se debe partir de una base conocida. Se guardará una referencia del estado inicial y se evitará reutilizar datos de una ejecución anterior.

## 6. Criterios de entrada

El ciclo comienza cuando:

- la aplicación operativa y la documentación abren sin error de arranque;
- la base de datos responde;
- los tres usuarios semilla pueden autenticarse;
- se conoce la versión o revisión evaluada;
- no hay migraciones o datos semilla pendientes;
- la limitación de facturación fiscal real está aceptada;
- existe un lugar para registrar defectos y adjuntar evidencias.

## 7. Evidencia y registro

Cada caso debe guardar:

- identificador del caso;
- fecha, versión y navegador;
- rol utilizado;
- precondiciones y datos exactos;
- pasos ejecutados;
- resultado esperado y obtenido;
- captura de pantalla para estados visuales;
- respuesta relevante del servicio cuando exista error o inconsistencia;
- identificadores de venta, compra, lote, caja, devolución o documento generado;
- enlace a la página del manual contrastada;
- estado: `APROBADO`, `FALLIDO`, `BLOQUEADO`, `NO APLICA` o `LIMITACIÓN ACEPTADA`.

No incluir contraseñas, tokens ni datos sensibles en capturas o reportes.

## 8. Severidad y prioridad

| Severidad | Criterio | Ejemplos |
| --- | --- | --- |
| S1 Bloqueante | Impide operar o compromete dinero, stock, trazabilidad o acceso. | Venta duplicada, stock negativo, acceso Vendedor a administración, cierre corrupto. |
| S2 Alta | Regla principal incorrecta sin alternativa segura. | FEFO incorrecto, anulación sin reversa completa, reporte neto inconsistente. |
| S3 Media | Función secundaria incorrecta o documentación materialmente inexacta. | Filtro erróneo, manual omite precondición, mensaje confuso que permite recuperarse. |
| S4 Baja | Presentación o mejora sin impacto operativo relevante. | Alineación, texto menor, inconsistencia cosmética. |

Toda brecha que presente un documento interno como fiscal se clasifica al menos S2.

## 9. Orden de ejecución

### Fase 0 — Línea base técnica

1. Registrar versión, fecha, puertos y estado de servicios.
2. Ejecutar las verificaciones automatizadas existentes de tipos, compilación y pruebas.
3. Confirmar que no existan errores inesperados de consola, red o arranque.
4. Registrar fallas de línea base antes de iniciar datos transaccionales.

Comandos previstos:

```powershell
pnpm typecheck
pnpm build
pnpm --filter @pharmacy-pos/backend test
pnpm --filter @pharmacy-pos/frontend test
```

Resultado de salida: línea base estable o lista explícita de bloqueos conocidos.

### Fase 1 — Smoke de acceso y navegación

1. Abrir la aplicación sin sesión y confirmar redirección a inicio de sesión.
2. Probar credenciales válidas e inválidas.
3. Confirmar mensajes comprensibles, sin revelar si una cuenta existe.
4. Recargar una ruta interna y comprobar que la sesión y la ruta se restauran.
5. Cerrar sesión y confirmar que volver atrás no reabre contenido protegido.
6. Recorrer todas las opciones visibles por rol.
7. Abrir rutas no autorizadas directamente y confirmar denegación sin fuga de datos.
8. Abrir una ruta inexistente y confirmar redirección estable.

Resultado de salida: autenticación y navegación utilizables para continuar.

### Fase 2 — Matriz de roles y facultades

Ejecutar la matriz con navegación visible, ruta directa y operación real:

| Área | Superadministrador | Administrador | Vendedor |
| --- | --- | --- | --- |
| POS, pendientes, caja y ventas propias | Permitido | Permitido | Permitido |
| Supervisión de otros usuarios | Permitido | Permitido | Denegado |
| Gestión de productos, unidades y categorías | Permitido | Permitido | Solo consulta permitida |
| Movimientos con costo y ajustes | Permitido | Permitido | Denegado |
| Proveedores y compras | Permitido | Permitido | Denegado |
| Facturas preparadas y devoluciones | Permitido | Permitido | Denegado |
| Reportes y CSV | Permitido | Permitido | Denegado |
| Usuarios, auditoría y configuración global/SIAT | Permitido | Denegado | Denegado |
| Roles y facultades | Consulta del catálogo fijo | Sin acceso | Sin acceso |

Además:

- comprobar que un Vendedor solo consulte su caja, ventas y pendientes;
- comprobar que el servidor también rechace la operación prohibida aunque se intente sin usar la interfaz;
- comprobar que cambiar, bloquear o desactivar un usuario tenga efecto en una nueva autenticación;
- verificar que los roles institucionales no se creen, editen ni eliminen desde la interfaz.

### Fase 3 — Catálogos farmacéuticos

#### Unidades y categorías

- crear, listar y buscar unidades y categorías;
- rechazar nombres o abreviaturas inválidas y duplicadas;
- validar conversiones positivas y coherentes;
- comprobar que la unidad base siempre esté disponible;
- confirmar que cambiar una conversión no altere el histórico de compras recibidas o ventas.

#### Productos

- crear medicamento con nombre comercial, principio activo, categoría, proveedor, unidad base, precio y requisitos sanitarios;
- buscar por nombre, código y código de barras;
- editar precio y datos permitidos;
- activar e inactivar;
- impedir duplicados y valores monetarios o cantidades inválidas;
- exigir lote y vencimiento para productos inventariables;
- confirmar que el Vendedor no modifique costos ni datos administrativos;
- comprobar que un producto inactivo no pueda incorporarse a operaciones nuevas, sin perder su historial.

Resultado de salida: catálogos válidos para abastecimiento.

### Fase 4 — Proveedores y compras

#### Proveedores

- crear, consultar, editar, buscar, paginar y filtrar por estado;
- validar razón social, NIT, teléfono y duplicados según reglas vigentes;
- inactivar sin borrar historial;
- impedir usar un proveedor inactivo en una compra nueva.

#### Compra en borrador

- crear una compra con varios productos y presentaciones;
- comprobar conversión a unidad base y total monetario;
- guardar, recargar, editar y volver a guardar;
- verificar aviso de cambios pendientes;
- confirmar que el borrador no cree stock ni movimientos;
- probar campos incompletos, cantidades cero/negativas, lote vacío y vencimiento inválido.

#### Recepción y anulación

- recibir una compra válida una sola vez;
- confirmar modo de solo lectura después de recibir;
- confirmar creación de lotes y movimientos de entrada;
- comprobar costo por lote y cantidades normalizadas;
- impedir doble recepción;
- probar anulación permitida y confirmar conservación histórica;
- verificar que cualquier reversa sea atómica: o se completan todos los cambios o no se modifica nada.

Resultado de salida: inventario abastecido con trazabilidad de origen.

### Fase 5 — Inventario, kardex, ajustes y alertas

#### Lotes y stock

- localizar los lotes recibidos por producto, código y número de lote;
- validar cantidad disponible, vencimiento, costo, valor y estado;
- confirmar diferenciación entre vigente, próximo a vencer, vencido, agotado y bloqueado;
- comprobar que el total por producto sea igual a la suma de lotes aptos.

#### Movimientos y kardex

- comprobar una entrada por cada capa recibida;
- filtrar por producto, lote, tipo y fecha;
- validar signo, cantidad base, costo, usuario, fecha, motivo y documento de origen;
- reconciliar saldo inicial + entradas − salidas = saldo final.

#### Ajustes manuales

- ejecutar ajuste positivo y negativo con motivo válido;
- impedir ajuste sin motivo, sin lote o con saldo final inválido;
- impedir acceso del Vendedor;
- confirmar movimiento y auditoría;
- comprobar que no se alteren otros lotes.

#### Alertas

- provocar stock bajo, agotado, vencimiento próximo y lote vencido;
- comprobar prioridad, producto, lote, vencimiento y cantidad;
- confirmar que la alerta desaparezca o cambie al corregir la condición;
- no exigir alertas fiscales SIAT reales en V1.

Resultado de salida: stock explicable y alertas coherentes.

### Fase 6 — Caja, POS, pendientes y FEFO

#### Caja

- abrir caja con monto inicial válido;
- impedir una segunda caja abierta para el mismo responsable;
- impedir venta sin caja abierta;
- validar montos cero, negativos y formatos decimales;
- confirmar que Admin y Superadministrador puedan supervisar y cerrar caja ajena según regla;
- confirmar que una caja cerrada no se reabra.

#### Carrito POS

- buscar por nombre, código interno y código de barras;
- agregar, quitar y cambiar cantidades;
- impedir producto inactivo, lote vencido, bloqueado o sin stock vendible;
- confirmar que el precio vigente se revalide al cobrar;
- comprobar subtotales, total, monto recibido y cambio;
- impedir cobro insuficiente o cantidades superiores al stock apto.

#### FEFO

- vender una cantidad cubierta por el lote con vencimiento más cercano;
- vender una cantidad que requiera más de un lote;
- confirmar que no se use el lote vencido o bloqueado;
- comprobar el descuento exacto por capa y su costo real;
- repetir con una presentación comercial y validar conversión a unidad base.

#### Pendientes POS

- guardar y retomar un carrito propio;
- comprobar que no reserve stock ni congele precio;
- cambiar stock o precio desde otro flujo y confirmar revalidación al cobrar;
- impedir que un Vendedor vea o modifique pendientes ajenos;
- permitir supervisión administrativa;
- descartar un pendiente sin generar venta, pago, movimiento ni cambio de stock;
- validar expiración a tres días cuando el mecanismo sea ejecutable en el entorno.

#### Confirmación de venta

- cobrar únicamente en efectivo;
- confirmar venta, pago, comprobante interno y caja asociada;
- comprobar que no se duplique al hacer doble clic, recargar o repetir una solicitud;
- validar actualización de stock, movimientos, total esperado de caja y auditoría;
- confirmar que el comprobante diga claramente que no es factura fiscal.

Resultado de salida: una venta trazable y monetariamente consistente.

### Fase 7 — Anulación operativa con caja abierta

1. Seleccionar una venta propia del día con caja abierta.
2. Intentar anular sin motivo y confirmar rechazo.
3. Anular con motivo válido.
4. Confirmar que la venta se conserve como anulada.
5. Confirmar reversa del pago.
6. Confirmar reposición a los mismos lotes consumidos, no a lotes alternativos.
7. Confirmar movimientos compensatorios y auditoría.
8. Confirmar reducción del total esperado de caja.
9. Repetir las restricciones con venta ajena y cada rol.
10. Cerrar la caja e intentar anular; debe rechazarse y orientar a devolución administrativa.

Resultado de salida: reversa completa, atómica y auditable.

### Fase 8 — Cierre de caja

1. Registrar una combinación conocida de ventas vigentes y anuladas.
2. Calcular manualmente el efectivo esperado neto.
3. Cerrar con monto contado igual y validar diferencia cero.
4. En otra caja, cerrar con sobrante o faltante y validar signo y monto.
5. Confirmar responsable, usuario que cierra, fecha y estado.
6. Verificar que el cierre no cambie al ejecutar devoluciones administrativas posteriores.
7. Confirmar que no se admitan nuevas ventas en la caja cerrada.

Resultado de salida: arqueo reproducible e histórico inmutable.

### Fase 9 — Cierre administrativo

#### Factura preparada interna

- listar ventas elegibles;
- preparar documento con datos mínimos válidos;
- impedir duplicar el documento para la misma venta cuando la regla lo prohíba;
- consultar detalle, correlativo, estado, cliente, productos, vendedor, caja y total;
- cancelar con motivo como Admin y Superadministrador;
- impedir cancelación como Vendedor;
- confirmar que preparación y cancelación no alteren stock, pago ni cierre de caja;
- revisar que toda la interfaz mantenga la advertencia de ausencia de emisión SIAT real.

#### Devolución administrativa total

- seleccionar una venta confirmada cuya caja esté cerrada;
- validar elegibilidad y bloqueos;
- impedir devolución parcial;
- exigir motivo;
- registrar devolución total y estado de reembolso;
- reponer exactamente los lotes originales;
- generar movimientos compensatorios y auditoría;
- conservar inmutable el cierre histórico;
- reflejar el efecto en resultados netos posteriores;
- impedir duplicar la devolución;
- validar interacción con una factura preparada existente según la regla visible.

Resultado de salida: cierre administrativo consistente sin simular procesos fiscales.

### Fase 10 — Reportes, CSV y auditoría

#### Reportes

Reconciliar con los identificadores creados durante el ciclo:

- ventas brutas;
- anulaciones;
- devoluciones;
- ventas netas;
- inventario disponible valorizado por costo de lote;
- productos próximos a vencer;
- diferencias de caja.

Validar filtros, intervalos inclusivos, zona horaria, estados vacíos, paginación y permisos.

#### Exportaciones CSV

- exportar ventas y movimientos con y sin filtros;
- comprobar nombre, tipo de archivo y descarga;
- validar encabezados, fechas ISO, codificación UTF-8 y caracteres españoles;
- confirmar IDs estables y valores numéricos sin texto mezclado;
- reconciliar cantidad de filas y totales con la pantalla y los datos del ciclo;
- comprobar auditoría de la descarga;
- confirmar que un Vendedor no pueda exportar.

#### Auditoría

- buscar por usuario, acción, entidad y fecha;
- confirmar creación, edición y cambios de estado sensibles;
- confirmar compra recibida, ajustes, venta, anulación, devolución, factura preparada/cancelada y descarga CSV;
- validar datos anteriores/nuevos y metadatos sin exponer secretos;
- confirmar acceso exclusivo de Superadministrador;
- comprobar que los registros no se puedan editar ni borrar desde la aplicación.

Resultado de salida: cifras reconciliadas y trazabilidad administrativa completa.

### Fase 11 — Contraste sistemático con el manual de usuario

La contrastación se realiza en paralelo visual: aplicación operativa a un lado y aplicación de documentación al otro.

Para cada página del manual:

1. abrir la ruta o módulo descrito;
2. usar el rol indicado o inferido por el texto;
3. preparar las precondiciones descritas;
4. ejecutar literalmente los pasos del manual;
5. comparar nombres de menú, títulos, botones, campos, filtros, estados y mensajes;
6. comparar resultado funcional y efectos en inventario, caja y auditoría;
7. confirmar que las restricciones y errores recuperables estén explicados;
8. revisar enlaces internos, navegación siguiente/anterior y búsqueda;
9. registrar una fila en la matriz de trazabilidad documental;
10. clasificar cualquier diferencia como defecto funcional, documental, brecha, limitación aceptada o ambigüedad.

#### Matriz mínima aplicación ↔ manual

| Área de la aplicación | Páginas mínimas del manual |
| --- | --- |
| Acceso, navegación y dashboard | Primeros pasos; Guía de navegación general; Consejos operativos |
| Roles, usuarios y facultades | Roles y facultades; Guía de usuarios; Guía de módulos administrativos |
| Unidades, categorías y conversiones | Unidades y conversiones; Guía de unidades y categorías |
| Productos | Catálogo farmacéutico; Guía de productos |
| Proveedores | Proveedores; Guía de proveedores |
| Compras | Compras recibidas; Guía de compras recibidas |
| Lotes y stock | Inventario por lote; Guía de lotes y stock |
| Movimientos y ajustes | Movimientos y kardex; Guía de movimientos y kardex; Guía de ajustes manuales |
| Alertas | Alertas operativas; Guía de alertas operativas |
| POS y pendientes | Ventas POS; Caja y pagos; Reglas transversales |
| Anulaciones y devoluciones | Devoluciones y anulaciones; Reglas transversales |
| Factura preparada | Facturación preparada; Glosario farmacéutico |
| Reportes, CSV y auditoría | Reportes y exportaciones; Guía de módulos administrativos |

#### Verificaciones propias de la aplicación de documentación

- portada, índice y menú lateral completos;
- todas las páginas abren sin error;
- enlaces internos y anclas válidos;
- búsqueda de `lote`, `FEFO`, `caja`, `anulación`, `devolución`, `comprobante interno` y `SIAT`;
- resultados relevantes y sin páginas huérfanas;
- lectura correcta en escritorio y móvil;
- ausencia de texto cortado, tablas inaccesibles o bloques superpuestos;
- terminología farmacéutica consistente;
- ausencia de afirmaciones de SIAT real disponible;
- distinción consistente entre comprobante interno POS, factura preparada interna y factura fiscal real;
- ausencia de instrucciones que requieran una función no visible o no autorizada para el rol.

Formato de trazabilidad:

| ID | Página del manual | Paso/afirmación | Rol | Evidencia en app | Resultado | Clasificación | Defecto |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DOC-001 |  |  |  |  |  |  |  |

Resultado de salida: cobertura documental del 100 % de las páginas operativas y cero contradicciones materiales abiertas.

### Fase 12 — Pruebas transversales

#### Validación y errores

- campos requeridos, mínimos, máximos, caracteres especiales y espacios;
- cantidades y dinero con cero, negativos, demasiados decimales y valores extremos;
- fechas pasadas, actuales, futuras y límites de vencimiento;
- duplicados y operaciones repetidas;
- errores 400, 401, 403, 404, 409, 422 y 500 con mensajes recuperables;
- pérdida temporal del servicio durante lectura y durante una mutación;
- reintento sin duplicar venta, pago, recepción, ajuste, devolución o factura preparada.

#### Integridad y concurrencia

- dos usuarios intentando vender el último stock;
- dos intentos de recibir la misma compra;
- dos intentos de cerrar o anular la misma caja/venta;
- cambio de precio o stock mientras existe un pendiente;
- confirmación de atomicidad ante una falla intermedia;
- prohibición de stock negativo;
- consistencia entre pantalla, movimientos, reportes y CSV.

#### Seguridad operativa

- control de acceso en menú, ruta y servicio;
- sesión inválida o expirada;
- ausencia de token y datos sensibles en mensajes o documentación;
- entradas con contenido HTML o scripts tratadas como texto;
- identificadores ajenos manipulados sin acceso indebido;
- descargas restringidas por rol.

#### Accesibilidad y usabilidad

- recorrido completo con teclado;
- foco visible y orden lógico;
- etiquetas y mensajes asociados a campos;
- botones con nombre accesible;
- diálogos con foco contenido y retorno correcto;
- contraste y significado no dependiente solo del color;
- zoom al 200 % sin pérdida de operación crítica;
- mensajes en español claro con terminología farmacéutica correcta.

#### Responsive y compatibilidad

- login, navegación, tablas, formularios, POS, caja y documentación en tamaños definidos;
- menús y diálogos utilizables en móvil;
- tablas con desplazamiento controlado;
- ausencia de controles fuera de pantalla;
- segunda comprobación en Firefox o equivalente.

#### Rendimiento percibido

- carga inicial sin espera indefinida;
- indicadores visibles durante operaciones;
- búsquedas y filtros con respuesta fluida;
- listas grandes paginadas o manejables;
- una acción no debe parecer disponible mientras continúa guardándose;
- no se fijará un umbral numérico definitivo sin un entorno de rendimiento controlado; las demoras repetibles se registrarán con tiempo medido.

### Fase 13 — Regresión y cierre

1. Corregir defectos S1 y S2.
2. Reejecutar el caso fallido y su recorrido completo relacionado.
3. Ejecutar smoke de autenticación, compra, inventario, caja, venta, anulación/devolución y reportes.
4. Repetir la contrastación de las páginas del manual afectadas.
5. Ejecutar nuevamente las verificaciones automatizadas.
6. Reconciliar datos finales.
7. Emitir informe de cierre con aprobados, fallidos, limitaciones aceptadas y riesgos residuales.

## 10. Recorrido maestro de principio a fin

Este recorrido es obligatorio y no reemplaza los casos negativos:

1. Superadministrador inicia sesión y valida roles fijos.
2. Superadministrador crea o habilita un Administrador y un Vendedor.
3. Administrador crea unidades, categoría, proveedor y medicamento.
4. Administrador configura conversiones de Caja y Blíster hacia Tableta.
5. Administrador crea una compra con dos lotes de vencimientos distintos.
6. Administrador guarda el borrador y confirma que no exista stock nuevo.
7. Administrador recibe la compra y comprueba lotes, entradas y alertas.
8. Vendedor abre caja con un monto inicial conocido.
9. Vendedor crea un pendiente y comprueba que no reserve stock.
10. Administrador cambia el precio o afecta el stock apto; el Vendedor retoma y observa la revalidación.
11. Vendedor cobra una venta que consuma más de un lote mediante FEFO.
12. Se valida comprobante interno, pago, cambio, stock, movimientos y caja.
13. Vendedor anula la venta con motivo mientras la caja está abierta.
14. Se valida reversa al mismo lote, pago reversado, caja neta y auditoría.
15. Vendedor registra una segunda venta válida y cierra caja.
16. Se intenta anular después del cierre y se confirma el bloqueo.
17. Administrador registra devolución administrativa total de la segunda venta.
18. Se confirma reposición a lotes originales sin modificar el cierre histórico.
19. Administrador prepara una factura interna de una venta elegible y confirma que no es fiscal.
20. Administrador cancela el documento interno con motivo y sin impacto en stock/caja.
21. Superadministrador revisa auditoría.
22. Administrador reconcilia reportes y exportaciones CSV.
23. Cada paso se reproduce desde el manual y se registra en la matriz documental.

## 11. Criterios de salida

La versión puede aprobarse cuando:

- el recorrido maestro está aprobado;
- no quedan defectos S1 ni S2 abiertos;
- los S3 abiertos tienen riesgo, responsable y decisión explícita;
- las verificaciones automatizadas previstas terminan correctamente o sus excepciones están aceptadas;
- la matriz de permisos pasa en interfaz y servicio;
- no hay stock negativo ni diferencias inexplicables de caja;
- compra, venta, anulación y devolución conservan trazabilidad por lote;
- reportes y CSV se reconcilian con las operaciones del ciclo;
- todas las páginas operativas del manual fueron contrastadas;
- no quedan contradicciones materiales entre manual y aplicación;
- las limitaciones de facturación están visibles y no se confunden con SIAT real;
- el informe final contiene evidencias y riesgos residuales.

Clasificación final:

- **APROBADO:** cumple todos los criterios de salida.
- **APROBADO CON OBSERVACIONES:** solo quedan S3/S4 o limitaciones aceptadas sin riesgo crítico.
- **NO APROBADO:** existe S1/S2, falla el recorrido maestro o no se puede demostrar integridad de stock/caja.
- **BLOQUEADO:** el entorno o los datos impiden obtener evidencia suficiente.

## 12. Entregables del ciclo

- matriz de casos y resultados;
- matriz de permisos por rol;
- matriz aplicación ↔ manual;
- evidencias visuales y datos de reconciliación;
- archivos CSV verificados;
- registro de defectos con severidad;
- lista separada de limitaciones aceptadas de facturación;
- informe final de QA con recomendación de liberación.

## 13. Plantilla de informe final

| Campo | Resultado |
| --- | --- |
| Versión evaluada |  |
| Fecha y entorno |  |
| Casos ejecutados / aprobados / fallidos / bloqueados |  |
| Recorrido maestro |  |
| S1 / S2 / S3 / S4 abiertos |  |
| Cobertura de páginas del manual |  |
| Reconciliación de inventario |  |
| Reconciliación de caja |  |
| Reconciliación de reportes y CSV |  |
| Limitaciones aceptadas de facturación | Sin SIAT real, CUF, QR fiscal ni anulación tributaria |
| Riesgos residuales |  |
| Recomendación | APROBADO / APROBADO CON OBSERVACIONES / NO APROBADO / BLOQUEADO |

## 14. Plantilla de defectos

| ID | Severidad | Módulo | Rol | Precondición | Pasos | Esperado | Obtenido | Evidencia | Manual relacionado | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| QA-001 |  |  |  |  |  |  |  |  |  |  |
