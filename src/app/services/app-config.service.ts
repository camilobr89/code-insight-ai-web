import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Carga `config.json` en runtime. Hoy es un valor estático (`{"apiUrl":""}`, mismo
 * origen) porque CloudFront proxysea `/api/*` hacia el Load Balancer del backend —
 * no depende de ninguna IP/DNS del backend, así que no necesita reescribirse nunca.
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
        if (cfg && typeof cfg.apiUrl === 'string') {
          this._apiUrl = cfg.apiUrl;
        }
      }
    } catch (error) {
      console.warn('No se pudo cargar config.json, se usa la URL de API por defecto.', error);
    }
  }
}
