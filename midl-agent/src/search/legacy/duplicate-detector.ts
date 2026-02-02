import { IssueSearcher } from "./issue-searcher.js";
import { SimilarityScorer } from "./similarity-scorer.js";
import { AttachmentFetcher } from "./attachment-fetcher.js";
import type {
  SearchOptions,
  DuplicateDetectionResult,
} from "../types/search-types.js";

export class DuplicateDetector {
  private searcher: IssueSearcher;
  private scorer: SimilarityScorer;
  private fetcher?: AttachmentFetcher;
  private threshold: number;

  constructor(deps?: {
    searcher?: IssueSearcher;
    scorer?: SimilarityScorer;
    fetcher?: AttachmentFetcher;
    threshold?: number;
  }) {
    this.searcher = deps?.searcher ?? new IssueSearcher();
    this.scorer = deps?.scorer ?? new SimilarityScorer();
    this.fetcher = deps?.fetcher;
    this.threshold = deps?.threshold ?? 0.75;
  }

  async detect(
    description: string,
    options?: SearchOptions
  ): Promise<DuplicateDetectionResult> {
    const results = await this.searcher.search(description, options);

    for (const result of results) {
      let attachmentContent = "";
      if (this.fetcher) {
        attachmentContent = await this.fetcher.fetchAttachmentContent(
          result.issue.number,
          result.issue.body ?? ""
        );
      }
      result.similarityScore = this.scorer.score(description, result.issue, attachmentContent);
    }

    results.sort((a, b) => b.similarityScore - a.similarityScore);

    const duplicates = results.filter(
      (r) => r.similarityScore >= this.threshold
    );

    // Extract search terms from description for reporting
    const searchTerms = description
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    return {
      results,
      duplicates,
      hasDuplicates: duplicates.length > 0,
      searchTerms,
    };
  }

  formatResults(result: DuplicateDetectionResult): string {
    if (result.results.length === 0) {
      return "No related issues found.";
    }

    const lines: string[] = [
      `Found ${result.results.length} related issue${result.results.length === 1 ? "" : "s"}:`,
      "",
    ];

    for (const r of result.results) {
      const pct = Math.round(r.similarityScore * 100);
      const prefix =
        r.similarityScore >= this.threshold ? "[DUPLICATE] " : "";
      lines.push(
        `${prefix}#${r.issue.number} (${pct}% match) - ${r.issue.title}`
      );
      lines.push(`  ${r.issue.url}`);
      lines.push("");
    }

    return lines.join("\n").trimEnd();
  }
}

export type { DuplicateDetectionResult };
