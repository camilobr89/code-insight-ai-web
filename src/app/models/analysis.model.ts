export interface Analysis {
  id?: number;
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
  createdAt?: string;
  cached: boolean;
  source: 'AI' | 'HEURISTIC';
}

export interface AnalyzeRequest {
  repoUrl: string;
  forceRefresh?: boolean;
}
