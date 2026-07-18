# Documentacion de dominio

Este repositorio utiliza un unico contexto de dominio para la operacion de un sistema POS farmaceutico.

## Antes de trabajar

- Leer `docs/lineamientos-app-farmacia.md` como fuente principal de vocabulario, alcance y reglas operativas.
- Leer las ADR relevantes bajo `docs/adr/` cuando existan.
- Consultar specs canonicos previos cuando una funcionalidad dependa de decisiones ya cerradas.

## Vocabulario

Usar exactamente los conceptos del dominio farmaceutico definidos en los lineamientos. Evitar sinonimos que cambien el sentido operativo de lotes, vencimientos, FEFO, dispensacion, caja, comprobantes internos, devoluciones, auditoria o SIAT.

Cuando falte un concepto necesario, registrar la brecha en el trabajo de modelado correspondiente en lugar de introducir terminologia ambigua.

## Conflictos

Si una decision nueva contradice una ADR o un spec canonico vigente, exponer el conflicto de manera explicita y resolverlo antes de implementar.
