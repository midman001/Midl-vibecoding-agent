interface AttachmentFetcherOptions {
  fetchFn?: typeof fetch;
  ttlMs?: number;
  timeoutMs?: number;
}

interface CacheEntry {
  content: string;
  timestamp: number;
}

export class AttachmentFetcher {
  private fetchFn: typeof fetch;
  private ttlMs: number;
  private timeoutMs: number;
  private cache = new Map<number, CacheEntry>();

  constructor(options?: AttachmentFetcherOptions) {
    this.fetchFn = options?.fetchFn ?? globalThis.fetch;
    this.ttlMs = options?.ttlMs ?? 300_000;
    this.timeoutMs = options?.timeoutMs ?? 3_000;
  }

  extractAttachmentUrls(body: string): string[] {
    if (!body) return [];

    const urls: string[] = [];

    // Match user-attachments URLs (with or without file extension)
    const userAttachmentRegex = /https:\/\/github\.com\/user-attachments\/assets\/[^\s)]+/g;
    let match: RegExpExecArray | null;
    while ((match = userAttachmentRegex.exec(body)) !== null) {
      urls.push(match[0]);
    }

    // Match repo files URLs: https://github.com/<owner>/<repo>/files/<id>/<filename>
    const repoFilesRegex = /https:\/\/github\.com\/[^/]+\/[^/]+\/files\/[^\s)]+/g;
    while ((match = repoFilesRegex.exec(body)) !== null) {
      urls.push(match[0]);
    }

    return urls;
  }

  async fetchAttachmentContent(issueNumber: number, body: string): Promise<string> {
    if (!body) return "";

    const urls = this.extractAttachmentUrls(body);
    if (urls.length === 0) return "";

    // Check cache
    const cached = this.cache.get(issueNumber);
    if (cached && Date.now() - cached.timestamp < this.ttlMs) {
      return cached.content;
    }

    const contents: string[] = [];

    for (const url of urls) {
      try {
        const result = await Promise.race([
          this.fetchFn(url),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), this.timeoutMs)
          ),
        ]);

        if (!result.ok) {
          console.warn(`[AttachmentFetcher] Non-OK response for ${url}: ${result.status}`);
          continue;
        }

        const text = await result.text();
        contents.push(text);
      } catch (err) {
        console.warn(`[AttachmentFetcher] Failed to fetch ${url}:`, (err as Error).message);
      }
    }

    const content = contents.join("\n\n");
    this.cache.set(issueNumber, { content, timestamp: Date.now() });
    return content;
  }
}
