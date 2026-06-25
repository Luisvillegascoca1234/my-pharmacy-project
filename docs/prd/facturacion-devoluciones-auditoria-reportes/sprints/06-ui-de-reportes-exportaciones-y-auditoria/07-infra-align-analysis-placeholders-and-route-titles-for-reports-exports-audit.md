# Ticket 07 - Align analysis placeholders and route titles for reports exports audit

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 08

## Description

Retirar placeholders y referencias transitorias que mantenian reportes, exportaciones y auditoria como modulos genericos. Este ticket deja la capa de navegacion y nombres operativos coherente con las paginas reales creadas en el sprint.

## Scope

- Placeholders de `ModulePage` asociados a `/reports`, `/exports` y `/audit`.
- Titulos, descripciones y constantes de rutas de analisis tocadas por el sprint.
- Imports, exports y barrels agregados para conectar paginas reales.
- Nombres visibles que deben mantener la separacion entre reportes visuales, descargas CSV auditadas y auditoria consultable.

## Out Of Scope

- Cambiar la estructura general de navegacion.
- Reescribir pantallas no tocadas por el sprint.
- Actualizar documentacion operativa, OpenAPI o tesis.

## Acceptance Criteria

- No queda ruta de analisis apuntando al placeholder cuando ya existe pagina real.
- Los nombres de navegacion no prometen SIAT real, BI avanzado ni exportaciones fuera del alcance V1.
- Las referencias a facturas y devoluciones se mantienen estables y no se renombran accidentalmente.
- El epic sigue en `TODO`, porque el cierre documental queda planificado para el sprint 07.
