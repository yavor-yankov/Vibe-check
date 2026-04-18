export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
}

export interface Competitor {
  title: string;
  url: string;
  snippet: string;
}

export interface Scores {
  viability: number;
  niche: number;
  problem: number;
  differentiation: number;
  overall: number;
}

export interface TechStackSuggestion {
  frontend: string[];
  backend: string[];
  database: string[];
  ai_ml?: string[];
  infra: string[];
  keyLibraries: string[];
}

export interface RoadmapStep {
  title: string;
  detail: string;
  estimate: string;
}

export interface AnalysisReport {
  summary: string;
  verdict: "build_it" | "iterate" | "rethink" | "skip";
  verdictLabel: string;
  scores: Scores;
  strengths: string[];
  risks: string[];
  uniqueAngles: string[];
  techStack: TechStackSuggestion;
  roadmap: RoadmapStep[];
  mvpScope: string[];
}

export type WizardStage = "intro" | "interview" | "scanning" | "report";

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  stage: WizardStage;
  messages: ChatMessage[];
  competitors: Competitor[];
  report: AnalysisReport | null;
  ideaSummary?: string;
}
