# Ticket 02 - Build Cash Page For Current Session Open And Close

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Construir la pantalla de caja para el usuario autenticado, enfocada en operar una caja propia: ver si existe caja abierta, abrir con monto inicial cero o mayor, revisar montos principales y cerrar ingresando monto contado final cuando corresponda.

## Scope

- Estado visible de caja: sin caja abierta, abierta y cerrada reciente cuando aplique.
- Apertura manual con monto inicial y validacion de monto no negativo.
- Resumen operativo: monto inicial, ventas cobradas, anulaciones reflejadas por backend, esperado, contado, diferencia y estado.
- Cierre propio con monto contado final y nota opcional si la API lo permite.
- Mensajes claros para permisos insuficientes, caja ya abierta, caja inexistente y errores de validacion.
- Acciones deshabilitadas mientras hay carga o una operacion en curso.

## Out Of Scope

- Cierre de caja ajena por admin/superadmin.
- Historial completo de cajas.
- Reportes de arqueo.
- Edicion o reapertura de caja cerrada.
- Anulacion de ventas desde la pantalla de caja.
- Verificacion manual de navegador.

## Acceptance Criteria

- Un vendedor sin caja abierta puede registrar monto inicial y abrir caja.
- Un vendedor con caja abierta ve los importes principales y el estado operativo.
- La apertura rechaza montos negativos antes de enviar la operacion.
- El cierre propio solicita monto contado final y presenta la diferencia devuelta por la API.
- La pantalla evita abrir una segunda caja si ya existe una caja abierta.
- Los estados de carga, vacio y error se muestran sin romper la navegacion.
