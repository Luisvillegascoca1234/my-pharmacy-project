import path from 'node:path'
import type { RunnerConfig, SprintSelectionResult } from '../types.js'

export function buildCodexPrompt(
  selection: SprintSelectionResult,
  config: RunnerConfig,
): string {
  if (!selection.selected) {
    throw new Error('Cannot build a Codex prompt without a selected ticket')
  }

  const ticket = selection.selected
  const ticketLabel = `${String(ticket.number).padStart(2, '0')} - ${ticket.title}`
  const lines = [
    'Ejecuta exactamente el ticket de sprint seleccionado a continuación dentro de este repositorio.',
    '',
    `Sprint: ${selection.sprintDir}`,
    `Ticket: ${ticketLabel}`,
    `Ticket path: ${ticket.path}`,
    `Category: ${ticket.category ?? 'UNKNOWN'}`,
    '',
    'Reglas operativas:',
    '- no selecciones otro ticket; este ya fue elegido por el runner',
    '- lee AGENTS.md y el ticket antes de editar',
    '- inspecciona el código real y reconcilia estados viejos de la documentación si hiciera falta',
    '- implementa el ticket completo dentro de este mismo turno',
    '- si descubres que el ticket ya estaba hecho, márcalo DONE y cierra la ejecución sin tomar otro ticket',
    '- al terminar una implementación real, actualiza el ticket a DONE en la documentación del sprint',
    '- no hagas QA manual ni pruebas de navegador salvo que el ticket o el operador lo pidan explícitamente',
    '- si ejecutas una validación técnica mínima como typecheck o build, reporta qué verificaste',
    '- mantén el trabajo dentro de este repositorio',
  ]

  if (selection.reason) {
    lines.push('', `Razón de selección: ${selection.reason}`)
  }

  if (selection.recommendation?.nextSkillPath) {
    lines.push(
      '',
      `Skill recomendado para esta tarea: ${selection.recommendation.nextSkillPath}`,
    )
  }

  if (config.prompt) {
    lines.push('', `Instrucciones extra del operador: ${config.prompt}`)
  }

  lines.push(
    '',
    'Cierre esperado:',
    '- resumen breve de cambios',
    '- validación ejecutada',
    '- riesgos o bloqueos restantes',
    '',
    `Referencia rápida del archivo: ${path.basename(ticket.path)}`,
  )

  return lines.join('\n')
}
