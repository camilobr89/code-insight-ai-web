import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Analysis, AnalyzeRequest } from '../models/analysis.model';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  private get baseUrl(): string {
    return `${this.config.apiUrl}/api/analyses`;
  }

  analyze(request: AnalyzeRequest): Observable<Analysis> {
    return this.http.post<Analysis>(this.baseUrl, request);
  }

  history(): Observable<Analysis[]> {
    return this.http.get<Analysis[]>(this.baseUrl);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  deleteAll(): Observable<void> {
    return this.http.delete<void>(this.baseUrl);
  }
}
