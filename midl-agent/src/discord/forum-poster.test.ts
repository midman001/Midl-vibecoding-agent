import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForumPoster } from "./forum-poster.js";
import type { ForumPostOptions } from "./types.js";

function createMockDiscordClient(overrides?: { forumChannel?: unknown; config?: unknown }) {
  const mockThread = {
    id: "thread-123",
  };

  const mockForumChannel = overrides?.forumChannel ?? {
    threads: {
      create: vi.fn().mockResolvedValue(mockThread),
    },
  };

  const mockConfig = overrides?.config ?? {
    botToken: "test-token",
    guildId: "guild-456",
    forumChannelId: "channel-789",
  };

  return {
    getForumChannel: vi.fn().mockResolvedValue(mockForumChannel),
    getConfig: vi.fn().mockReturnValue(mockConfig),
    _mockThread: mockThread,
    _mockForumChannel: mockForumChannel,
  } as any;
}

function createOptions(overrides?: Partial<ForumPostOptions>): ForumPostOptions {
  return {
    title: "SDK crashes on wallet connect",
    summary: "The SDK throws an error when connecting to Xverse wallet",
    reportMarkdown: "# Diagnostic Report\n\nDetails here...",
    reportFilename: "diagnostic-report-2026-02-02.md",
    ...overrides,
  };
}

describe("ForumPoster", () => {
  let poster: ForumPoster;
  let mockClient: ReturnType<typeof createMockDiscordClient>;

  beforeEach(() => {
    mockClient = createMockDiscordClient();
    poster = new ForumPoster(mockClient);
  });

  describe("postReport", () => {
    it("creates thread with correct title, summary, and file attachment", async () => {
      const options = createOptions();
      const result = await poster.postReport(options);

      expect(result.threadId).toBe("thread-123");
      expect(result.threadUrl).toBe("https://discord.com/channels/guild-456/thread-123");

      const createCall = mockClient._mockForumChannel.threads.create;
      expect(createCall).toHaveBeenCalledOnce();

      const args = createCall.mock.calls[0][0];
      expect(args.name).toBe("SDK crashes on wallet connect");
      expect(args.message.content).toContain("Hey team!");
      expect(args.message.files).toHaveLength(1);
    });

    it("truncates title to 100 chars when too long", async () => {
      const longTitle = "A".repeat(150);
      const options = createOptions({ title: longTitle });
      await poster.postReport(options);

      const args = mockClient._mockForumChannel.threads.create.mock.calls[0][0];
      expect(args.name).toHaveLength(100);
      expect(args.name).toBe("A".repeat(100));
    });

    it("includes authorName in summary when provided", async () => {
      const options = createOptions({ authorName: "Alice" });
      await poster.postReport(options);

      const args = mockClient._mockForumChannel.threads.create.mock.calls[0][0];
      expect(args.message.content).toContain("Alice");
      expect(args.message.content).toContain("from **Alice**");
    });

    it("omits authorName mention when not provided", async () => {
      const options = createOptions();
      await poster.postReport(options);

      const args = mockClient._mockForumChannel.threads.create.mock.calls[0][0];
      expect(args.message.content).not.toContain("from **");
      expect(args.message.content).toContain("Hey team! Got a new bug report coming in.");
    });

    it("throws descriptive error when forum channel creation fails", async () => {
      const failChannel = {
        threads: {
          create: vi.fn().mockRejectedValue(new Error("Missing Permissions")),
        },
      };
      const client = createMockDiscordClient({ forumChannel: failChannel });
      const p = new ForumPoster(client);

      await expect(p.postReport(createOptions())).rejects.toThrow(
        "Failed to create forum thread: Missing Permissions"
      );
    });

    it("throws descriptive error when forum channel not found", async () => {
      mockClient.getForumChannel.mockRejectedValue(
        new Error("Channel channel-789 not found in guild guild-456.")
      );

      await expect(poster.postReport(createOptions())).rejects.toThrow(
        "Channel channel-789 not found"
      );
    });
  });

  describe("formatSummaryMessage", () => {
    it("has friendly tone - no corporate phrases", async () => {
      const msg = poster.formatSummaryMessage(createOptions());
      expect(msg).not.toContain("Please find attached");
      expect(msg).not.toContain("Enclosed herewith");
      expect(msg).not.toContain("Per your request");
      expect(msg).toContain("Hey team!");
    });

    it("includes author when provided", () => {
      const msg = poster.formatSummaryMessage(createOptions({ authorName: "Bob" }));
      expect(msg).toContain("from **Bob**");
    });

    it("includes title as overview", () => {
      const msg = poster.formatSummaryMessage(createOptions({ title: "Wallet connect crash" }));
      expect(msg).toContain("Wallet connect crash");
    });
  });
});
