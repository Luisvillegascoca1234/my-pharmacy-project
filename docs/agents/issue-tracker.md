# Issue tracker: Markdown local

El spec canonico y sus tickets de ejecucion viven como archivos Markdown versionables bajo `.scratch/`.

## Distribucion

```text
.scratch/
└── <feature-slug>/
    ├── spec.md
    └── tickets/
        ├── 01-tb-01-backend-<slug>.md
        ├── 02-tb-01-ui-<slug>.md
        ├── 03-tb-01-code-review-<slug>.md
        └── ...
```

## Convenciones

- Mantener una sola funcionalidad por directorio `.scratch/<feature-slug>/`.
- Guardar el spec canonico en `.scratch/<feature-slug>/spec.md`.
- Guardar cada ticket en un archivo independiente dentro de `tickets/`; no crear un archivo combinado.
- Numerar los tickets desde `01` en su orden obligatorio de ejecucion.
- Enlazar cada ticket con el spec canonico mediante `../spec.md`.
- Usar unicamente los estados `TODO` y `DONE`.
- Crear cada ticket como `TODO` y cambiarlo a `DONE` solo al satisfacer sus criterios de aceptacion.
- Usar un solo objetivo por ticket: `BACKEND`, `UI`, `CODE REVIEW`, `QA` o `DOCS`.
- Enlazar `Blocked by` con el ticket inmediatamente anterior; solo el primer ticket carece de bloqueo.
- Mantener notas de ejecucion bajo `## Comments`.

## Publicacion

- `to-spec` publica el spec canonico.
- `to-tickets` publica el directorio de tickets y un archivo numerado por ticket aprobado.

## Seleccion del siguiente ticket

Comenzar por el ticket `01`. Luego seleccionar el `TODO` de menor numero solo cuando su bloqueo inmediato este `DONE`. No omitir tickets anteriores ni trabajar tickets en paralelo.
