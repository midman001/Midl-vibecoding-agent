export interface GitHubIssueResult {
  number: number;
  title: string;
  url: string;
  status: "open" | "closed";
  labels: string[];
  comments: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: string;
}

export interface GitHubClientConfig {
  token?: string;
  owner?: string;
  repo?: string;
  testingMode?: boolean;
}

export interface SearchResult {
  issue: GitHubIssueResult;
  similarityScore: number; // 0-1, populated later by scorer
}

export interface SearchOptions {
  limit?: number; // default 5
  includeClosedIssues?: boolean; // default true for duplicate detection
  timeoutMs?: number; // default 5000
}

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: Date;
}

export interface DuplicateDetectionResult {
  results: SearchResult[];
  duplicates: SearchResult[];
  hasDuplicates: boolean;
  searchTerms: string[];
}

export const PRODUCTION_REPO = { owner: "midl-xyz", repo: "midl-js" } as const;
export const TESTING_REPO = { owner: "midman001", repo: "agent-testing" } as const;
