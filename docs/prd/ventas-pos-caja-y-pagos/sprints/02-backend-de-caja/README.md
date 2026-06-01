# Sprint 02 - Backend de Caja

## Goal

Implementar la operacion backend de caja para abrir sesion, consultar caja actual, cerrar caja propia o ajena, calcular esperado y diferencia, auditar acciones y exponer los endpoints minimos antes de integrar ventas POS.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- Vendedor, admin y superadmin pueden abrir una sola caja propia con monto inicial valido y consultar su caja actual.
- Vendedor puede cerrar su caja y admin/superadmin pueden cerrar caja ajena con monto contado, diferencia calculada y auditoria.
- Las reglas de caja quedan cubiertas por pruebas automatizadas y documentacion OpenAPI minima, sin implementar todavia venta, pago, FEFO o UI.

## Execution Order

### BACKEND

1. [01-backend-implement-cash-session-domain-rules.md](./01-backend-implement-cash-session-domain-rules.md)
2. [02-backend-add-cash-session-api-and-authorization.md](./02-backend-add-cash-session-api-and-authorization.md)
3. [03-backend-cover-cash-session-domain-rules.md](./03-backend-cover-cash-session-domain-rules.md)

### INFRA

4. [04-infra-document-cash-session-openapi-and-integration-wiring.md](./04-infra-document-cash-session-openapi-and-integration-wiring.md)
5. [05-infra-clean-up-touched-code-and-references.md](./05-infra-clean-up-touched-code-and-references.md)
6. [06-infra-run-validation-guardrails-on-affected-areas.md](./06-infra-run-validation-guardrails-on-affected-areas.md)

## Sprint Rule

Este sprint implementa solamente el backend de caja: apertura, caja actual, cierre propio, cierre ajeno, calculos de esperado/diferencia, autorizacion, auditoria, pruebas automatizadas y documentacion OpenAPI minima. No implementa venta POS, pago efectivo, FEFO, anulacion de ventas, carritos pendientes, UI, navegacion ni documentacion final de tesis.
