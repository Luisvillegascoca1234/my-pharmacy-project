# Ticket 01 - Implement Cash Session Domain Rules

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Implementar las reglas de negocio de caja para apertura, consulta de caja actual, cierre propio y cierre ajeno. El resultado debe permitir operar caja sin ventas todavia, dejando preparado el calculo futuro de ventas netas cuando se integre POS.

## Scope

- Apertura de caja por usuario autenticado.
- Consulta de caja abierta del usuario autenticado.
- Cierre de caja propia.
- Cierre de caja ajena por admin/superadmin.
- Calculo de monto esperado usando monto inicial y ventas netas disponibles.
- Calculo de diferencia entre monto contado y esperado.
- Generacion de correlativo interno de caja.
- Auditoria de apertura y cierre.
- Mapeo a `CashSessionSchema` y `CurrentCashSessionSchema`.

## Out Of Scope

- Venta POS, pago efectivo, FEFO y margen.
- Anulacion de venta o impacto de anulaciones en caja.
- Carritos pendientes.
- Pantallas de apertura o cierre de caja.
- Reapertura de caja cerrada.
- Reportes historicos avanzados de caja.

## Acceptance Criteria

- Abrir caja exige usuario autenticado activo.
- Abrir caja permite `initialAmount = 0` y rechaza montos negativos desde el contrato compartido.
- Abrir caja rechaza una segunda caja abierta para el mismo usuario con error de conflicto.
- Abrir caja genera `correlativeCode` global legible con formato coherente al PRD.
- Caja actual devuelve `isOpen = false` cuando no hay sesion abierta y `isOpen = true` con detalle cuando existe.
- Cerrar caja propia exige que la caja exista, este `open` y pertenezca al usuario cuando el actor no es admin/superadmin.
- Admin y superadmin pueden cerrar caja ajena y quedan registrados como `closedByUser`.
- Cerrar caja calcula `expectedAmount`, `countedAmount` y `differenceAmount`.
- Cerrar caja permite diferencias positivas, negativas o cero.
- Una caja cerrada no puede cerrarse de nuevo.
- Apertura y cierre crean auditoria con actor, entidad y metadata suficiente para supervision.
