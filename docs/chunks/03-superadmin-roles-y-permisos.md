# 03 - Superadmin roles y facultades

## Objetivo

Consolidar una politica de acceso estable para la operacion farmaceutica. El sistema reconoce exclusivamente los roles Superadministrador, Administrador y Vendedor. Cada rol posee facultades fijas por area funcional; el superadministrador puede asignar roles a usuarios, pero no crear roles ni modificar sus facultades.

El spec canonico de este chunk se publica en `.scratch/superadmin-roles-y-permisos/spec.md`.

## Alcance

- RBAC estatico basado en los tres roles institucionales.
- Matriz compartida de roles permitidos por feature.
- Persistencia de roles sin catalogo ni asignaciones de permisos.
- Restriccion de la base de datos a `superadmin`, `admin` y `seller`.
- Sesion y contratos de usuario sin claves de permiso.
- Autorizacion backend mediante roles.
- Navegacion y acceso frontend mediante la misma politica de roles.
- Pantalla de solo lectura "Roles y facultades" exclusiva del superadministrador.
- Reglas contextuales de pertenencia y supervision evaluadas por rol.
- Asignacion de uno de los tres roles desde la gestion de usuarios.
- Auditoria de cambios de rol de usuario mediante el evento vigente.

## Matriz funcional acordada

### Superadministrador

Accede a todas las features declaradas: operacion de mostrador, catalogo farmaceutico, inventario y trazabilidad, abastecimiento, cierre administrativo, analisis y gobierno del sistema.

### Administrador

Gestiona la operacion farmaceutica y la supervision: productos, unidades, inventario, ajustes, proveedores, compras, POS, caja, ventas, comprobantes internos, devoluciones administrativas, alertas, reportes y exportaciones. No administra usuarios, roles, configuracion global, SIAT ni auditoria completa.

### Vendedor

Opera el mostrador y consulta la informacion necesaria para la dispensacion: dashboard, POS, carritos pendientes propios, caja propia, ventas propias, alertas basicas, productos, unidades, stock y lotes. No accede a movimientos completos, ajustes, compras, costos, comprobantes internos, devoluciones administrativas, reportes, exportaciones ni configuracion.

Puede anular una venta propia, del dia y asociada a una caja abierta. Administrador y Superadministrador pueden anular ventas de cualquier vendedor mientras la caja asociada siga abierta.

## Experiencia del superadministrador

La pantalla presenta:

- un resumen de responsabilidad para cada rol;
- una matriz comparativa agrupada en Operacion de mostrador, Catalogo farmaceutico, Inventario y trazabilidad, Abastecimiento, Cierre administrativo y analisis, y Gobierno del sistema;
- los estados Acceso total, Acceso operativo, Solo registros propios y Sin acceso;
- notas breves para restricciones de pertenencia, supervision y estado operativo;
- estados de carga, error recuperable e inconsistencia de configuracion.

La pantalla no incluye busqueda, filtros, formularios ni acciones para crear, editar, eliminar o guardar.

## Contratos y persistencia

- `GET /api/roles` es el unico endpoint del chunk y permanece restringido a `superadmin`.
- La respuesta contiene exactamente los tres roles, sus identificadores y su matriz informativa.
- Los contratos de autenticacion y usuarios no contienen `permissions`.
- Los nombres de rol son inmutables y estan restringidos por la base de datos.
- La migracion elimina los permisos persistidos y conserva el historial de migraciones.
- El seed sincroniza exactamente los tres roles.
- La base de desarrollo puede reconstruirse sin preservar datos actuales.

## Autorizacion

- `requireRole` permanece como middleware de autorizacion.
- Backend y frontend consumen la misma politica explicita de roles por feature.
- Una feature nueva queda denegada hasta declarar sus roles admitidos.
- Las reglas "propio versus todos" permanecen en el dominio y evalúan directamente el rol autenticado.
- No se implementa `requirePermission` ni otra capa de permisos dinamicos.

## Decisiones cerradas

- No existen roles personalizados.
- No existen permisos configurables.
- No se editan las facultades de los roles base.
- La asignacion usuario a rol continua siendo modificable por el superadministrador.
- La consulta de la matriz no genera auditoria.
- Los cambios de rol de usuario conservan su auditoria vigente.
- Los comprobantes internos preparados no estan disponibles para Vendedor.
- Vendedor consulta stock y lotes, pero no movimientos completos ni costos.
- No se mantiene compatibilidad con respuestas que incluyan `permissions`.
- No se crean epica, issues externos ni sprints; la ejecucion se organiza mediante tickets Markdown locales.
- El QA final se ejecuta unicamente mediante su ticket explicito, despues de completar y revisar todos los tracer bullets.

## Verificacion automatizada prevista

- Politica compartida completa y denegacion por defecto.
- Acceso y rechazo de `requireRole`.
- Respuesta y autorizacion de la consulta de roles.
- Sesion y usuarios sin `permissions`.
- Persistencia limitada a los tres roles.
- Navegacion y rutas coherentes con backend.
- Alcance propio y supervision en ventas, caja y pendientes.

## Fuera de alcance

- Roles por sucursal, temporales o personalizados.
- Permisos por usuario o excepciones individuales.
- CRUD de roles o facultades.
- Auditoria visual de la matriz.
- Emision fiscal SIAT desde el POS del vendedor.
- QA anticipado antes de completar y revisar todos los tracer bullets.
