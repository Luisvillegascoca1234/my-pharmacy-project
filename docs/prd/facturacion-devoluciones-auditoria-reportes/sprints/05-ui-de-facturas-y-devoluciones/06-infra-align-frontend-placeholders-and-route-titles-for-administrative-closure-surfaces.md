# Ticket 06 - Align frontend placeholders and route titles for administrative closure surfaces

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 07

## Description

Reconciliar placeholders, titulos, labels de navegacion y referencias visibles que quedaron de la planificacion inicial para que las superficies reales de facturas y devoluciones no parezcan modulos pendientes ni SIAT real.

## Scope

- Eliminar uso de `ModulePage` para facturas preparadas y devoluciones.
- Ajustar labels/descripciones de navegacion relacionados con facturas preparadas.
- Agregar constantes de ruta necesarias sin magic strings dispersos.
- Revisar `getRouteTitle` para rutas nuevas.
- Confirmar que copy visible use jerga farmaceutica y administrativa coherente.

## Out Of Scope

- Documentacion operativa de usuario.
- Tesis.
- Reportes, exportaciones y auditoria.

## Acceptance Criteria

- No quedan placeholders de modulo inicial en rutas de facturas o devoluciones.
- La navegacion no promete SIAT real para factura preparada.
- El copy visible diferencia factura preparada, comprobante interno, anulacion POS y devolucion administrativa.
- Las rutas nuevas tienen titulos coherentes en el shell.
