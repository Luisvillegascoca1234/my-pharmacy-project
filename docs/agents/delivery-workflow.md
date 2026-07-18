# Flujo de entrega

El flujo de funcionalidades es:

```text
grilling -> to-spec -> to-tickets
-> TB-01 Backend -> TB-01 UI -> TB-01 Code Review
-> TB-02 Backend -> TB-02 UI -> TB-02 Code Review
-> ... -> Docs
```

QA se incorpora unicamente cuando el usuario lo autoriza de forma explicita para la funcionalidad correspondiente.

## Spec canonico

`grilling` resuelve las decisiones materiales. `to-spec` las sintetiza sin abrir otra entrevista. `to-tickets` lee solo el spec publicado y cada ticket enlaza de regreso a el.

## Tracer bullets

Cada tracer bullet entrega un comportamiento estrecho, completo y observable por el usuario mediante tres tickets secuenciales:

1. `BACKEND` implementa el comportamiento del servidor y los contratos compartidos necesarios.
2. `UI` implementa la experiencia en espanol y su integracion.
3. `CODE REVIEW` revisa y corrige el tracer bullet completo.

El Backend de TB-01 no tiene bloqueo. Todo ticket posterior depende del inmediatamente anterior. Los tracer bullets nunca se ejecutan en paralelo.

## Estados

Solo se usan `TODO` y `DONE`. Cada ticket nuevo comienza como `TODO` y pasa a `DONE` al satisfacer sus criterios de aceptacion. Siempre se trabaja el `TODO` disponible de menor numero.

## Autoridad correctiva

Code Review puede corregir backend, frontend, contratos compartidos y pruebas. No ejecuta QA visual.

Si el usuario autoriza QA, este se ejecuta despues del ultimo Code Review y su ticket constituye la autorizacion explicita para usar Computer Use, corregir defectos y repetir los recorridos afectados.

## Documentacion de usuario

La documentacion describe unicamente comportamiento validado y aprobado. Se redacta en espanol, utiliza terminologia farmaceutica especializada y no explica la organizacion interna del codigo.
