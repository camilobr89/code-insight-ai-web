export interface Analysis {
  id?: string;
  repoUrl: string;
  projectName: string;
  mainLanguage: string;
  framework: string;
  architecture: string;
  fileCount: number;
  summary: string;
  components: string[];
  recommendations: string[];
  risks: string[];
  evidence: string[];
  /** Diagrama de arquitectura inferido, en sintaxis Mermaid (flowchart). */
  diagram?: string;
  createdAt?: string;
  cached: boolean;
  source: 'AI' | 'HEURISTIC';
}

export interface AnalyzeRequest {
  repoUrl: string;
  forceRefresh?: boolean;
}
