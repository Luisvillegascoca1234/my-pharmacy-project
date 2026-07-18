# 08 — [UI] TB-03 — Alinear navegacion y acceso directo por rol

**Status:** TODO
**Objective:** UI
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** TB-03 — Cada feature aplica la misma politica explicita de roles
**Blocked by:** [07 — Aplicar la politica compartida en todas las rutas](./07-tb-03-backend-aplicar-politica-compartida-rutas.md)

## Outcome

La navegacion y las rutas del cliente aplican la misma politica que el servidor. Cada rol observa solo sus areas autorizadas y un acceso directo conocido pero denegado comunica claramente la restriccion sin revelar acciones no disponibles.

## Acceptance criteria

- [ ] La navegacion deriva sus decisiones de la politica compartida y no mantiene listas paralelas de roles.
- [ ] Superadministrador ve todas las features declaradas.
- [ ] Administrador ve operacion farmaceutica, supervision, abastecimiento, cierre y analisis, sin gobierno del sistema, SIAT ni auditoria completa.
- [ ] Vendedor ve solo operacion de mostrador y consultas necesarias para la dispensacion.
- [ ] Roles y facultades permanece visible exclusivamente para Superadministrador.
- [ ] Una URL conocida pero no autorizada muestra una experiencia de acceso denegado en espanol.
- [ ] Una feature sin politica explicita no aparece ni se vuelve accesible mediante fallback.
- [ ] Las pruebas de navegacion y rutas cubren los tres roles y accesos directos denegados.

## Comments

