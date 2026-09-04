import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/** Carga `config.json` en runtime; el pipeline lo reescribe en S3 tras cada deploy del API. */
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
      // ignore, keep environment default
    }
  }
}
