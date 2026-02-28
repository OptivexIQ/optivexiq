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

export type RewriteGenerateRequest = {
  rewriteType: RewriteType;
  websiteUrl?: string | null;
  content?: string | null;
  notes?: string | null;
  strategicContext?: RewriteStrategicContext;
  rewriteStrategy?: RewriteStrategy;
};

export type RewriteStreamOptions = {
  signal?: AbortSignal;
  onChunk?: (chunk: string) => void;
};

export type RewriteStreamResult = {
  content: string;
  requestId: string | null;
  requestRef: string | null;
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
  }>;
};
