# 11 — [UI] TB-04 — Comunicar alcance propio y facultades de supervision

**Status:** DONE
**Objective:** UI
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** TB-04 — Las operaciones compartidas respetan pertenencia y supervision
**Blocked by:** [10 — Consolidar las reglas de pertenencia y supervision](./10-tb-04-backend-consolidar-pertenencia-supervision.md)

## Outcome

Las superficies de caja, ventas y pendientes comunican con claridad si el usuario opera registros propios o supervisa registros ajenos. Los filtros y acciones se habilitan segun el rol, y los bloqueos explican la condicion operativa sin sugerir permisos configurables.

## Acceptance criteria

- [ ] Vendedor observa unicamente registros propios en caja, ventas y pendientes.
- [ ] Filtros y acciones de supervision aparecen solo para Administrador y Superadministrador.
- [ ] La matriz y las superficies operativas usan de forma consistente la expresion "Solo registros propios".
- [ ] Las acciones de anulacion se habilitan solo cuando la respuesta efectiva indica que la operacion esta permitida.
- [ ] Los bloqueos por caja cerrada, venta ajena, fecha o estado muestran mensajes comprensibles en espanol.
- [ ] La UI no calcula de forma independiente reglas sensibles que pertenecen al servidor.
- [ ] Las pruebas frontend cubren alcance propio, supervision visible, accion permitida y razones de bloqueo.

## Comments

- Comunicados alcance propio y supervision administrativa en caja, ventas y pendientes, con copy consistente, controles por rol y acciones derivadas exclusivamente de `canCancel`, `cancellationBlockedReason` y `canClose` del servidor.
- Validaciones reportadas: typecheck frontend aprobado, suite frontend completa 121/121, pruebas especificas finales 9/9 y `git diff --check` sin errores. Sin QA visual.
