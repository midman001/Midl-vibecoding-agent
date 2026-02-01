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
  token: string;
  owner: string;
  repo: string;
  testingMode?: boolean;
}

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: Date;
}

export const PRODUCTION_REPO = { owner: "midl-xyz", repo: "midl-js" } as const;
export const TESTING_REPO = { owner: "midman001", repo: "agent-testing" } as const;
