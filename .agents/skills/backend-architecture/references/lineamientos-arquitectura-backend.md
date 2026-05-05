# Lineamientos de arquitectura backend

## 1. Referencia tomada

La referencia base es `Faeshal/nodets-layered-architecture`, un boilerplate de Node.js con TypeScript que organiza el backend con arquitectura por capas:

- `controllers`
- `services`
- `repositories`
- `entities`
- `routes`
- `middleware`
- `config`
- `utils`
- `interfaces`
- `tests`

El principio central del repo es separar tres responsabilidades:

- Controller layer: recibe requests HTTP, extrae datos y delega.
- Service layer: contiene reglas de negocio y orquestacion.
- Repository layer: concentra acceso a datos, consultas y ORM.

Para este proyecto se conserva el patron de capas, pero se adapta el acceso a datos a Prisma ORM y PostgreSQL. No se usara TypeORM ni entidades decoradas.

## 2. Decision para este proyecto

El backend sera un monolito modular con Express, TypeScript, Prisma y PostgreSQL.

La estructura debe favorecer:

- Separacion clara entre HTTP, negocio y persistencia.
- Modulos funcionales por dominio de farmacia.
- Prisma aislado en la capa de infraestructura y repositorios.
- Validaciones compartidas con Zod desde `packages`.
- Transacciones explicitas para compras, ventas, caja, inventario, devoluciones y facturacion.
- Auditoria y movimientos de inventario como parte obligatoria de los flujos de negocio.

## 3. Estructura recomendada

```text
backend/
  prisma/
    schema.prisma
    migrations/
    seed.ts
  src/
    app.ts
    server.ts
    config/
      env.ts
    infrastructure/
      prisma/
        prisma.client.ts
    common/
      errors/
      http/
      middleware/
      utils/
    modules/
      auth/
        auth.controller.ts
        auth.routes.ts
        auth.service.ts
        auth.repository.ts
        auth.types.ts
      users/
      roles/
      products/
        products.controller.ts
        products.routes.ts
        products.service.ts
        products.repository.ts
        products.types.ts
      units/
      suppliers/
      inventory/
        inventory.controller.ts
        inventory.routes.ts
        inventory.service.ts
        inventory.repository.ts
        inventory.types.ts
      purchases/
      sales/
      cash/
      billing/
      returns/
      audit/
      alerts/
      reports/
      exports/
    routes/
      index.ts
    tests/
```

Esta variante mantiene el espiritu del repo de referencia, pero evita carpetas globales enormes como `controllers/`, `services/` y `repositories/` cuando el dominio crezca. Cada modulo conserva su mini-stack controller -> service -> repository.

## 4. Responsabilidades por capa

### Routes

Responsabilidades:

- Declarar endpoints.
- Aplicar middleware especifico de la ruta.
- Conectar rutas con controllers.

No debe contener:

- Reglas de negocio.
- Consultas Prisma.
- Transformaciones complejas.

### Controllers

Responsabilidades:

- Leer `req.params`, `req.query`, `req.body` y usuario autenticado.
- Validar forma de entrada con schemas Zod.
- Llamar al service correspondiente.
- Mapear respuestas y errores a HTTP.

No debe contener:

- `prisma.product.findMany` ni llamadas directas al ORM.
- Calculos de inventario, margen, FEFO, caja o SIAT.
- Transacciones.
- Reglas de permisos complejas.

### Services

Responsabilidades:

- Contener reglas de negocio.
- Orquestar varios repositorios.
- Validar invariantes del dominio.
- Definir transacciones de negocio.
- Emitir errores de dominio.
- Coordinar auditoria y movimientos de inventario.

Ejemplos:

- Una venta debe descontar lotes FEFO, generar `inventory_movements`, crear pago y relacionar factura si aplica.
- Una compra recibida debe crear lotes y movimientos de entrada dentro de una misma transaccion.
- Una anulacion debe validar permisos, estado fiscal, caja e inventario antes de modificar datos.

No debe contener:

- `Request`, `Response` o tipos de Express.
- Codigos HTTP.
- Detalles de SQL o del schema Prisma que no sean necesarios para expresar la regla.

### Repositories

Responsabilidades:

- Encapsular Prisma Client.
- Ejecutar consultas.
- Mapear datos de persistencia a tipos usados por services.
- Recibir una transaccion Prisma cuando el service la necesite.

No debe contener:

- Reglas de negocio.
- Decisiones de permisos.
- Respuestas HTTP.
- Validacion de formularios.

Regla clave: si un cambio de ORM obliga a tocar controllers o services masivamente, la capa repository esta filtrando detalles.

## 5. Uso de Prisma

Prisma vive en:

```text
backend/prisma/schema.prisma
backend/src/infrastructure/prisma/prisma.client.ts
```

Los modelos Prisma representan persistencia. No reemplazan automaticamente los DTOs, schemas Zod ni tipos de negocio.

Lineamientos:

- Repositories importan Prisma Client.
- Services pueden abrir transacciones con Prisma, pero deben pasar el cliente transaccional a los repositories.
- Controllers no importan Prisma.
- El schema Prisma debe reflejar relaciones e integridad: usuarios, roles, productos, unidades, proveedores, compras, lotes, movimientos, ventas, pagos, facturas, auditoria y alertas.
- Los nombres de modelos, campos y enums deben estar en ingles.
- Las migraciones son la fuente historica de cambios de base de datos.

Patron de transaccion recomendado:

```ts
await prisma.$transaction(async (tx) => {
  const sale = await salesRepository.create(input, tx);
  await inventoryRepository.decreaseByFefo(items, tx);
  await auditRepository.create(event, tx);
  return sale;
});
```

## 6. Modulos del dominio

Los modulos iniciales deben mapearse al dominio ya definido en los lineamientos funcionales:

- `auth`
- `users`
- `roles`
- `products`
- `units`
- `suppliers`
- `purchases`
- `inventory`
- `sales`
- `cash`
- `billing`
- `returns`
- `audit`
- `alerts`
- `reports`
- `exports`

Cada modulo debe incluir solo los archivos que necesite. No es obligatorio crear controller para un modulo interno si no expone endpoints directamente.

## 7. Contratos compartidos

Los schemas Zod y tipos compartidos deben vivir en `packages`, no duplicarse en frontend y backend.

Estructura sugerida:

```text
packages/
  shared/
    src/
      schemas/
      types/
      constants/
      index.ts
```

Uso esperado:

- Frontend usa los schemas para formularios.
- Backend usa los mismos schemas para validar requests.
- Services reciben inputs ya validados o DTOs internos.

## 8. Reglas para inventario y ventas

El dominio de farmacia requiere reglas fuertes:

- Todo cambio de stock genera `inventory_movements`.
- El stock se controla por lote y vencimiento.
- Las salidas usan FEFO.
- Las cantidades se normalizan a unidad base.
- El costo se toma del lote afectado.
- Las ventas, compras recibidas, devoluciones y ajustes deben ejecutarse en transacciones.
- La auditoria acompana operaciones sensibles.

Estas reglas viven en services, no en controllers ni repositories.

## 9. Facturacion SIAT

La facturacion debe mantenerse separada de ventas.

Lineamientos:

- `sales` representa la operacion comercial.
- `billing` representa factura, estados SIAT, XML, CUIS, CUFD, anulaciones y respuestas del SIN.
- Una venta puede tener una factura, pero no son la misma entidad.
- Solo services de `billing` deben manejar reglas fiscales.
- Controllers de venta no deben construir XML ni hablar con SIAT directamente.

## 10. Tests

Prioridad de pruebas:

- Services con repositories falsos para reglas de negocio.
- Repositories con base de datos de prueba cuando las consultas sean criticas.
- Controllers con services simulados para validar HTTP.
- Flujos transaccionales de inventario, compras, ventas y devoluciones.

Casos minimos:

- FEFO descuenta el lote correcto.
- Compra recibida crea lote y movimiento.
- Venta crea salida, pago y auditoria.
- Anulacion respeta permisos y estado fiscal.
- Ajuste manual exige motivo y usuario autorizado.

## 11. Criterio de aceptacion arquitectonico

Una funcionalidad esta bien ubicada si cumple:

- El controller puede probarse sin base de datos.
- El service puede probarse sin Express.
- El repository puede cambiar consultas Prisma sin modificar HTTP.
- Una transaccion de negocio queda en un solo service.
- Las reglas del dominio son visibles en services.
- Prisma no se filtra hacia frontend, controllers ni paquetes compartidos.

## 12. Fuente

Referencia: https://github.com/Faeshal/nodets-layered-architecture

El repo de referencia usa TypeORM, pero su propio README indica que la capa repository es el punto que debe personalizarse cuando se usa otro ORM. Para este proyecto esa personalizacion es Prisma.
