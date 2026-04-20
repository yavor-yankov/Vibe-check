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

export interface MarketSizeEstimate {
  range: string;
  tam?: string;
  sam?: string;
  som?: string;
  confidence: "low" | "medium" | "high";
  reasoning: string;
}

export interface FundingRaise {
  company: string;
  amount: string;
  year: string;
  stage?: string;
}

export interface FundingSignal {
  totalRaisedInSpace: string;
  notableRaises: FundingRaise[];
  summary: string;
}

export interface GraveyardEntry {
  name: string;
  year: string;
  reason: string;
}

export type BuildEffortBucket =
  | "weekend"
  | "1-2 weeks"
  | "1-3 months"
  | "3-6 months"
  | "6+ months";

export interface BuildEffortEstimate {
  bucket: BuildEffortBucket;
  teamSize: string;
  headlineRisk: string;
}

export interface RegulatoryFlag {
  domain: string;
  severity: "low" | "medium" | "high";
  note: string;
}

export type PricingModel =
  | "freemium"
  | "subscription"
  | "one-time"
  | "usage-based"
  | "free";

export interface PricingBenchmark {
  competitor: string;
  freeTier: string;
  paidTier: string;
  model: PricingModel;
}

export interface LeanCanvasEntry {
  section: string;
  content: string;
}

export interface NextStep {
  description: string;
  channel: string;
  metric: string;
  successCriteria: string;
  timeframe: string;
}

export interface ActionPlanWeek {
  week: string;
  goal: string;
  tasks: string[];
}

export interface ExpandedInsights {
  marketSize: MarketSizeEstimate;
  fundingSignal: FundingSignal;
  graveyard: GraveyardEntry[];
  buildEffort: BuildEffortEstimate;
  regulatoryFlags: RegulatoryFlag[];
  pricingBenchmarks: PricingBenchmark[];
  leanCanvas?: LeanCanvasEntry[];
  nextSteps?: NextStep[];
  actionPlan?: ActionPlanWeek[];
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
  // Optional for backward compat with reports generated before PR-K.
  // New analyses always populate this; old stored sessions may not have it.
  insights?: ExpandedInsights;
}

export interface RedTeamReport {
  verdict: string;
  reasons: string[];
  silentKillers: string[];
}

export interface Persona {
  name: string;
  age: number;
  role: string;
  quote: string;
  willingnessToPay: string;
  objection: string;
}

export type DomainExpertise = "none" | "some" | "deep";
export type TechnicalAbility = "non-technical" | "can-code" | "senior-engineer";
export type Runway = "side-project" | "3-months" | "6-months-plus";
export type TimeCommitment = "nights-weekends" | "part-time" | "full-time";
export type PriorExperience = "first-time" | "one-prior" | "serial";

export interface FounderProfile {
  domainExpertise: DomainExpertise;
  technicalAbility: TechnicalAbility;
  runway: Runway;
  timeCommitment: TimeCommitment;
  priorExperience: PriorExperience;
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
  founderProfile?: FounderProfile;
  redTeamReport?: RedTeamReport | null;
  // Monotonic counter bumped on every successful analyze/refine. Used by
  // runRedTeam to detect a concurrent refine and avoid merging a stale
  // red-team response onto a freshly re-scored report.
  reportGeneration?: number;
}
