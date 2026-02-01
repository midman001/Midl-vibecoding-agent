import { GitHubClient } from "./github-client.js";
import { SearchTermExtractor } from "./term-extractor.js";
import { SearchResult, SearchOptions } from "../types/search-types.js";

export class IssueSearcher {
  private client: GitHubClient;
  private extractor: SearchTermExtractor;

  constructor(deps?: {
    client?: GitHubClient;
    extractor?: SearchTermExtractor;
  }) {
    this.client = deps?.client ?? new GitHubClient({});
    this.extractor = deps?.extractor ?? new SearchTermExtractor();
  }

  async search(
    description: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    const timeoutMs = options?.timeoutMs ?? 5000;
    const limit = options?.limit ?? 5;
    const includeClosedIssues = options?.includeClosedIssues ?? true;

    const terms = this.extractor.extractTerms(description);
    if (terms.length === 0) {
      return [];
    }

    const query = this.extractor.buildSearchQuery(terms);

    try {
      const issues = await Promise.race([
        this.client.searchIssues(query, { limit, includeClosedIssues }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Search timed out")), timeoutMs)
        ),
      ]);

      return issues.map((issue) => ({
        issue,
        similarityScore: 0,
      }));
    } catch (error) {
      if (error instanceof Error && error.message === "Search timed out") {
        console.warn(
          `Search timed out after ${timeoutMs}ms for query: "${query}"`
        );
        return [];
      }
      throw error;
    }
  }
}
