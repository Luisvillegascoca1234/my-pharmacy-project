# Monografía LaTeX

Esta carpeta contiene la estructura LaTeX para la monografía de Luis Enrique Villegas Coca, siguiendo los lineamientos de la Universidad de Aquino Bolivia.

## Instalacion recomendada en Windows

1. Instala MiKTeX desde https://miktex.org/download.
2. Instala Strawberry Perl desde https://strawberryperl.com/. Es necesario para ejecutar `latexmk`.
3. Durante la instalacion de MiKTeX, habilita la opcion para instalar paquetes faltantes automaticamente.
4. Cierra y vuelve a abrir PowerShell para actualizar el PATH.
5. Verifica la instalacion:

```powershell
pdflatex --version
latexmk --version
biber --version
perl --version
```

En este equipo se instalo MiKTeX con `winget` y tambien Strawberry Perl para que `latexmk` funcione en Windows.

## Paquetes LaTeX configurados

La plantilla esta preparada para monografia en espanol y graficos academicos:

- `babel` con idioma `spanish`.
- `biblatex` con estilo APA y `biber`.
- `tikz` y `pgfplots` para diagramas y graficos.
- `graphicx` para imagenes externas.
- `booktabs` y `longtable` para tablas.
- `amsmath` para formulas.

## Compilar el documento

Desde la raiz del proyecto:

```powershell
.\build-pdf.ps1
```

Tambien puedes limpiar los archivos generados antes de compilar:

```powershell
.\build-pdf.ps1 -Clean
```

Y puedes abrir el PDF automaticamente al finalizar:

```powershell
.\build-pdf.ps1 -Open
```

El PDF final se generara en:

```text
tesis\build\main.pdf
```

## Estructura

- `main.tex`: entrada principal del documento.
- `preamble.tex`: paquetes y configuracion general.
- `frontmatter/title-page.tex`: portada institucional con el logo de UDABOL.
- `chapters/01-introduction.tex`: capitulo I, introduccion.
- `chapters/02-conceptual-framework.tex`: capitulo II, marco conceptual.
- `chapters/03-case-study.tex`: capitulo III, caso de estudio.
- `chapters/04-conclusions.tex`: capitulo IV, conclusiones y recomendaciones.
- `appendices/additional-material.tex`: anexos.
- `references.bib`: bibliografia en formato BibLaTeX con estilo APA.
- `scripts/build.ps1`: compilacion local.

## Pendientes antes de entregar

1. Reemplazar `TÍTULO DEL TRABAJO` en `frontmatter/title-page.tex`.
2. Completar los objetivos especificos en `chapters/01-introduction.tex`.
3. Cargar las fuentes reales en `references.bib`.
4. Compilar con `.\build-pdf.ps1`.
