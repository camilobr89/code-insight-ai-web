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
  createdAt?: string;
}

export interface AnalyzeRequest {
  repoUrl: string;
}
