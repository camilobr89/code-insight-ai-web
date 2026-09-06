import { inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { App } from './app';
import { environment } from '../environments/environment';
import { Analysis } from './models/analysis.model';
import { DiagramRendererService } from './services/diagram-renderer.service';

const HISTORY_URL = `${environment.apiUrl}/api/analyses`;

function mockAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    repoUrl: 'https://github.com/spring-projects/spring-petclinic',
    projectName: 'spring-petclinic',
    mainLanguage: 'Java',
    framework: 'Spring Boot',
    architecture: 'MVC',
    fileCount: 120,
    summary: 'API REST de ejemplo.',
    components: ['Controllers'],
    recommendations: ['Agregar documentación'],
    risks: ['Sin pruebas'],
    evidence: ['src/main/java/DemoController.java presente'],
    diagram: 'flowchart TD\n  Cliente --> Controllers --> BD[(Base de datos)]',
    cached: false,
    source: 'AI',
    ...overrides,
  };
}

/** Evita ejecutar el renderizado real de Mermaid (necesita APIs de DOM que jsdom no ofrece). */
class DiagramRendererStub {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly stubSvg = this.sanitizer.bypassSecurityTrustHtml('<svg data-stub="diagram"></svg>');

  render = vi.fn().mockImplementation(() => Promise.resolve(this.stubSvg));
}

async function flushMicrotasks(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DiagramRendererService, useClass: DiagramRendererStub },
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create the app and load history on init', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const req = httpMock.expectOne(HISTORY_URL);
    expect(req.request.method).toBe('GET');
    req.flush([]);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the loader section', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush([]);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('Code Insight AI');
    expect(compiled.querySelector('button')?.textContent).toContain('Analizar');
    const input = compiled.querySelector<HTMLInputElement>('#repo-url');
    expect(input?.value).toBe('');
    expect(input?.placeholder).toBe('https://github.com/usuario/proyecto');
  });

  it('should call the API and expose the result on analyze()', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as {
      analyze: () => void;
      result: () => Analysis | null;
    };

    (
      fixture.componentInstance as unknown as { repoUrl: { set: (value: string) => void } }
    ).repoUrl.set(mockAnalysis().repoUrl);
    component.analyze();

    const req = httpMock.expectOne(HISTORY_URL);
    expect(req.request.method).toBe('POST');
    req.flush(mockAnalysis());

    // analyze() success triggers a history reload.
    httpMock.expectOne(HISTORY_URL).flush([mockAnalysis()]);

    expect(component.result()?.projectName).toBe('spring-petclinic');
  });

  it('should render evidence and the cached badge when present', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as { analyze: () => void };

    // First detectChanges() fires ngOnInit -> loadHistory(); resolve it before anything else.
    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush([]);

    (
      fixture.componentInstance as unknown as { repoUrl: { set: (value: string) => void } }
    ).repoUrl.set(mockAnalysis().repoUrl);
    component.analyze();
    httpMock.expectOne(HISTORY_URL).flush(mockAnalysis({ cached: true }));
    httpMock.expectOne(HISTORY_URL).flush([]);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Desde caché');
    expect(compiled.textContent).toContain('src/main/java/DemoController.java presente');
  });

  it('should set an error when the API fails', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as {
      analyze: () => void;
      error: () => string | null;
    };

    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush([]);

    (
      fixture.componentInstance as unknown as { repoUrl: { set: (value: string) => void } }
    ).repoUrl.set(mockAnalysis().repoUrl);
    component.analyze();
    httpMock.expectOne(HISTORY_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.error()).toContain('No se pudo analizar');
    expect((fixture.nativeElement as HTMLElement).querySelector('.error')?.textContent).toContain(
      'No se pudo analizar',
    );
  });

  it('should show a validation error for an empty repo URL without calling the API', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as {
      repoUrl: { set: (v: string) => void };
      analyze: () => void;
      error: () => string | null;
    };

    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush([]);

    component.repoUrl.set('   ');
    component.analyze();

    expect(component.error()).toContain('Ingresa una URL');
    httpMock.expectNone(HISTORY_URL);
  });

  it('should render the non-cached badge when the analysis is fresh', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as { analyze: () => void };

    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush([]);

    (
      fixture.componentInstance as unknown as { repoUrl: { set: (value: string) => void } }
    ).repoUrl.set(mockAnalysis().repoUrl);
    component.analyze();
    httpMock.expectOne(HISTORY_URL).flush(mockAnalysis({ cached: false }));
    httpMock.expectOne(HISTORY_URL).flush([]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Análisis generado con IA',
    );
  });

  it('should render history items and load one on click', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as {
      result: () => Analysis | null;
      repoUrl: () => string;
    };

    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush([mockAnalysis({ id: 'a1' })]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const item = compiled.querySelector<HTMLButtonElement>('.history-item');
    expect(item).toBeTruthy();
    expect(compiled.textContent).toContain('spring-petclinic');

    item!.click();

    expect(component.result()?.projectName).toBe('spring-petclinic');
    expect(component.repoUrl()).toBe('https://github.com/spring-projects/spring-petclinic');
  });

  it('should stop the history loading indicator when the history request fails', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as { historyLoading: () => boolean };

    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush('boom', { status: 500, statusText: 'Server Error' });

    expect(component.historyLoading()).toBe(false);
  });

  it('should render the heuristic badge when the analysis is not AI-generated', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as { analyze: () => void };

    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush([]);

    (
      fixture.componentInstance as unknown as { repoUrl: { set: (value: string) => void } }
    ).repoUrl.set(mockAnalysis().repoUrl);
    component.analyze();
    httpMock.expectOne(HISTORY_URL).flush(mockAnalysis({ cached: false, source: 'HEURISTIC' }));
    httpMock.expectOne(HISTORY_URL).flush([]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Análisis heurístico');
  });

  it('should delete a history item', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as { history: () => Analysis[] };

    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush([mockAnalysis({ id: 'a1' })]);
    fixture.detectChanges();

    const deleteBtn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.delete-btn',
    );
    expect(deleteBtn).toBeTruthy();
    deleteBtn!.click();

    httpMock.expectOne({ url: `${HISTORY_URL}/a1`, method: 'DELETE' }).flush(null);

    expect(component.history()).toEqual([]);
  });

  it('should clear the whole history', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as { history: () => Analysis[] };

    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush([mockAnalysis({ id: 'a1' }), mockAnalysis({ id: 'a2' })]);
    fixture.detectChanges();

    const clearBtn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.clear-btn',
    );
    expect(clearBtn).toBeTruthy();
    clearBtn!.click();

    httpMock.expectOne({ url: HISTORY_URL, method: 'DELETE' }).flush(null);

    expect(component.history()).toEqual([]);
  });

  it('should render the architecture diagram returned with the analysis', async () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as {
      analyze: () => void;
      repoUrl: { set: (v: string) => void };
    };
    const renderer = TestBed.inject(DiagramRendererService) as unknown as DiagramRendererStub;

    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush([]);

    component.repoUrl.set(mockAnalysis().repoUrl);
    component.analyze();
    httpMock.expectOne(HISTORY_URL).flush(mockAnalysis());
    httpMock.expectOne(HISTORY_URL).flush([]);

    await flushMicrotasks();
    fixture.detectChanges();

    expect(renderer.render).toHaveBeenCalledWith(mockAnalysis().diagram);
    const viewport = (fixture.nativeElement as HTMLElement).querySelector('.diagram-viewport');
    expect(viewport?.innerHTML).toContain('data-stub="diagram"');
  });

  it('should clear the diagram when the current result is deleted', async () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as {
      analyze: () => void;
      repoUrl: { set: (v: string) => void };
      diagramSvg: () => SafeHtml | null;
    };

    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush([mockAnalysis({ id: 'a1' })]);
    fixture.detectChanges();

    component.repoUrl.set(mockAnalysis().repoUrl);
    component.analyze();
    httpMock.expectOne(HISTORY_URL).flush(mockAnalysis({ id: 'a1' }));
    httpMock.expectOne(HISTORY_URL).flush([mockAnalysis({ id: 'a1' })]);
    await flushMicrotasks();
    fixture.detectChanges();

    const deleteBtn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.delete-btn',
    );
    deleteBtn!.click();
    httpMock.expectOne({ url: `${HISTORY_URL}/a1`, method: 'DELETE' }).flush(null);

    expect(component.diagramSvg()).toBeNull();
  });

  it('should expand and close the diagram modal', async () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as {
      analyze: () => void;
      repoUrl: { set: (v: string) => void };
      diagramExpanded: { set: (v: boolean) => void };
    };

    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush([]);

    component.repoUrl.set(mockAnalysis().repoUrl);
    component.analyze();
    httpMock.expectOne(HISTORY_URL).flush(mockAnalysis());
    httpMock.expectOne(HISTORY_URL).flush([]);
    await flushMicrotasks();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.diagram-modal-backdrop')).toBeNull();

    root.querySelector<HTMLButtonElement>('.expand-btn')!.click();
    fixture.detectChanges();
    expect(root.querySelector('.diagram-modal-backdrop')).not.toBeNull();

    root.querySelector<HTMLButtonElement>('.modal-close-btn')!.click();
    fixture.detectChanges();
    expect(root.querySelector('.diagram-modal-backdrop')).toBeNull();

    component.diagramExpanded.set(true);
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(root.querySelector('.diagram-modal-backdrop')).toBeNull();
  });
});
