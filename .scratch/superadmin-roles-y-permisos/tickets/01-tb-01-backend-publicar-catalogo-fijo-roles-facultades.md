# 01 — [BACKEND] TB-01 — Publicar el catalogo fijo de roles y facultades

**Status:** DONE
**Objective:** BACKEND
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** TB-01 — El superadministrador consulta la matriz institucional de roles
**Blocked by:** None — start here

## Outcome

El servidor publica una representacion estable y validada de los tres roles institucionales y sus facultades farmaceuticas. La consulta es exclusiva del Superadministrador, diferencia una configuracion invalida de una lista vacia y deja contratos compartidos listos para la experiencia cliente.

## Acceptance criteria

- [ ] La politica fija contiene exactamente `superadmin`, `admin` y `seller`, en el orden acordado.
- [ ] Las facultades se agrupan en las seis areas del spec y utilizan los cuatro niveles informativos acordados.
- [ ] `GET /api/roles` devuelve identificadores, nombres institucionales, responsabilidades y matriz informativa validados por contrato compartido.
- [ ] Un Superadministrador autenticado recibe la matriz completa.
- [ ] Administrador y Vendedor reciben `403` al consultar el endpoint.
- [ ] Un catalogo persistido faltante o inesperado produce una inconsistencia de configuracion controlada.
- [ ] Las pruebas backend cubren respuesta correcta, acceso denegado y configuracion inconsistente.
- [ ] OpenAPI documenta el endpoint y su respuesta efectiva.

## Comments

- Implementado el catalogo fijo y ordenado de roles y facultades, con contrato compartido, autorizacion exclusiva para Superadministrador, manejo controlado de inconsistencias, pruebas backend especificas y documentacion OpenAPI.
- Validaciones reportadas: typecheck de shared y backend aprobados; suite especifica de roles 7/7; `git diff --check` aprobado. La suite backend global conserva tres fallas ajenas en fixtures fechados de `pending-carts.service.spec.ts`.
