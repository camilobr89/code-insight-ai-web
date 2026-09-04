# Code Insight AI — Web (Angular)

Frontend Angular 21 del reto **Code Insight AI**. Permite cargar una URL de repositorio,
lanzar el análisis contra la API y visualizar el resultado y los hallazgos.

## Pantalla

1. **Cargar repositorio** — input de URL Git + botón *Analizar*.
2. **Resultado del análisis** — resumen funcional, tecnologías y arquitectura inferida.
3. **Hallazgos** — componentes identificados, recomendaciones y riesgos.

## Tecnologías

Angular 21 (standalone + signals, zoneless) · TypeScript · RxJS · Vitest (tests) · CSS.

## Ejecución local

```bash
npm install
npm start
# App en http://localhost:4200 — consume la API en http://localhost:8080
```

> La URL de la API en desarrollo se define en `src/environments/environment.ts`.
> En producción se inyecta en tiempo de build (ver más abajo).

Pruebas + cobertura (Vitest, genera lcov para SonarCloud):

```bash
npm run test:ci
# Reporte: coverage/code-insight-ai-web/lcov.info
```

Build de producción:

```bash
npm run build -- --configuration production
# Salida: dist/code-insight-ai-web/browser
```

## Configuración de la API URL

- **Dev**: `src/environments/environment.ts` → `http://localhost:8080`.
- **Prod**: `src/environments/environment.prod.ts` contiene el placeholder `__API_URL__`,
  que el pipeline reemplaza con el valor de la variable `API_URL` durante el build.

## CI/CD

`.github/workflows/ci-cd.yml` invoca el reusable
`my-banking-app/ci-templates/.github/workflows/aws-angular-s3-ci-cd.yml`:

1. **En cada PR a `main`**: install + tests con cobertura + análisis SonarCloud + Quality Gate.
2. **En push/merge a `main`**: build de producción → `aws s3 sync` a **Amazon S3** →
   invalidación de **CloudFront**.

Variables de repositorio requeridas (GitHub → *Settings → Variables*):
`API_URL`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`.
Secrets: `SONAR_TOKEN`, `AWS_ROLE_ARN`. Todo el detalle está en el repo `ci-templates`.

## Supuestos

- Hosting estático en S3 + CloudFront (SPA).
- La app asume que la API expone CORS habilitado para el origen del sitio.
