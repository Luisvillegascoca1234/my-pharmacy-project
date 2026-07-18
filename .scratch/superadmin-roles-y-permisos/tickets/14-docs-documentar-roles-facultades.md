# 14 — [DOCS] Documentar los roles y facultades farmaceuticas

**Status:** DONE
**Objective:** DOCS
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** All tracer bullets
**Blocked by:** [13 — Validar integralmente Roles y facultades](./13-qa-validar-roles-facultades.md)

## Outcome

La aplicacion de documentacion explica unicamente el comportamiento validado por QA: responsabilidades institucionales, niveles de alcance, facultades por area farmaceutica, restricciones del Vendedor y supervision administrativa. El contenido queda en espanol especializado y evita detalles de implementacion.

## Acceptance criteria

- [x] La documentacion se basa unicamente en comportamiento validado y evidencia registrada por el ticket de QA.
- [x] Se explican Superadministrador, Administrador y Vendedor con sus responsabilidades institucionales.
- [x] Se explican Acceso total, Acceso operativo, Solo registros propios y Sin acceso.
- [x] Se documentan las seis areas funcionales de la matriz.
- [x] Se aclara que las facultades son fijas y que solo cambia la asignacion de rol a un usuario.
- [x] Se documentan caja propia, ventas propias, anulaciones condicionadas, costos, movimientos y restricciones administrativas del Vendedor.
- [x] Se documentan la supervision del Administrador y el gobierno exclusivo del Superadministrador.
- [x] El contenido usa terminologia farmaceutica en espanol y no describe archivos, capas ni organizacion del codigo.

## Comments

- La guia `roles-y-responsabilidades.mdx` fue actualizada como `Roles y facultades` a partir de la evidencia aprobada en el ticket 13.
- El contenido documenta los tres roles, cuatro niveles de alcance, seis areas funcionales, pertenencia del Vendedor, anulaciones condicionadas, supervision administrativa y gobierno exclusivo del Superadministrador.
- No se incluyeron detalles de archivos, capas ni organizacion interna. La terminologia visible permanece en espanol farmaceutico.
- Validacion: `pnpm --filter @pharmacy-pos/docs typecheck` aprobo generacion MDX, tipos de rutas y TypeScript. Sin pendientes ni bloqueos.
