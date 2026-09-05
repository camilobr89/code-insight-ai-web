import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalysisService } from './services/analysis.service';
import { Analysis } from './models/analysis.model';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly analysisService = inject(AnalysisService);

  protected readonly repoUrl = signal('https://github.com/spring-projects/spring-petclinic');
  protected readonly forceRefresh = signal(false);
  protected readonly result = signal<Analysis | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly history = signal<Analysis[]>([]);
  protected readonly historyLoading = signal(false);

  ngOnInit(): void {
    this.loadHistory();
  }

  analyze(): void {
    const url = this.repoUrl().trim();
    if (!url) {
      this.error.set('Ingresa una URL de repositorio Git.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.analysisService.analyze({ repoUrl: url, forceRefresh: this.forceRefresh() }).subscribe({
      next: (analysis) => {
        this.result.set(analysis);
        this.loading.set(false);
        this.loadHistory();
      },
      error: () => {
        this.error.set('No se pudo analizar el repositorio. Verifica que la API esté disponible.');
        this.loading.set(false);
      },
    });
  }

  viewFromHistory(analysis: Analysis): void {
    this.result.set(analysis);
    this.repoUrl.set(analysis.repoUrl);
    this.error.set(null);
  }

  deleteItem(id: number | undefined): void {
    if (id === undefined) {
      return;
    }
    this.analysisService.delete(id).subscribe({
      next: () => {
        this.history.update((items) => items.filter((item) => item.id !== id));
        if (this.result()?.id === id) {
          this.result.set(null);
        }
      },
    });
  }

  clearHistory(): void {
    this.analysisService.deleteAll().subscribe({
      next: () => {
        this.history.set([]);
        this.result.set(null);
      },
    });
  }

  private loadHistory(): void {
    this.historyLoading.set(true);
    this.analysisService.history().subscribe({
      next: (items) => {
        this.history.set(items);
        this.historyLoading.set(false);
      },
      error: () => this.historyLoading.set(false),
    });
  }
}
