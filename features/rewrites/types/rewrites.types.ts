export type RewriteType = "homepage" | "pricing";
export type RewriteExportFormat = "markdown" | "text" | "html";

export type RewriteGenerateRequest = {
  rewriteType: RewriteType;
  websiteUrl?: string | null;
  content?: string | null;
  notes?: string | null;
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
};
