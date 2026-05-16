---
name: thesis-writing
description: Apply the project's thesis writing guidelines for academic monograph drafting, revision, restructuring, bibliography, chapter planning, conclusions, recommendations, pharmaceutical-domain documentation, LaTeX/TikZ diagram placeholders, APA 7 references, and thesis text quality. Use whenever Codex creates, edits, reviews, expands, summarizes, or plans thesis content, monograph sections, Capitulo I-IV content, marco conceptual, caso de estudio, objetivos, justificacion, alcance, pruebas, costos, bibliografia, anexos, or any docs intended for the thesis under tesis-related files or project documentation.
---

# Thesis Writing

## Workflow

Before creating or changing thesis content, read `tesisguideline.md`.

Apply the referenced guideline as the academic source of truth:

- Write in Spanish with formal academic tone, third person, or impersonal construction.
- Keep the document understandable for readers outside both software engineering and the pharmaceutical sector.
- Use specialized pharmaceutical terminology when it improves precision, but define or contextualize it when a non-specialist reader may need support.
- Focus on high-level decisions, architecture, business rationale, and tactical strategy.
- Never write thesis content as a tutorial, setup log, implementation diary, installation guide, or step-by-step code walkthrough.
- Do not describe the internal code organization in thesis documentation.
- Prefer explanations of why decisions were made, what alternatives were considered, and how each decision supports the pharmacy-domain problem.
- When a diagram, scheme, or graph is useful, request it explicitly with this exact placeholder format: `[Insertar Diagrama generado en TikZ de LaTeX: descripcion detallada para que un lector no especialista lo entienda]`.
- Preserve the monograph structure required by the guideline: indices first, then Capitulo I, Capitulo II, Capitulo III, Capitulo IV, Bibliografia, and Anexos when applicable.
- In Capitulo I, include only: presentacion del tema e importancia, planteamiento del problema, formulacion del problema, objetivo general, 2 to 5 objetivos especificos, justificacion general, alcance y limitaciones.
- In Capitulo II, include only theory that supports decisions made in Capitulo III.
- For Capitulo II references, maintain the 60/40 rule: about 60% books and 40% official web pages.
- For technical books, use real sources from Apress, O'Reilly, Springer, or Packt. Do not invent sources.
- In Capitulo III, write from the perspective of a software architect: requirements engineering, analysis and design, development, testing strategy, and cost estimation.
- When justifying a selected stack or architecture, contrast it briefly with competitors and bias the comparison toward the selected project stack.
- In Capitulo III testing, discuss testing conceptually; do not run QA unless the user explicitly asks.
- In Capitulo IV, map each conclusion directly to a specific objective from Capitulo I.
- Use APA 7 for bibliography entries and keep every cited source represented in the bibliography.
- If a claim depends on current external source details or exact bibliographic metadata, verify it before presenting it as factual.

When existing thesis text conflicts with the guideline, prefer the smallest edit that brings the touched section back into compliance without rewriting unrelated sections.
