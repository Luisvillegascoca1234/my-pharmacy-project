# 05 - Superadmin configuracion global

## Objetivo

Crear un area administrativa para parametros globales y preparacion de facturacion SIAT, sin mezclar todavia la emision fiscal con ventas POS.

## Alcance

- Configuracion de datos de la farmacia.
- Parametros operativos globales.
- Configuracion inicial SIAT como datos persistidos.
- Permisos separados para ver y modificar configuracion.
- Auditoria de cambios.

## Backend

Modulos recomendados:

```text
backend/src/modules/settings/
backend/src/modules/billing/
```

Endpoints minimos:

- `GET /api/settings`
- `PATCH /api/settings`
- `GET /api/billing/siat/configuration`
- `PATCH /api/billing/siat/configuration`

Reglas:

- Solo superadmin modifica parametros globales.
- Admin puede ver algunos parametros si se decide habilitarlo.
- La configuracion SIAT vive en `billing`, no en `sales`.
- Cada cambio guarda datos anteriores y nuevos en auditoria.

## Configuraciones sugeridas

Farmacia:

- nombre comercial
- NIT
- direccion
- telefono
- moneda
- zona horaria

Operativas:

- dias para alerta de vencimiento
- stock minimo por defecto
- metodo de salida de inventario: FEFO fijo para V1
- pago efectivo habilitado
- QR marcado como futuro

SIAT preparado:

- modalidad
- ambiente
- punto de venta
- actividad economica
- documento sector
- CUIS actual
- CUFD actual

## Frontend

Modulo recomendado:

```text
frontend/src/modules/settings/
frontend/src/modules/billing/
```

Pantallas:

- Configuracion general.
- Configuracion fiscal SIAT.

## Verificacion

- Superadmin edita nombre y datos de farmacia.
- Superadmin guarda parametros SIAT iniciales.
- Usuario sin permiso recibe `403`.
- Auditoria registra cambios.
- Ventas todavia no dependen de SIAT real.

## Fuera de alcance

- Comunicacion real con servicios SIAT.
- Emision de facturas.
- Renovacion automatica CUFD/CUIS.
- Configuracion multi-sucursal.
