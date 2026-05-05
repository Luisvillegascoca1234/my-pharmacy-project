# 06 - Catalogos base, productos y unidades

## Objetivo

Construir los catalogos que sostienen inventario, compras y ventas: categorias, unidades, conversiones y productos farmaceuticos con reglas de lote y vencimiento.

## Alcance

- Categorias de producto.
- Unidades de medida.
- Conversiones por producto.
- CRUD de productos.
- Reglas de producto relacionado con farmacia.
- Indicadores de medicamento, receta, lote y vencimiento.
- Auditoria de cambios criticos.

## Backend

Modulos recomendados:

```text
backend/src/modules/products/
backend/src/modules/units/
```

Endpoints minimos:

- `GET /api/product-categories`
- `POST /api/product-categories`
- `GET /api/units`
- `POST /api/units`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PATCH /api/products/:id`
- `PUT /api/products/:id/units`

Reglas:

- Producto debe tener unidad base.
- Todo producto inventariable exige lote y vencimiento.
- Codigo interno debe ser unico.
- Codigo de barras debe ser unico cuando exista.
- Precio de venta y costo no se mezclan: costo real vendra del lote.
- Cambios de precio o estado generan auditoria.

## Frontend

Modulos:

```text
frontend/src/modules/products/
frontend/src/modules/units/
```

Pantallas:

- Lista de productos.
- Formulario de producto.
- Editor de unidades equivalentes.
- Catalogos de categorias y unidades.

## Contratos compartidos

Schemas:

- `ProductSchema`
- `CreateProductSchema`
- `UpdateProductSchema`
- `UnitSchema`
- `ProductUnitSchema`
- `ProductCategorySchema`

## Verificacion

- Admin o superadmin crea categoria.
- Admin o superadmin crea unidad base.
- Admin o superadmin crea producto con lote y vencimiento obligatorios.
- Producto puede definir conversion: caja -> blister -> unidad base.
- Usuario seller solo consulta productos y stock cuando corresponda.

## Fuera de alcance

- Stock real.
- Compra recibida.
- Venta POS.
- Importacion masiva.
- Imagenes de producto.
