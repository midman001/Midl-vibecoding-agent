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

export interface IssueComment {
  id: number;
  author: string;
  body: string;
  createdAt: string;
  isAuthor: boolean; // comment author === issue author
  reactions: { totalCount: number; plusOne: number; heart: number };
}

export interface Solution {
  type: "fix" | "workaround" | "config-change";
  description: string;
  codeSnippet?: string;
  sourceComment: IssueComment;
  confidence: "confirmed" | "suggested"; // confirmed = maintainer or positive reactions
  context: {
    sdkVersion?: string;
    network?: string;
    methodName?: string;
    errorMessage?: string;
  };
}

export interface ApplicabilityResult {
  solution: Solution;
  score: number; // 0-1
  level: "very likely" | "might help" | "probably not relevant";
  reasons: string[]; // why this score
}

export interface UserContext {
  errorMessage?: string;
  sdkVersion?: string;
  network?: string;
  methodName?: string;
  description: string;
}

export interface SearchConfig {
  duplicateThreshold: number;
  maxResults: number;
  searchTimeoutMs: number;
  cacheTtlMs: number;
  applicabilityWeights: {
    errorMessage: number;
    sdkVersion: number;
    network: number;
    methodName: number;
    confirmedFix: number;
  };
}

export const PRODUCTION_REPO = { owner: "midl-xyz", repo: "midl-js" } as const;
export const TESTING_REPO = { owner: "midman001", repo: "agent-testing" } as const;
