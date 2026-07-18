# Roles y facultades

## Problem Statement

La aplicacion presenta una mezcla entre roles fijos y permisos persistidos que sugiere una configuracion dinamica inexistente. El superadministrador no dispone de una vista confiable para comprender las facultades de cada rol y distintos puntos de acceso repiten listas de roles, lo que permite que backend y cliente diverjan. Algunas operaciones ya aplican restricciones por rol y pertenencia, pero la politica general no esta consolidada ni se comunica con claridad.

La farmacia necesita un esquema de autorizacion predecible: tres roles institucionales, facultades estables por area funcional y reglas operativas coherentes en toda la aplicacion. La asignacion de un rol a un usuario puede cambiar, pero las facultades del rol no deben modificarse en tiempo de ejecucion.

## Solution

La aplicacion adoptara un RBAC estatico basado exclusivamente en los roles `superadmin`, `admin` y `seller`. Un manifiesto compartido definira que roles acceden a cada feature y servira como unica fuente para las guardas del servidor, la navegacion del cliente y la matriz informativa.

El superadministrador consultara una pantalla de solo lectura denominada "Roles y facultades". La pantalla resumira la responsabilidad de cada rol y comparara sus facultades por area farmaceutica mediante los estados "Acceso total", "Acceso operativo", "Solo registros propios" y "Sin acceso". Estos estados comunican alcance, pero no constituyen permisos dinamicos.

La persistencia conservara unicamente los tres roles y su relacion con usuarios. Se eliminaran el catalogo de permisos y sus asignaciones. La sesion, los contratos de usuario y la autorizacion dejaran de transportar o interpretar claves de permiso. Las reglas contextuales, como operar registros propios o supervisar registros ajenos, continuaran evaluandose por rol dentro del comportamiento de dominio.

## User Stories

1. Como superadministrador, quiero consultar los tres roles institucionales para comprender la politica de acceso aplicada por el sistema farmaceutico.
2. Como superadministrador, quiero comparar las facultades por area de operacion farmaceutica para explicar las responsabilidades de cada perfil.
3. Como superadministrador, quiero visualizar las restricciones contextuales para distinguir acceso total, acceso operativo, registros propios y acceso denegado.
4. Como superadministrador, quiero asignar uno de los tres roles fijos a un usuario para cambiar las responsabilidades del personal sin redefinir los roles.
5. Como administrador, quiero acceder a las funciones de administracion y supervision farmaceutica para gestionar la operacion cotidiana sin gobernar el sistema.
6. Como vendedor, quiero acceder solo a la operacion de mostrador y a las consultas requeridas para la dispensacion para trabajar sin exponer informacion administrativa o sensible.
7. Como usuario autenticado, quiero que la navegacion y la autorizacion del servidor sigan la misma politica de roles para que el acceso visible coincida con el acceso efectivo.
8. Como responsable del sistema, quiero que una feature nueva permanezca denegada hasta declarar sus roles admitidos para evitar accesos accidentales por omision.

## Tracer Bullets

### TB-01 — El superadministrador consulta la matriz institucional de roles

**User outcome:** El superadministrador abre "Roles y facultades" y consulta los tres roles, sus responsabilidades y su alcance por area funcional en una vista de solo lectura.

**Backend responsibility:** Exponer `GET /api/roles` solo para `superadmin`. La respuesta contiene exactamente los tres roles en orden estable, sus identificadores, nombres institucionales, resumen funcional y facultades agrupadas. Validar la respuesta con contratos compartidos y tratar cualquier rol faltante o inesperado como inconsistencia de configuracion.

**UI behavior:** Presentar tres tarjetas de resumen y una matriz comparativa agrupada en Operacion de mostrador, Catalogo farmaceutico, Inventario y trazabilidad, Abastecimiento, Cierre administrativo y analisis, y Gobierno del sistema. Mostrar una leyenda para los cuatro niveles de alcance. No incluir busqueda, filtros, formularios ni acciones de guardado. En pantallas estrechas, presentar secciones apiladas por rol. Resolver carga y error recuperable con una accion para reintentar.

**QA journey:** Iniciar sesion como Superadministrador, abrir "Roles y facultades" y comprobar los tres resúmenes, las seis areas, los cuatro niveles de alcance y la ausencia de controles de edicion. Reducir el ancho disponible y confirmar la lectura apilada. Repetir el acceso directo como Administrador y Vendedor para observar la denegacion. Provocar de forma controlada un fallo recuperable de carga y confirmar que "Reintentar" recupera la matriz.

**Acceptance criteria:**

- Un `superadmin` puede abrir la pantalla y observar exactamente Superadministrador, Administrador y Vendedor.
- La pantalla identifica las seis areas acordadas y explica los cuatro niveles de alcance.
- La matriz no ofrece acciones para crear, editar, eliminar ni guardar roles o facultades.
- Un `admin` o `seller` que solicita el endpoint recibe `403`.
- Un error de carga permite reintentar sin abandonar la pantalla.
- Una respuesta que no contiene exactamente los tres roles se muestra como inconsistencia de configuracion y no como matriz vacia.

### TB-02 — La identidad autenticada depende unicamente del rol fijo

**User outcome:** Los usuarios inician y restauran sesion normalmente, mientras el sistema comunica su identidad y rol sin exponer permisos dinamicos inexistentes.

**Backend responsibility:** Restringir la identidad de rol persistida a `superadmin`, `admin` o `seller`; conservar identificadores estables para la asignacion a usuarios; eliminar permisos y relaciones de permisos; y sincronizar los tres roles mediante un seed idempotente. Eliminar `permissions` de los contratos de autenticacion y usuarios, de las respuestas de login y sesion actual, y de OpenAPI. Publicar una migracion progresiva y permitir la reconstruccion de la base de desarrollo.

**UI behavior:** Consumir sesiones y usuarios basados solo en rol. Mantener login, restauracion de sesion y administracion de usuarios sin depender de un arreglo de permisos. La asignacion de rol permanece disponible exclusivamente en la gestion de usuarios del superadministrador.

**QA journey:** Iniciar sesion con cada rol, refrescar la aplicacion y comprobar que la sesion se restaura con la identidad y el rol correctos. Como Superadministrador, abrir Usuarios, cambiar el rol de una cuenta de prueba y confirmar que la cuenta adopta las facultades del rol asignado. Comprobar que la experiencia no muestra permisos configurables.

**Acceptance criteria:**

- Login y sesion actual responden con la identidad del usuario y uno de los tres roles, sin el campo `permissions`.
- Los contratos de usuario tampoco exponen `permissions`.
- La base reconstruida contiene exactamente tres roles y no contiene catalogos ni asignaciones de permisos.
- No es posible persistir un cuarto nombre de rol ni duplicar uno existente.
- El superadministrador puede seguir asignando cualquiera de los tres roles a un usuario.
- La proteccion del ultimo superadministrador activo permanece vigente.

### TB-03 — Cada feature aplica la misma politica explicita de roles

**User outcome:** Cada usuario ve y puede abrir unicamente las areas correspondientes a su rol; una ruta directa nunca concede acceso adicional.

**Backend responsibility:** Mantener `requireRole` como unico middleware general de autorizacion y alimentarlo desde el manifiesto compartido. Reemplazar listas de roles duplicadas por la politica canonica. Negar por defecto cualquier feature que no declare sus roles. Restringir movimientos completos de inventario y costos a `admin` y `superadmin`; mantener comprobantes internos preparados fuera de `seller`; y conservar auditoria completa, usuarios, roles, configuracion global y SIAT exclusivamente para `superadmin`.

**UI behavior:** Construir navegacion, rutas autorizadas y estados de acceso denegado con el mismo manifiesto de roles. Ocultar superficies no autorizadas en la navegacion, pero conservar una respuesta clara de acceso denegado cuando el usuario intenta una URL conocida directamente. La ruta "Roles y facultades" permanece exclusiva del superadministrador.

**QA journey:** Recorrer la navegacion con cuentas Superadministrador, Administrador y Vendedor y comparar las areas visibles con la matriz. Intentar abrir directamente una ruta conocida pero no autorizada para cada rol y confirmar la experiencia de acceso denegado. Verificar especialmente movimientos y costos de inventario, comprobantes internos, reportes, gobierno del sistema, SIAT y auditoria.

**Acceptance criteria:**

- `superadmin` accede a todas las features declaradas.
- `admin` accede a operacion farmaceutica, supervision, abastecimiento, cierre administrativo y analisis, pero no a gobierno del sistema, SIAT ni auditoria completa.
- `seller` accede a dashboard, POS, pendientes propios, caja propia, ventas propias, alertas basicas y consulta de productos, unidades, stock y lotes.
- `seller` no accede a movimientos completos, ajustes, compras, costos, comprobantes internos, devoluciones administrativas, reportes, exportaciones ni configuracion.
- Backend y cliente producen la misma decision de acceso para cada feature declarada.
- Una feature sin politica explicita queda denegada para todos los roles.
- El acceso directo no autorizado recibe `403` en backend y una experiencia de acceso denegado en el cliente.

### TB-04 — Las operaciones compartidas respetan pertenencia y supervision

**User outcome:** El vendedor opera sus propios registros, mientras administrador y superadministrador supervisan registros ajenos dentro de las reglas farmaceuticas vigentes.

**Backend responsibility:** Mantener las reglas contextuales en los servicios de dominio y evaluar directamente el rol autenticado. Un `seller` consulta y opera su propia caja, ventas y carritos; `admin` y `superadmin` pueden supervisar registros de otros usuarios. Conservar la anulacion de una venta propia por el vendedor solo cuando corresponde al dia y su caja sigue abierta; permitir a administrador y superadministrador anular ventas de cualquier vendedor mientras la caja asociada siga abierta. Las restricciones de estado, pertenencia, trazabilidad y auditoria siguen siendo obligatorias.

**UI behavior:** Mostrar "Solo registros propios" donde corresponda y habilitar filtros o acciones de supervision solo para `admin` y `superadmin`. Comunicar las razones operativas que bloquean una accion sin sugerir que existe un permiso configurable.

**QA journey:** Preparar registros de prueba pertenecientes a dos vendedores. Como Vendedor, comprobar que caja, ventas y pendientes se limitan a registros propios y que una venta propia solo puede anularse dentro de las condiciones vigentes. Como Administrador y Superadministrador, comprobar la supervision de registros ajenos y los bloqueos cuando la caja asociada esta cerrada. Confirmar que las razones de bloqueo son comprensibles y que las operaciones permitidas conservan su trazabilidad visible.

**Acceptance criteria:**

- Un `seller` no puede consultar ni operar caja, ventas o pendientes pertenecientes a otro usuario.
- Un `admin` o `superadmin` puede consultar registros ajenos en las superficies de supervision declaradas.
- Un `seller` solo puede anular una venta propia, del dia y asociada a una caja abierta.
- Un `admin` o `superadmin` puede anular una venta ajena solo si la caja asociada permanece abierta.
- Las respuestas y acciones visibles reflejan el alcance propio o de supervision correspondiente al rol.
- Las operaciones sensibles conservan sus eventos de auditoria existentes.

## Implementation Decisions

- El modelo de autorizacion es RBAC estatico. La autoridad es el nombre del rol autenticado, nunca una clave de permiso.
- Los unicos roles validos son `superadmin`, `admin` y `seller`.
- La tabla de roles conserva un identificador y un nombre restringido. Los nombres visibles, responsabilidades y facultades provienen de la politica fija, no de campos editables.
- Se eliminan las entidades persistidas de permisos y asignaciones de permisos.
- Un manifiesto tipado y compartido declara los roles admitidos por cada feature. Backend, rutas del cliente y navegacion consumen esa misma politica.
- La ausencia de una declaracion para una feature produce denegacion para todos los roles, incluido `superadmin`.
- `requireRole` permanece como middleware de autorizacion. No se crea `requirePermission` ni un sistema equivalente.
- Los niveles "Acceso total", "Acceso operativo", "Solo registros propios" y "Sin acceso" son metadatos informativos para la matriz; no son grants evaluados en tiempo de ejecucion.
- Las reglas de pertenencia, estado y supervision se evalúan en los servicios de dominio mediante el rol y el actor autenticado.
- `GET /api/roles` es el unico endpoint propio de esta funcionalidad. No existen endpoints para crear, modificar, eliminar o reasignar facultades.
- La respuesta de roles incluye los IDs requeridos por la administracion de usuarios y la representacion informativa necesaria para la matriz.
- `AuthenticatedUser`, las respuestas administrativas de usuario y OpenAPI dejan de incluir `permissions`.
- La migracion conserva el historial existente, elimina las tablas de permisos, restringe los nombres de rol y permite resetear la base de desarrollo.
- El seed crea o sincroniza exactamente los tres roles y deja de asignar permisos.
- Cambiar el rol de un usuario continua generando `USER_ROLE_CHANGED`. Consultar la matriz no genera auditoria.
- Los nombres tecnicos permanecen en ingles; la experiencia visible del cliente utiliza espanol y terminologia farmaceutica.
- No se mantiene compatibilidad transitoria con contratos que incluyan `permissions`.

## Testing Decisions

- Probar el manifiesto compartido como contrato observable: contiene exactamente tres roles, declara cada feature conocida y niega features no declaradas.
- Probar `requireRole` en su frontera HTTP con un rol permitido, un rol denegado y una solicitud sin identidad autenticada.
- Probar `GET /api/roles` como integracion de contrato: orden estable, agrupaciones completas, cuatro niveles informativos, acceso exclusivo de `superadmin` e inconsistencia ante catalogo invalido.
- Probar autenticacion y administracion de usuarios en sus puntos de validacion existentes para confirmar que las respuestas ya no incluyen `permissions` y que la asignacion de roles sigue funcionando.
- Probar el seed y la persistencia con una base aislada para confirmar los tres roles unicos y la ausencia de permisos persistidos.
- Probar las decisiones de navegacion y acceso directo por rol con las pruebas de rutas existentes.
- Reutilizar las pruebas de servicios de ventas, caja y pendientes para verificar alcance propio, supervision y anulaciones. Ampliarlas solo donde la politica consolidada cambie una conducta observable.
- Evitar pruebas que afirmen nombres de funciones, consultas ORM o distribucion interna; verificar respuestas, acceso y efectos de dominio.

## QA Decisions

- El ticket final de QA constituye la autorizacion explicita para usar Computer Use mediante el navegador integrado una vez terminados los cuatro tracer bullets y sus revisiones.
- QA debe leer las instrucciones raiz antes de actuar y asumir que el servidor de desarrollo ya esta levantado.
- QA ejecuta los cuatro journeys del spec, incluidos carga, error recuperable, configuracion inconsistente cuando pueda inducirse de forma controlada, acceso denegado y disposicion adaptable.
- QA es correctivo: puede modificar backend, frontend, contratos compartidos y pruebas, y debe repetir todo journey afectado despues de una correccion.
- QA permanece `TODO` hasta que todos los recorridos aplicables pasen. No se ejecuta durante la publicacion de tickets.

## User Documentation

La documentacion de usuario debe explicar:

- las responsabilidades institucionales de Superadministrador, Administrador y Vendedor;
- la diferencia entre acceso total, acceso operativo, registros propios y ausencia de acceso;
- las facultades por Operacion de mostrador, Catalogo farmaceutico, Inventario y trazabilidad, Abastecimiento, Cierre administrativo y analisis, y Gobierno del sistema;
- que las facultades son fijas y solo cambia la asignacion del rol a un usuario;
- las restricciones del vendedor sobre caja propia, ventas propias, anulaciones condicionadas, movimientos, costos y operaciones administrativas;
- las facultades de supervision del administrador y las facultades de gobierno exclusivas del superadministrador.

La documentacion se redactara en espanol con vocabulario especializado del rubro farmaceutico. No describira organizacion interna, archivos, capas ni detalles de implementacion.

## Out of Scope

- Crear, renombrar, editar, desactivar o eliminar roles.
- Crear, editar o asignar permisos dinamicos.
- Roles personalizados, temporales o por sucursal.
- Permisos por usuario, excepciones individuales o delegaciones temporales.
- `requirePermission` o cualquier motor de autorizacion basado en claves de permiso.
- Historial visual de cambios de la matriz, porque la matriz no cambia en tiempo de ejecucion.
- Auditoria por consultar la matriz.
- Emision fiscal SIAT desde el POS del vendedor.
- Cambios en las reglas farmaceuticas de inventario, FEFO, facturacion, devoluciones o caja no necesarios para alinear autorizacion.
- Compatibilidad con clientes que todavia esperen el campo `permissions`.
- Epica, issues externos y sprints. La ejecucion se organiza mediante los tickets Markdown publicados por `to-tickets`.

## Further Notes

- La base de desarrollo puede reconstruirse porque no existen usuarios activos que deban conservarse.
- La pantalla visible se denomina "Roles y facultades" y conserva la ruta funcional existente.
- Los comprobantes internos preparados siguen siendo una operacion administrativa. Una futura emision fiscal desde POS requiere una especificacion independiente.
- El rol `superadmin` tiene acceso completo solo a features declaradas; una feature nueva no hereda acceso implicitamente.
- La politica estatica reduce configuracion y errores operativos, pero exige actualizar el manifiesto compartido cada vez que se incorpora una feature nueva.
