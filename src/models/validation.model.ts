export interface CriterionFeedback {
  met: boolean;
  feedback: string;
}

export interface InvestCriteria {
  independent: CriterionFeedback;
  negotiable: CriterionFeedback;
  valuable: CriterionFeedback;
  estimable: CriterionFeedback;
  small: CriterionFeedback;
  testable: CriterionFeedback;
  [key: string]: CriterionFeedback; // Index signature
}

export interface ValidationResult {
  validationType: 'basic';
  overallScore: number;
  overallFeedback: string;
  rewrittenStory?: string;
  invest: InvestCriteria;
  model?: string;
}

export interface AdvancedValidationResult extends Omit<ValidationResult, 'validationType'> {
  validationType: 'advanced';
  acceptanceCriteria: string; // Gherkin format as a single string with newlines
  potentialEdgeCases: string[];
  technicalConsiderations: string[];
  identifiedDependencies: string[];
}

export interface Risk {
  type: 'Técnico' | 'Negócio' | 'Usabilidade' | 'Compliance' | 'Rollout';
  severity?: 'baixa' | 'média' | 'alta';
  description: string;
  mitigationSuggestion: string;
}

export interface DevelopmentTask {
  name: string;
  responsibility: string;
  description: string;
  justification: string;
  estimate: string;
  technicalJustification: string;
}

export interface TestScenarios {
  e2e: string;
  integration: string;
  unit: string;
}

export interface RefinedStory {
  title: string;
  epicSuggestion: string;
  featureSuggestion: string;
  userPersona: string;
  businessNarrative: string;
  interfaceDetails: string;
  acceptanceCriteria: string;
  acceptanceCriteriaSummary: string;
  testScenarios: TestScenarios;
  storyEstimate: string;
  storyEstimateJustification: string;
  developmentTasks: DevelopmentTask[];
  tasksTotalEstimate: string;
  questions: string[];
  potentialEdgeCases: string[];
  technicalConsiderations: string[];
  identifiedDependencies: string[];
  riskAnalysis: Risk[];
  model?: string;
  sourceFile?: string;
  isLiteImport?: boolean;
  refinedByAI?: boolean;
}

export interface StrategicRefinementResult {
  validationType: 'strategic';
  divisionAnalysis?: string;
  refinedStories: RefinedStory[];
  model?: string;
}


export type AnyValidationResult = ValidationResult | AdvancedValidationResult | StrategicRefinementResult;

export interface HistoryItem {
  id: number;
  userStory: string;
  result: AnyValidationResult;
  timestamp: number;
  epicSuggestion?: string;
  featureSuggestion?: string;
  storyEstimate?: string;
  model?: string;
}

// -- Project Info Model --

export interface ProjectInfo {
  description: string;
  objective: string;
  targetUsers: string;
  stakeholders: string;
  techStack: string;
  constraints: string;
  notes: string;
  updatedAt: number;
}

export function createEmptyProjectInfo(): ProjectInfo {
  return {
    description: '',
    objective: '',
    targetUsers: '',
    stakeholders: '',
    techStack: '',
    constraints: '',
    notes: '',
    updatedAt: Date.now()
  };
}

// -- Backlog Models --

export interface BacklogItem extends RefinedStory {
  id: number;
  order: number;
}

export interface Backlog {
  projectName: string;
  items: BacklogItem[];
  info?: ProjectInfo;
}

// -- Backlog Analysis Models --

export interface StoryDependency {
  storyTitle: string;
  dependsOn: string[];
  externalDependencies: string[];
  notes: string;
}

export interface BacklogDependencyAnalysis {
  summary: string;
  criticalPath: string[];
  circularDependencies: string[][];
  storyDependencies: StoryDependency[];
  recommendations: string[];
}

export interface RiskHotspot {
  area: string;
  riskCount: number;
  topRisk: string;
  severity: 'baixa' | 'média' | 'alta';
}

export interface BacklogRiskAnalysis {
  summary: string;
  overallRiskLevel: 'baixo' | 'médio' | 'alto' | 'crítico';
  totalRisks: number;
  hotspots: RiskHotspot[];
  topRisks: { storyTitle: string; type: string; description: string; mitigation: string }[];
  recommendations: string[];
}

// -- Import Models --
export interface ExtractedBacklogItems {
  epicSuggestion: string;
  featureSuggestion: string;
  refinedStories: RefinedStory[];
}
