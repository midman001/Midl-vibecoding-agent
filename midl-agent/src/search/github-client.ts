import { Octokit } from "@octokit/rest";
import {
  GitHubClientConfig,
  GitHubIssueResult,
  IssueComment,
  RateLimitInfo,
  PRODUCTION_REPO,
  TESTING_REPO,
} from "../types/search-types.js";

export class GitHubClient {
  public octokit: Octokit;
  public readonly owner: string;
  public readonly repo: string;

  constructor(config: GitHubClientConfig, octokit?: Octokit) {
    if (!config.token || config.token.trim() === "") {
      console.warn(
        "No GitHub token provided. Using unauthenticated mode (60 requests/hour). Set GITHUB_TOKEN for better rate limits."
      );
      this.octokit = octokit ?? new Octokit();
    } else {
      this.octokit = octokit ?? new Octokit({ auth: config.token });
    }

    if (config.testingMode) {
      this.owner = TESTING_REPO.owner;
      this.repo = TESTING_REPO.repo;
    } else if (config.owner && config.repo) {
      this.owner = config.owner;
      this.repo = config.repo;
    } else {
      this.owner = PRODUCTION_REPO.owner;
      this.repo = PRODUCTION_REPO.repo;
    }
  }

  async searchIssues(
    query: string,
    options?: { limit?: number; includeClosedIssues?: boolean }
  ): Promise<GitHubIssueResult[]> {
    await this.checkRateLimit();

    const stateFilter = options?.includeClosedIssues ? "" : " is:open";
    const q = `${query} repo:${this.owner}/${this.repo} is:issue${stateFilter}`;
    const perPage = options?.limit ?? 5;

    try {
      const response = await this.octokit.rest.search.issuesAndPullRequests({
        q,
        per_page: perPage,
      });

      return response.data.items.map((item) => this.mapIssue(item));
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async getIssue(issueNumber: number): Promise<GitHubIssueResult> {
    await this.checkRateLimit();

    try {
      const response = await this.octokit.rest.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });

      return this.mapIssue(response.data);
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async getRateLimitInfo(): Promise<RateLimitInfo> {
    try {
      const response = await this.octokit.rest.rateLimit.get();
      const { remaining, limit, reset } = response.data.resources.search;
      return {
        remaining,
        limit,
        resetAt: new Date(reset * 1000),
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async getIssueComments(issueNumber: number): Promise<IssueComment[]> {
    await this.checkRateLimit();
    try {
      const response = await this.octokit.rest.issues.listComments({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        per_page: 50,
      });
      return response.data.map((comment) => ({
        id: comment.id,
        author: comment.user?.login ?? "unknown",
        body: comment.body ?? "",
        createdAt: comment.created_at,
        isAuthor: false, // caller sets this by comparing to issue author
        reactions: {
          totalCount: (comment as any).reactions?.total_count ?? 0,
          plusOne: (comment as any).reactions?.["+1"] ?? 0,
          heart: (comment as any).reactions?.heart ?? 0,
        },
      }));
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  private async checkRateLimit(): Promise<void> {
    const info = await this.getRateLimitInfo();

    if (info.remaining === 0) {
      throw new Error(
        `GitHub API rate limit exhausted. Resets at ${info.resetAt.toISOString()}. Please wait before retrying.`
      );
    }

    if (info.remaining < 100) {
      console.warn(
        `GitHub API rate limit low: ${info.remaining}/${info.limit} requests remaining. Resets at ${info.resetAt.toISOString()}`
      );
    }
  }

  private mapIssue(item: any): GitHubIssueResult {
    return {
      number: item.number,
      title: item.title,
      url: item.html_url,
      status: item.state === "open" ? "open" : "closed",
      labels: (item.labels || []).map((l: any) =>
        typeof l === "string" ? l : l.name ?? ""
      ),
      comments: item.comments ?? 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      body: item.body ?? "",
      author: item.user?.login ?? "unknown",
    };
  }

  private handleApiError(error: any): Error {
    const status = error?.status ?? error?.response?.status;

    if (status === 401) {
      return new Error(
        "GitHub authentication failed. Check your GITHUB_TOKEN."
      );
    }

    if (status === 403) {
      return new Error(
        "GitHub API rate limit exhausted or access forbidden. Check your token permissions."
      );
    }

    return new Error(
      `GitHub API error: ${status ?? "unknown"} ${error?.message ?? String(error)}`
    );
  }
}
