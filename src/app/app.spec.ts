import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { App } from './app';
import { environment } from '../environments/environment';
import { Analysis } from './models/analysis.model';

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

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the loader section', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
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

    const req = httpMock.expectOne(`${environment.apiUrl}/api/analyses`);
    expect(req.request.method).toBe('POST');

    const mock: Analysis = {
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
    };
    req.flush(mock);

    expect(component.result()?.projectName).toBe('spring-petclinic');
  });

  it('should set an error when the API fails', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as unknown as {
      analyze: () => void;
      error: () => string | null;
    };

    component.analyze();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/analyses`);
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(component.error()).toContain('No se pudo analizar');
  });
});
