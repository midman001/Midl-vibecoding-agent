const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "i", "my", "it", "this",
  "that", "when", "how", "do", "does", "did", "not", "no", "but", "or",
  "and", "to", "of", "in", "for", "on", "with", "at", "from", "have",
  "has", "had", "be", "been", "can", "will", "would", "should", "could",
  "get", "got",
]);

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
