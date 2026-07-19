# Reejecución QA integral en Chrome

Fecha: 2026-07-18  
Entorno: desarrollo local (`http://localhost:5173`, documentación en `http://localhost:3001`)  
Navegador: Google Chrome controlado desde Codex  
Resultado: **APROBADO CON OBSERVACIONES**

## Resumen ejecutivo

Se completó el recorrido farmacéutico principal desde la interfaz de usuario en Chrome y se contrastó con la aplicación de documentación antes y durante la ejecución. No quedan defectos S1, S2 o S3 abiertos. La limitación de facturación fiscal real continúa correctamente delimitada: el sistema prepara comprobantes internos sin SIAT, CUF, CUFD funcional, QR fiscal ni envío al SIN.

La sesión de Chrome queda entregada en `/audit`, con los eventos recientes visibles para revisión.

## Evidencia del recorrido maestro

| Área | Evidencia de Chrome | Resultado |
| --- | --- | --- |
| Roles y acceso | Inicio de sesión efectivo como Vendedor, Administrador y Superadministrador; menús y rutas visibles según facultades fijas | APROBADO |
| Catálogos | Unidad `Dosis QA 0718` (`DQA`), categoría `Validación farmacéutica QA 0718`, proveedor `Proveedor QA Integral 0718` y producto `Ibuprofeno QA 400 mg` creados desde la interfaz | APROBADO |
| Compra y recepción | Compra `cmrqzsnqc002yudywz9yngesn` guardada primero como Borrador y recibida después; dos lotes, total Bs 126,25; modo de solo lectura posterior | APROBADO |
| Lotes de compra | `QA-LOT-A-20260718`: 10 DQA, costo Bs 8,25, vence 2027-01-01. `QA-LOT-B-20260718`: 5 DQA, costo Bs 8,75, vence 2027-06-01 | APROBADO |
| Kardex | Dos entradas `Compra recibida`, vinculadas al producto, lote, costo, cantidad y actor Superadministrador | APROBADO |
| Pendiente POS | `QA Chrome 0718` guardado y retomado; no reservó stock ni congeló precio; la interfaz exigió revalidación antes del cobro | APROBADO |
| Caja | `C-000001` (`cmrqyyyb4000kudyw35ylac83`): inicial Bs 0, esperado Bs 10, contado Bs 10, diferencia Bs 0 | APROBADO |
| Ventas | `V-000001`, `V-000002` y `V-000003`, cada una por Bs 5, con pago en efectivo y consumo FEFO de `LOTE-DEMO-001` | APROBADO |
| Anulación operativa | `V-000001` anulada con caja abierta; pago revertido, mismo lote repuesto y esperado de caja corregido | APROBADO |
| Devolución administrativa | `V-000002` devuelta totalmente después del cierre; devolución `cmrqzitv9002audywxj9lo8ak`; mismo lote repuesto sin modificar el cierre | APROBADO |
| Comprobante interno | `INV-000001` (`cmrqzjafp002iudyw15ka867n`) preparado para `V-000003`, marcado `No emitida` y luego cancelado con motivo | APROBADO |
| Aislamiento del comprobante | La cancelación de `INV-000001` no cambió la venta, el pago, la caja ni el stock; Paracetamol quedó en 99 UND | APROBADO |
| Reportes | Bruto Bs 15, anulación Bs 5, devolución Bs 5, neto Bs 5; 3 ventas, 1 anulada y 1 devuelta | APROBADO |
| Valuación final | Paracetamol: Bs 198,00; Ibuprofeno: Bs 126,25; total disponible: Bs 324,25 | APROBADO |
| CSV | `sales.csv` e `inventory-movements.csv` descargados; la exportación de movimientos se repitió después de recibir la compra | APROBADO |
| Auditoría | 29 eventos visibles; incluye compra creada/recibida, venta, anulación, devolución, caja, comprobante creado/cancelado y descargas CSV | APROBADO |

## Reconciliación de inventario

### Paracetamol 500 mg

- Saldo inicial: 100 UND.
- Venta `V-000001`: -1 UND; anulación: +1 UND.
- Venta `V-000002`: -1 UND; devolución: +1 UND.
- Venta `V-000003`: -1 UND.
- Cancelación del comprobante interno: 0 UND.
- Saldo final observado: **99 UND**.

### Ibuprofeno QA 400 mg

- Borrador: 0 DQA en inventario.
- Recepción lote A: +10 DQA a Bs 8,25.
- Recepción lote B: +5 DQA a Bs 8,75.
- Saldo final observado: **15 DQA**, valuado en **Bs 126,25**.

## Contraste con la documentación

Se abrieron y contrastaron las guías de primeros pasos, navegación, roles y facultades, unidades y categorías, productos, proveedores, compras, inventario por lote, movimientos, POS, caja, anulaciones y devoluciones, facturación preparada, reportes y exportaciones.

Reglas materiales confirmadas en la interfaz:

- proveedor activo antes de registrar el producto y la compra;
- borrador de compra sin impacto en stock;
- recepción como origen de lote y movimiento;
- salida FEFO y reposición al lote original;
- pendiente sin reserva de stock ni congelación de precio;
- anulación operativa solo con caja abierta;
- devolución administrativa total después del cierre;
- comprobante interno no tributario y sin impacto en inventario/caja;
- reportes con bruto, anulaciones, devoluciones y neto;
- exportaciones CSV auditadas.

### Inconsistencia documental corregida

`Primeros pasos` indicaba registrar Productos antes de Proveedores, aunque el producto exige proveedor. Se corrigió y verificó en Chrome el orden:

1. Unidades y categorías.
2. Proveedores.
3. Productos.

No quedan contradicciones materiales abiertas entre el manual y el comportamiento observado.

## Verificación automatizada final

- `pnpm typecheck`: APROBADO en shared, backend, frontend y documentación.
- `pnpm build`: APROBADO en shared, backend, frontend y documentación.
- Backend: **189/189** pruebas aprobadas.
- Frontend: **123/123** pruebas aprobadas.
- Total: **312/312** pruebas aprobadas.

## Defectos y observaciones

- Defectos abiertos S1/S2/S3: **0/0/0**.
- La inconsistencia documental detectada quedó cerrada.
- El build mantiene una observación S4: el bundle principal del frontend mide aproximadamente 1,10 MB minificado (283 kB gzip), por encima de la recomendación de Vite de 500 kB.
- Firefox no está instalado; la segunda comprobación de motor indicada por `qa.md` sigue como riesgo residual no bloqueante.
- La facturación fiscal SIAT real permanece fuera de alcance y está comunicada como tal en interfaz y documentación.

## Conclusión

El recorrido maestro, la trazabilidad por lote, la conciliación de caja, inventario, reportes y CSV, los permisos y la documentación pasan. La recomendación de liberación es **APROBADO CON OBSERVACIONES** únicamente por el tamaño del bundle y la ausencia de una pasada adicional en Firefox.
