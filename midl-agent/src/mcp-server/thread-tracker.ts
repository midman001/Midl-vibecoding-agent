/**
 * Thread Tracker for MCP Server
 *
 * Tracks recently created Discord forum threads to support:
 * - list_recent_threads tool (user's own recent posts)
 * - Duplicate checking by title search
 *
 * In-memory storage with 24-hour retention.
 */

/**
 * Record of a posted forum thread
 */
export interface ThreadRecord {
  threadId: string;
  threadUrl: string;
  title: string;
  createdAt: Date;
  apiKey: string;
}

export class ThreadTracker {
  private threads: ThreadRecord[] = [];
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly maxThreadsPerKey = 10;

  /**
   * Record a newly created thread.
   * Automatically prunes threads older than 24 hours.
   */
  recordThread(record: Omit<ThreadRecord, "createdAt">): void {
    // Prune old threads first
    this.pruneOldThreads();

    // Add new thread with current timestamp
    this.threads.push({
      ...record,
      createdAt: new Date(),
    });
  }

  /**
   * Get recent threads created by a specific API key.
   * Useful for users checking their own recent posts.
   *
   * @returns Up to maxThreadsPerKey most recent threads, sorted by createdAt descending
   */
  getRecentThreads(apiKey: string): ThreadRecord[] {
    this.pruneOldThreads();

    return this.threads
      .filter((t) => t.apiKey === apiKey)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, this.maxThreadsPerKey);
  }

  /**
   * Search for threads by title (case-insensitive substring match).
   * Useful for duplicate checking before posting.
   *
   * @param searchTitle Title substring to search for
   * @param limit Maximum number of results (default: 5)
   * @returns Matching threads across all users
   */
  getRecentThreadsByTitle(searchTitle: string, limit: number = 5): ThreadRecord[] {
    this.pruneOldThreads();

    const searchLower = searchTitle.toLowerCase();

    return this.threads
      .filter((t) => t.title.toLowerCase().includes(searchLower))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Remove threads older than maxAge (24 hours)
   */
  private pruneOldThreads(): void {
    const cutoff = Date.now() - this.maxAge;
    this.threads = this.threads.filter((t) => t.createdAt.getTime() > cutoff);
  }

  /**
   * Get total count of tracked threads (for testing/monitoring)
   */
  getThreadCount(): number {
    this.pruneOldThreads();
    return this.threads.length;
  }
}

/** Singleton instance for use by MCP server */
export const threadTracker = new ThreadTracker();
