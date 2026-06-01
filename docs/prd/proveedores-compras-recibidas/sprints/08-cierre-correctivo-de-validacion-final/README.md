# Sprint 08 - Cierre Correctivo de Validacion Final

## Goal

Ejecutar el cierre correctivo de validacion final del epic de proveedores y compras recibidas, dejando evidencia trazable y cerrando el epic solo si la validacion pasa sin bloqueos.

## Overall Status

- Status: DONE
- Owner: Unassigned
- Resultado de cierre: bloqueado por frontend/backend locales inaccesibles durante la evidencia del ticket 02

## Current Closure Evidence

El ticket 02 fue ejecutado y dejo evidencia bloqueada, no exitosa. El navegador no pudo abrir `http://localhost:5173/` por `net::ERR_CONNECTION_REFUSED`, las comprobaciones de puertos locales para `5173`, `5174` y `4000` no encontraron listeners, y `GET http://localhost:4000/api/health` rechazo conexion.

Por esa evidencia, el epic `proveedores-compras-recibidas` permanece en `TODO`. No se consideran validados los flujos farmaceuticos de proveedores, compras, recepcion, anulacion, permisos, consola ni requests funcionales. La accion siguiente es levantar o exponer el dev server local, confirmar salud backend y reintentar la validacion final antes de cerrar el epic.

## Final Outcome

Al cierre de este sprint:

- La validacion final queda documentada como bloqueada por frontend/backend locales inaccesibles durante el intento del ticket 02.
- El bloqueo del Sprint 07 queda contextualizado como antecedente confirmado nuevamente en Sprint 08, no como fallo funcional de proveedores o compras.
- El epic permanece en `TODO` porque no existe evidencia exitosa sobre proveedores, compras, recepcion, anulacion ni permisos.
- Accion siguiente concreta: levantar o exponer frontend y backend locales, confirmar `GET /api/health` y repetir la validacion final antes de cambiar el epic a `DONE`.

## Execution Order

### INFRA

1. [01-infra-reconcile-final-validation-preconditions.md](./01-infra-reconcile-final-validation-preconditions.md)
2. [02-infra-run-manual-qa-for-suppliers-purchases-closure.md](./02-infra-run-manual-qa-for-suppliers-purchases-closure.md)
3. [03-infra-close-epic-evidence-after-successful-validation.md](./03-infra-close-epic-evidence-after-successful-validation.md)
4. [04-infra-clean-up-closure-validation-references.md](./04-infra-clean-up-closure-validation-references.md)

## Sprint Rule

Este sprint existe para resolver o, si el entorno vuelve a impedirlo, documentar sin ambiguedad el bloqueo de cierre registrado en el Sprint 07: la validacion final no pudo ejecutarse porque frontend y backend no estaban accesibles. Debe validar los flujos ya implementados de proveedores y compras recibidas con el dev server local disponible, documentar evidencia concreta y cerrar el epic solo si la validacion pasa. No agrega nuevas reglas de negocio, nuevas pantallas, SIAT, pagos a proveedores, cuentas por pagar, kardex visual, stock por lote, POS, reportes ni refactors amplios.
