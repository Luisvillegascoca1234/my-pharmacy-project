# 02 — [UI] TB-01 — Construir la pantalla Roles y facultades

**Status:** TODO
**Objective:** UI
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** TB-01 — El superadministrador consulta la matriz institucional de roles
**Blocked by:** [01 — Publicar el catalogo fijo de roles y facultades](./01-tb-01-backend-publicar-catalogo-fijo-roles-facultades.md)

## Outcome

El Superadministrador consulta una superficie de solo lectura que resume los tres roles y compara sus facultades por area farmaceutica. La experiencia es clara en escritorio y espacios estrechos, y comunica carga, error recuperable e inconsistencia de configuracion sin ofrecer edicion.

## Acceptance criteria

- [ ] La ruta exclusiva del Superadministrador muestra tres tarjetas de responsabilidad institucional.
- [ ] La matriz presenta las seis areas funcionales y los cuatro niveles de alcance con una leyenda comprensible.
- [ ] Las restricciones de pertenencia y supervision se explican mediante notas breves en espanol.
- [ ] No existen busqueda, filtros, formularios ni acciones para crear, editar, eliminar o guardar.
- [ ] La disposicion se transforma en secciones apiladas cuando no hay ancho suficiente para comparar columnas.
- [ ] La carga inicial, el error recuperable con Reintentar y la inconsistencia de configuracion tienen estados diferenciados.
- [ ] La obtencion y estado de datos permanecen separados del copy y la composicion visual.
- [ ] Las pruebas frontend cubren carga correcta, reintento, configuracion invalida y ausencia de controles de edicion.

## Comments

