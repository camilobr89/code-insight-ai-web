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

    component.analyze();

    const req = httpMock.expectOne(HISTORY_URL);
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(component.error()).toContain('No se pudo analizar');
  });
});
