# 02 — [UI] TB-01 — Construir Planificación de stock para el arranque en frío

**Status:** DONE
**Objective:** UI
**Spec:** [Planificación de stock](../spec.md)
**Tracer bullet:** TB-01 — Administración prepara productos y consulta referencias de arranque en frío
**Blocked by:** [01 — Publicar configuración y referencias de arranque en frío](01-tb-01-backend-publicar-configuracion-referencias-arranque-frio.md)

## Outcome

Administrador y superadministrador disponen de una pantalla en español que muestra referencias para productos sin historia, permite mantener parámetros por producto y comunica que todavía no existe una predicción estadística.

## Acceptance criteria

- [ ] La navegación administrativa incluye Planificación de stock para `admin` y `superadmin`.
- [ ] La tabla muestra producto, criticidad, stock utilizable, stock mínimo, cobertura, referencia, presentación y advertencias.
- [ ] La UI diferencia "Referencia configurada" de "Pronóstico de demanda".
- [ ] Se puede editar criticidad, cobertura específica y presentación preferida.
- [ ] Se distingue cobertura heredada de cobertura específica.
- [ ] Existen estados de carga, catálogo vacío, error recuperable y presentación no configurada.
- [ ] `seller` no ve la navegación y recibe acceso denegado por ruta directa.
- [ ] El módulo de datos y sus estados quedan cubiertos por pruebas automatizadas.

## Comments

- Implementacion completada por el subagente dedicado `/root/ticket_02_ui`.
- Se incorporaron navegacion y ruta protegidas, tabla de referencias, edicion de parametros y estados de carga, vacio, error, acceso denegado y presentacion ausente.
- Validaciones reportadas y verificadas: typecheck frontend correcto, 46 pruebas focalizadas y 134 pruebas frontend aprobadas, build de produccion correcto y `git diff --check` sin errores.
- Sin pendientes ni bloqueos. No se ejecuto QA visual.
