import { STOP_WORDS } from "./constants.js";

export class SearchTermExtractor {
  extractTerms(description: string): string[] {
    const lowered = description.toLowerCase();
    const cleaned = lowered.replace(/[^\w\s-]/g, " ");
    const words = cleaned.split(/\s+/).filter(Boolean);

    const filtered = words.filter(
      (w) => w.length >= 3 && !STOP_WORDS.has(w)
    );

    const unique = [...new Set(filtered)];

    // Longer words first (heuristic for specificity)
    unique.sort((a, b) => b.length - a.length);

    return unique.slice(0, 8);
  }

  buildSearchQuery(terms: string[]): string {
    const selected = terms.slice(0, 5);
    return selected.join(" ");
  }
}
