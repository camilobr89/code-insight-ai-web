import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Carga la configuración de runtime desde `config.json` (servido junto a la app).
 *
 * El pipeline del API reescribe ese archivo en S3 tras cada despliegue con la URL
 * actual del backend, de modo que si la IP de la tarea Fargate cambia, el frontend
 * la toma automáticamente al recargar — sin necesidad de reconstruir el bundle.
 * Si el fetch falla (p. ej. en local), usa el valor de `environment` como fallback.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private _apiUrl = environment.apiUrl;

  get apiUrl(): string {
    return this._apiUrl;
  }

  async load(): Promise<void> {
    try {
      const res = await fetch('config.json', { cache: 'no-store' });
      if (res.ok) {
        const cfg = (await res.json()) as { apiUrl?: string };
        if (cfg?.apiUrl) {
          this._apiUrl = cfg.apiUrl;
        }
      }
    } catch {
      // Sin config.json disponible: se mantiene el fallback de environment.
    }
  }
}
