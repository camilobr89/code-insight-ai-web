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
      // Carga perezosa: mermaid pesa ~900kB y solo hace falta cuando hay un
      // diagrama que mostrar, no en la carga inicial de la aplicación.
      const { default: mermaid } = await import('mermaid');
      if (!mermaidInitialized) {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          // A nivel raíz, no anidado en `flowchart`: así las etiquetas se renderizan
          // como <text>/<tspan> SVG puro en vez de <foreignObject> con HTML embebido.
          // Es necesario porque el perfil SVG de DOMPurify (más abajo) elimina
          // foreignObject por seguridad, y con él se perdía el texto de los nodos.
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
          flowchart: { curve: 'basis' },
        });
        mermaidInitialized = true;
      }
      const { svg } = await mermaid.render(`analysis-diagram-${++this.renderCount}`, definition);

      // `definition` viene de datos con influencia externa (nombres de componentes que
      // la IA extrae del repositorio analizado), así que no basta con confiar en el
      // saneamiento interno de mermaid (securityLevel: 'strict'). Se vuelve a sanear el
      // SVG explícitamente con DOMPurify, en modo SVG, antes de marcarlo como seguro para
      // Angular — dos pasadas de saneamiento independientes, no solo una.
      const safeSvg = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
      return this.sanitizer.bypassSecurityTrustHtml(safeSvg); // NOSONAR typescript:S6268 — saneado explícitamente arriba con DOMPurify.
    } catch {
      return null;
    }
  }
}
