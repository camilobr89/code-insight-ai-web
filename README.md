# Code Insight AI — Web (Angular)

Frontend Angular 21 del reto **Code Insight AI**. Permite pegar la URL de un
repositorio público de GitHub, lanzar el análisis contra la API y visualizar el
resultado, los hallazgos y el historial de análisis previos.

## Pantalla

1. **Analizar repositorio** — input de URL + botón, con opción de "forzar un
   análisis nuevo" (ignora la caché de la API y vuelve a consultar la IA).
2. **Resultado del análisis** — resumen funcional, tecnologías detectadas y
   arquitectura inferida, con un badge honesto según el origen del resultado:
   *desde caché*, *generado con IA* o *heurístico* (con la razón exacta si no se
   pudo usar IA — repo privado, URL no soportada, o fallo puntual de la llamada).
3. **Hallazgos** — componentes identificados, recomendaciones, riesgos y
   evidencias encontradas (rutas de archivo reales que sustentan el análisis).
4. **Histórico** — análisis previos, con borrado individual o total.

## Tecnologías

Angular 21 (standalone + signals, zoneless) · TypeScript · RxJS · Vitest (tests) · CSS.

## Ejecución local

```bash
npm install
npm start
# App en http://localhost:4200 — consume la API en http://localhost:8080
```

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

## Cómo se resuelve la URL de la API

Dos mecanismos, en este orden:

1. **Runtime (el que manda en producción):** `AppConfigService` hace `fetch('config.json')`
   al arrancar la app. Hoy ese archivo vale `{"apiUrl":""}` — una ruta relativa, porque
   en producción **CloudFront actúa de proxy** hacia el backend (`/api/*` → Application
   Load Balancer), así que no hace falta conocer ninguna IP ni dominio del backend; el
   navegador solo le habla a CloudFront, siempre por HTTPS.
2. **Build-time (solo como respaldo si `config.json` no cargara):** el pipeline
   reemplaza el placeholder `__API_URL__` de `src/environments/environment.prod.ts`
   con la variable de repositorio `API_URL` en tiempo de build.

## CI/CD

`.github/workflows/ci-cd.yml` invoca el reusable
`my-banking-app/ci-templates/.github/workflows/aws-angular-s3-ci-cd.yml`:

1. **En cada PR a `main`**: install + tests con cobertura + análisis SonarCloud +
   Quality Gate (cobertura mínima 80% en código nuevo).
2. **En push/merge a `main`**: build de producción → `aws s3 sync` (excluyendo
   `config.json`, que es propiedad exclusiva de este repo, no del pipeline del API)
   a **Amazon S3** → invalidación de **CloudFront**.

Variables de repositorio requeridas (GitHub → *Settings → Variables*): `API_URL`
(respaldo de build-time, ver arriba), `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`.
Secrets: `SONAR_TOKEN`, `AWS_ROLE_ARN`. Todo el detalle está en el repo `ci-templates`.

## Supuestos

- Hosting estático en S3 (privado, con Origin Access Control) + CloudFront (SPA).
- CloudFront también hace de proxy inverso hacia el backend para `/api/*`, evitando
  que el navegador bloquee la app por *mixed content* (página HTTPS llamando a un
  backend sin certificado propio).
- La app asume que la API expone CORS habilitado para el origen del sitio.
