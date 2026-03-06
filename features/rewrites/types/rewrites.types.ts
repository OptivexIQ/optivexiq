export type RewriteType = "homepage" | "pricing";
export type RewriteExportFormat = "markdown" | "text" | "html" | "pdf";
export type RewriteGoal = "conversion" | "clarity" | "differentiation";
export type RewriteTone =
  | "neutral"
  | "confident"
  | "technical"
  | "direct"
  | "founder-led"
  | "enterprise";
export type RewriteLength = "short" | "standard" | "long";
export type RewriteEmphasis =
  | "clarity"
  | "differentiation"
  | "objection-handling"
  | "pricing-clarity"
  | "proof-credibility";

export type RewriteHypothesisType =
  | "positioning_shift"
  | "objection_attack"
  | "differentiation_emphasis"
  | "risk_reduction"
  | "authority_increase"
  | "clarity_simplification";

export type RewriteControlledVariable =
  | "audience"
  | "tone"
  | "structure"
  | "value_prop"
  | "cta_type"
  | "proof_points"
  | "pricing_frame";

export type RewriteTreatmentVariable =
  | "headline"
  | "primary_cta"
  | "objection_handling"
  | "differentiators"
  | "risk_reversal"
  | "proof_depth"
  | "pricing_anchor";

export type RewriteMinimumDeltaLevel = "light" | "moderate" | "strong";

export type RewriteStrategicContext = {
  target: RewriteType;
  goal: RewriteGoal;
  icp: string;
  focus: {
    differentiation: boolean;
    objection: boolean;
  };
};

export type RewriteStrategy = {
  tone: RewriteTone;
  length: RewriteLength;
  emphasis: RewriteEmphasis[];
  constraints?: string;
  audience?: string;
};

export type RewriteHypothesis = {
  type: RewriteHypothesisType;
  controlledVariables: RewriteControlledVariable[];
  treatmentVariables: RewriteTreatmentVariable[];
  successCriteria: string;
  minimumDeltaLevel: RewriteMinimumDeltaLevel;
};

export type RewriteGenerateRequest = {
  rewriteType: RewriteType;
  idempotencyKey: string;
  parentRequestRef?: string | null;
  websiteUrl?: string | null;
  content?: string | null;
  notes?: string | null;
  strategicContext?: RewriteStrategicContext;
  rewriteStrategy?: RewriteStrategy;
  hypothesis: RewriteHypothesis;
};

export type RewriteStreamOptions = {
  signal?: AbortSignal;
  onChunk?: (chunk: string) => void;
};

export type RewriteStreamResult = {
  content: string;
  requestId: string | null;
  requestRef: string | null;
  requestCreatedAt: string | null;
  idempotentReplay: boolean;
  experimentGroupId: string | null;
  parentRequestRef: string | null;
  controlRequestRef: string | null;
  versionNumber: number | null;
  deltaLexicalSimilarity: number | null;
  serverStage: string | null;
  serverOutcome: "completed" | "failed" | null;
};

export type RewriteSectionMapResult = {
  source: "deterministic" | "ai";
  sections: Array<{
    title: string;
    body: string;
  }>;
  warnings: string[];
  model: string | null;
};

export type RewriteStudioInitialData = {
  defaultWebsiteUrl: string;
  planLabel: string;
  profileIcpRole: string;
  defaultRewriteRequest?: Partial<RewriteGenerateRequest>;
  initialOutputMarkdown?: string;
  initialRequestRef?: string | null;
  initialStudioContext?: {
    useCustomIcp?: boolean;
    customIcp?: string;
    goal?: RewriteGoal;
    differentiationFocus?: boolean;
    objectionFocus?: boolean;
  };
  historyVersions?: Array<{
    requestRef: string;
    isControl?: boolean;
    controlRequestRef?: string | null;
    experimentGroupId?: string;
    parentRequestRef?: string | null;
    versionNumber?: number;
    isWinner?: boolean;
    winnerLabel?: string | null;
    winnerMarkedAt?: string | null;
    idempotencyKey?: string;
    strategyContext?: {
      target?: RewriteType;
      goal?: RewriteGoal;
      icp?: string;
      tone?: RewriteTone;
      length?: RewriteLength;
      emphasis?: RewriteEmphasis[];
      constraints?: string;
      audience?: string;
      focus?: {
        differentiation?: boolean;
        objection?: boolean;
      };
      schemaVersion?: number;
    };
    hypothesis?: RewriteHypothesis;
    promptVersion?: number;
    systemTemplateVersion?: number;
    modelTemperature?: number;
    deltaMetrics?: Record<string, unknown> | null;
    rewriteType: RewriteType;
    createdAt: string;
    outputMarkdown: string;
    websiteUrl?: string | null;
    sourceContent?: string | null;
    userNotes?: string;
    strategicContext?: {
      goal?: RewriteGoal;
      icp?: string;
      differentiationFocus?: boolean;
      objectionFocus?: boolean;
    };
    tone?: string;
    length?: string;
    emphasis?: string[];
    constraints?: string;
    audience?: string;
  }>;
};
