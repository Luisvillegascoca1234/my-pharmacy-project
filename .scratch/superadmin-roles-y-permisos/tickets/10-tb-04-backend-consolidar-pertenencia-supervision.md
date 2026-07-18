# 10 — [BACKEND] TB-04 — Consolidar las reglas de pertenencia y supervision

**Status:** TODO
**Objective:** BACKEND
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** TB-04 — Las operaciones compartidas respetan pertenencia y supervision
**Blocked by:** [09 — Revisar y corregir la politica de features](./09-tb-03-code-review-revisar-politica-features.md)

## Outcome

Las operaciones compartidas aplican consistentemente el alcance del actor autenticado. Vendedor queda limitado a caja, ventas y pendientes propios; Administrador y Superadministrador conservan supervision controlada; y las anulaciones mantienen estado, pertenencia, trazabilidad y auditoria.

## Acceptance criteria

- [ ] Vendedor solo consulta y opera su propia caja, ventas y carritos pendientes.
- [ ] Administrador y Superadministrador pueden consultar los registros ajenos previstos para supervision.
- [ ] Vendedor solo puede anular una venta propia, del dia y asociada a una caja abierta.
- [ ] Administrador y Superadministrador pueden anular una venta ajena unicamente mientras su caja asociada permanezca abierta.
- [ ] Los bloqueos por pertenencia, fecha, estado de caja o estado de venta producen errores de dominio controlados.
- [ ] Las operaciones sensibles conservan sus eventos de auditoria y la trazabilidad de pago e inventario vigente.
- [ ] Las reglas contextuales se evalúan por rol y actor, sin introducir claves de permiso.
- [ ] Las pruebas de servicios cubren alcance propio, supervision, anulacion permitida y cada bloqueo relevante.

## Comments

