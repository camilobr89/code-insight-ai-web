import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
          flowchart: { curve: 'basis', htmlLabels: false },
        });
        mermaidInitialized = true;
      }
      const { svg } = await mermaid.render(`analysis-diagram-${++this.renderCount}`, definition);
      return this.sanitizer.bypassSecurityTrustHtml(svg);
    } catch {
      return null;
    }
  }
}
