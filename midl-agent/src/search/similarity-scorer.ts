import { STOP_WORDS } from "./constants.js";
import type { GitHubIssueResult } from "../types/search-types.js";

export class SimilarityScorer {
  private tokenize(text: string): Set<string> {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
    return new Set(words);
  }

  score(description: string, issue: GitHubIssueResult): number {
    const descTokens = this.tokenize(description);
    const issueText = issue.title + " " + (issue.body ?? "");
    const issueTokens = this.tokenize(issueText);
    const titleTokens = this.tokenize(issue.title);

    if (descTokens.size === 0 || issueTokens.size === 0) return 0;

    // Jaccard similarity
    let intersection = 0;
    for (const word of descTokens) {
      if (issueTokens.has(word)) intersection++;
    }
    const union = new Set([...descTokens, ...issueTokens]).size;
    let score = union > 0 ? intersection / union : 0;

    // Title boost: if any description word appears in title, add 0.15
    let titleMatch = false;
    for (const word of descTokens) {
      if (titleTokens.has(word)) {
        titleMatch = true;
        break;
      }
    }
    if (titleMatch) score += 0.15;

    return Math.min(Math.max(score, 0), 1);
  }
}
