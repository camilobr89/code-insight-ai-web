import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

let mermaidInitialized = false;

/** Renderiza el diagrama Mermaid que devuelve la API a SVG seguro para insertar en el DOM. */
@Injectable({ providedIn: 'root' })
export class DiagramRendererService {
  private readonly sanitizer = inject(DomSanitizer);
  private renderCount = 0;

  async render(definition: string): Promise<SafeHtml | null> {
    if (!definition?.trim()) {
      return null;
    }
    try {
      // Carga perezosa: mermaid pesa ~900kB, solo hace falta al mostrar un diagrama.
      const { default: mermaid } = await import('mermaid');
      if (!mermaidInitialized) {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          // Raíz, no anidado en `flowchart`: fuerza <text> SVG puro en vez de
          // <foreignObject>, que el perfil svg de DOMPurify elimina.
          htmlLabels: false,
          themeVariables: {
            primaryColor: '#eaf7f2',
            primaryTextColor: '#243b39',
            primaryBorderColor: '#16735d',
            lineColor: '#5c9174',
            secondaryColor: '#f6f8f6',
            secondaryBorderColor: '#dde9e5',
            tertiaryColor: '#ffffff',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: '12px',
          },
          // useMaxWidth:false evita que mermaid encoja el SVG para caber en el
          // contenedor; `.diagram-viewport` hace scroll cuando no cabe.
          // wrappingWidth alto evita que las etiquetas se partan en varias líneas.
          flowchart: { curve: 'basis', useMaxWidth: false, wrappingWidth: 1000 },
        });
        mermaidInitialized = true;
      }
      const { svg } = await mermaid.render(`analysis-diagram-${++this.renderCount}`, definition);

      // `definition` incluye texto extraído por la IA, así que se sanea el SVG
      // explícitamente con DOMPurify además del saneamiento interno de mermaid.
      const safeSvg = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
      return this.sanitizer.bypassSecurityTrustHtml(safeSvg); // NOSONAR typescript:S6268 — saneado arriba con DOMPurify.
    } catch {
      return null;
    }
  }
}
