# Sprint 05 - UI de Caja y POS Base

## Goal

Implementar la experiencia frontend base para caja actual, apertura de caja, busqueda POS, carrito local, cobro efectivo y comprobante interno, respetando las reglas operativas de mostrador y dejando pendientes, anulacion y supervision avanzada para el siguiente sprint.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- La pantalla de caja muestra la caja actual, permite apertura con monto inicial y cierre propio con monto contado cuando corresponde.
- La pantalla POS muestra estado de caja, busqueda de productos vendibles, stock disponible, proximo vencimiento y carrito editable antes del cobro.
- El cobro efectivo crea ventas confirmadas, calcula cambio, muestra comprobante interno y comunica errores principales sin reservar stock ni implementar pendientes visuales.

## Execution Order

### UI

1. [01-ui-build-cash-and-pos-data-modules.md](./01-ui-build-cash-and-pos-data-modules.md)
2. [02-ui-build-cash-page-for-current-session-open-and-close.md](./02-ui-build-cash-page-for-current-session-open-and-close.md)
3. [03-ui-build-pos-page-search-cart-and-cash-payment.md](./03-ui-build-pos-page-search-cart-and-cash-payment.md)
4. [04-ui-build-sale-receipt-and-error-states.md](./04-ui-build-sale-receipt-and-error-states.md)

### INFRA

5. [05-infra-wire-cash-pos-navigation-session-reset-and-route-titles.md](./05-infra-wire-cash-pos-navigation-session-reset-and-route-titles.md)
6. [06-infra-clean-up-touched-ui-and-references.md](./06-infra-clean-up-touched-ui-and-references.md)
7. [07-infra-run-validation-guardrails-on-affected-ui-areas.md](./07-infra-run-validation-guardrails-on-affected-ui-areas.md)

## Sprint Rule

Este sprint implementa solamente la experiencia base de mostrador para caja y POS: estado de caja, apertura, cierre propio simple, busqueda de productos vendibles, carrito activo, cobro en efectivo, cambio, comprobante interno y errores principales. No implementa todavia carritos pendientes visibles, anulacion desde UI, cierre de caja ajena, supervision administrativa, reportes, SIAT, QR, tarjeta, credito, descuentos ni documentacion final de tesis.
