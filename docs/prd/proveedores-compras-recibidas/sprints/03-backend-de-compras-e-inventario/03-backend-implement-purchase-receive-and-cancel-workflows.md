# Ticket 03 - Implement Purchase Receive And Cancel Workflows

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Implementar los workflows transaccionales de recepcion y anulacion de compras dentro del service de compras, coordinando validaciones de dominio, helpers de inventario, cambios de estado y auditoria. Este ticket convierte los borradores guardados en impacto real de inventario y permite revertir solo compras recibidas intactas.

## Scope

- `backend/src/modules/purchases/purchases.service.ts`
- `backend/src/modules/purchases/purchases.repository.ts`
- `backend/src/modules/inventory/*`
- transaccion de `receivePurchase`
- transaccion de `cancelPurchase`
- audit logs `PURCHASE_RECEIVED` y `PURCHASE_CANCELLED`
- errores de dominio para estados invalidos, items invalidos, expiracion vencida y capas consumidas

## Out Of Scope

- controllers, routes y autorizacion HTTP
- UI de `isDirty`; el backend solo recibe requests ya guardados
- stock visual, kardex visual y FEFO de ventas
- anulacion fiscal SIAT o pagos a proveedor
- pruebas completas de service, que quedan para el sprint de pruebas/backend y OpenAPI salvo smoke checks locales

## Acceptance Criteria

- `receivePurchase` devuelve `404` si la compra no existe y rechaza estados distintos de `draft`.
- Antes de recibir, se revalidan proveedor activo, productos activos y unidades configuradas para todos los items.
- Items inventariables exigen `batchNumber` normalizado y `expirationDate` igual o posterior al dia actual del servidor.
- Items no inventariables pueden recibirse sin lote ni vencimiento y no generan inventario.
- La recepcion ejecuta en una sola transaccion: validaciones finales, creacion de capas, movimientos, `status = received`, `receivedByUserId`, `receivedAt`, `receiveNotes` y auditoria.
- Si falla un item durante recepcion, no queda inventario parcial ni estado recibido.
- `cancelPurchase` exige `cancelReason` para compras `draft` y `received`.
- Anular una compra `draft` solo cambia `status = cancelled`, `cancelledAt`, `cancelReason` y auditoria; no crea movimientos.
- Anular una compra `received` valida capas intactas, crea movimientos inversos, cancela capas, cambia estado y registra auditoria dentro de una transaccion.
- Anular una compra `cancelled` se rechaza con error de dominio coherente.
