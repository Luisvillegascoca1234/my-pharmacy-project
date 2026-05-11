# Sprint Runner

App de consola con `Ink` que automatiza la ejecución de tickets de sprint usando `codex --yolo exec` por debajo.

## Uso

```bash
pnpm sprint
```

El runner detecta automáticamente la feature PRD activa cuando solo hay una con sprints pendientes en `docs/prd`.

Si alguna vez necesitas apuntar a algo específico:

```bash
pnpm sprint -- --prd-dir docs/prd/<feature-slug>
```

O a un sprint concreto:

```bash
pnpm sprint -- --sprint-dir docs/prd/<feature-slug>/sprints/04-<slug>
```

Desde el paquete interno también está disponible:

```bash
pnpm --filter @pharmacy-pos/sprint-runner runner
```

`--epic-dir` sigue funcionando como alias legacy de `--prd-dir`, pero los flujos nuevos deben usar `docs/prd/<feature-slug>`.

## Qué hace

- reutiliza el selector existente de `pick-next-sprint-task`
- toma el siguiente ticket desbloqueado
- lanza `codex --yolo exec` con un prompt construido para ese ticket
- cuando termina, vuelve a intentar selección después del intervalo configurado

## Opciones útiles

- `--category BACKEND`
- `--prompt "prioriza pruebas y no toques frontend"`
- `--poll-interval 45`
- `--once`
- `--paused`
