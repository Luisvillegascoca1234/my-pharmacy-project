# 07 — [BACKEND] TB-03 — Aplicar la politica compartida en todas las rutas

**Status:** DONE
**Objective:** BACKEND
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** TB-03 — Cada feature aplica la misma politica explicita de roles
**Blocked by:** [06 — Revisar y corregir la identidad basada en rol](./06-tb-02-code-review-revisar-identidad-basada-rol.md)

## Outcome

Todas las superficies HTTP aplican una politica unica y explicita mediante roles. Las listas duplicadas desaparecen, una feature no declarada se deniega por defecto y las inconsistencias conocidas de inventario, comprobantes internos, analisis y gobierno quedan alineadas con la matriz institucional.

## Acceptance criteria

- [ ] Cada feature HTTP conocida declara sus roles admitidos mediante la politica compartida.
- [ ] `requireRole` permanece como unico middleware general de autorizacion.
- [ ] Una feature no declarada queda denegada para todos los roles, incluido `superadmin`.
- [ ] Vendedor puede consultar stock y lotes, pero no movimientos completos, ajustes ni costos.
- [ ] Comprobantes internos, devoluciones administrativas, reportes y exportaciones quedan limitados a Administrador y Superadministrador.
- [ ] Usuarios, Roles y facultades, configuracion global, SIAT y auditoria completa quedan limitados a Superadministrador.
- [ ] Las respuestas no autorizadas usan `403` y el contrato de error vigente.
- [ ] Las pruebas de rutas cubren la matriz completa y la denegacion por omision.

## Comments

- Centralizada la autorizacion HTTP en un manifiesto compartido con denegacion por omision; todas las rutas protegidas consumen `requireRole` y se alinearon las restricciones institucionales, incluido el ocultamiento de costos para Vendedor.
- Validaciones reportadas: typechecks shared/backend/frontend aprobados; pruebas focalizadas 40/40; revision estatica sin listas inline ni `requirePermission`. La suite backend global conserva tres fallas temporales ajenas en `pending-carts`.
