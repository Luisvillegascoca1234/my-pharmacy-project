# Ticket 03 - Document Suppliers OpenAPI And Integration Wiring

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 04

## Description

Actualizar la documentacion minima e integracion de soporte para que el backend de proveedores quede visible y consumible por clientes futuros sin adelantar la UI. Este ticket conecta los endpoints nuevos con OpenAPI y verifica que los exports/contratos compartidos ya creados sean suficientes para backend.

## Scope

- `backend/src/docs/openapi.ts`
- referencias a schemas compartidos de proveedores cuando correspondan
- tag o agrupacion OpenAPI para proveedores
- parametros `SupplierId`, query params `search`, `status`, `page`, `pageSize`
- responses documentadas para `401`, `403`, `404`, `409` y validacion `400`

## Out Of Scope

- OpenAPI de compras, inventario, recepcion o anulacion
- generacion automatica de cliente frontend
- cambios a contratos compartidos salvo que falte un export imprescindible para proveedores
- pruebas E2E o QA manual

## Acceptance Criteria

- OpenAPI incluye el tag de proveedores o una agrupacion equivalente coherente con el documento actual.
- `GET /suppliers`, `GET /suppliers/{id}`, `POST /suppliers` y `PATCH /suppliers/{id}` estan documentados con seguridad bearer.
- La respuesta paginada de lista documenta `data` y metadata de paginacion compatible con los contratos del sprint 01.
- Los schemas `Supplier`, `SupplierStatus`, `CreateSupplierRequest`, `UpdateSupplierRequest` y respuesta paginada quedan definidos o referenciados de forma consistente.
- La documentacion explicita que `seller` recibe `403` y que NIT duplicado devuelve conflicto `409`.
- No se documentan endpoints de compras ni inventario en este sprint.
