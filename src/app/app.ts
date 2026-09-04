import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalysisService } from './services/analysis.service';
import { Analysis } from './models/analysis.model';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly analysisService = inject(AnalysisService);

  protected readonly repoUrl = signal('https://github.com/spring-projects/spring-petclinic');
  protected readonly result = signal<Analysis | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  analyze(): void {
    const url = this.repoUrl().trim();
    if (!url) {
      this.error.set('Ingresa una URL de repositorio Git.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.analysisService.analyze({ repoUrl: url }).subscribe({
      next: (analysis) => {
        this.result.set(analysis);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo analizar el repositorio. Verifica que la API esté disponible.');
        this.loading.set(false);
      },
    });
  }
}
