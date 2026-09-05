import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { App } from './app';
import { environment } from '../environments/environment';
import { Analysis } from './models/analysis.model';

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
    cached: false,
    ...overrides,
  };
}

describe('App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
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
    expect(compiled.querySelector('h1')?.textContent).toContain('Code Insight AI');
    expect(compiled.querySelector('button')?.textContent).toContain('Analizar');
  });

  it('should call the API and expose the result on analyze()', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as {
      analyze: () => void;
      result: () => Analysis | null;
    };

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

    component.analyze();
    httpMock.expectOne(HISTORY_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.error()).toContain('No se pudo analizar');
    expect((fixture.nativeElement as HTMLElement).querySelector('.error')?.textContent)
        .toContain('No se pudo analizar');
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

    component.analyze();
    httpMock.expectOne(HISTORY_URL).flush(mockAnalysis({ cached: false }));
    httpMock.expectOne(HISTORY_URL).flush([]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Análisis generado con IA');
  });

  it('should render history items and load one on click', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as {
      result: () => Analysis | null;
      repoUrl: () => string;
    };

    fixture.detectChanges();
    httpMock.expectOne(HISTORY_URL).flush([mockAnalysis({ id: 1 })]);
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
});
