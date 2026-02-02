import { describe, it, expect, vi, beforeEach } from "vitest";
import { createReportBugCommand } from "./report-bug.js";

function createMockInteraction(options: Record<string, string | null> = {}) {
  const defaults: Record<string, string | null> = {
    description: "Wallet connect crashes on mainnet",
    "error-message": null,
    "sdk-package": null,
    network: null,
    "your-name": null,
    ...options,
  };

  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    options: {
      getString: vi.fn((name: string, _required?: boolean) => defaults[name] ?? null),
    },
  } as any;
}

function createMockOrchestrator(overrides?: { diagnosticReport?: unknown }) {
  return {
    handleProblemReport: vi.fn().mockResolvedValue({
      reportDraft: null,
      formattedResponse: "Here is your diagnostic report.",
      diagnosticReport: overrides?.diagnosticReport ?? {
        markdown: "# Report\nDetails",
        sizeBytes: 100,
        sectionCount: 5,
      },
    }),
  } as any;
}

function createMockForumPoster() {
  return {
    postReport: vi.fn().mockResolvedValue({
      threadId: "thread-999",
      threadUrl: "https://discord.com/channels/guild-1/thread-999",
    }),
  } as any;
}

describe("report-bug command", () => {
  let mockOrchestrator: ReturnType<typeof createMockOrchestrator>;
  let mockForumPoster: ReturnType<typeof createMockForumPoster>;

  beforeEach(() => {
    mockOrchestrator = createMockOrchestrator();
    mockForumPoster = createMockForumPoster();
  });

  it("calls deferReply with ephemeral: true", async () => {
    const cmd = createReportBugCommand(mockOrchestrator, mockForumPoster);
    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
  });

  it("passes description to handleProblemReport", async () => {
    const cmd = createReportBugCommand(mockOrchestrator, mockForumPoster);
    const interaction = createMockInteraction({ description: "Something broke" });
    await cmd.execute(interaction);

    expect(mockOrchestrator.handleProblemReport).toHaveBeenCalledWith(
      "Something broke",
      expect.objectContaining({ userDescription: "Something broke" })
    );
  });

  it("calls forumPoster.postReport with correct title, markdown, and filename pattern", async () => {
    const cmd = createReportBugCommand(mockOrchestrator, mockForumPoster);
    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    expect(mockForumPoster.postReport).toHaveBeenCalledOnce();
    const args = mockForumPoster.postReport.mock.calls[0][0];
    expect(args.title).toBe("Wallet connect crashes on mainnet");
    expect(args.reportMarkdown).toBe("# Report\nDetails");
    expect(args.reportFilename).toMatch(/^diagnostic-report-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.md$/);
  });

  it("includes authorName when your-name option provided", async () => {
    const cmd = createReportBugCommand(mockOrchestrator, mockForumPoster);
    const interaction = createMockInteraction({ "your-name": "Alice" });
    await cmd.execute(interaction);

    const args = mockForumPoster.postReport.mock.calls[0][0];
    expect(args.authorName).toBe("Alice");
  });

  it("omits authorName when your-name option not provided", async () => {
    const cmd = createReportBugCommand(mockOrchestrator, mockForumPoster);
    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    const args = mockForumPoster.postReport.mock.calls[0][0];
    expect(args.authorName).toBeUndefined();
  });

  it("editReply contains thread URL on success", async () => {
    const cmd = createReportBugCommand(mockOrchestrator, mockForumPoster);
    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    const editArgs = interaction.editReply.mock.calls[0][0];
    expect(editArgs.embeds).toHaveLength(1);
    const embedJson = editArgs.embeds[0].toJSON();
    expect(embedJson.description).toContain("https://discord.com/channels/guild-1/thread-999");
  });

  it("editReply contains error message when postReport throws", async () => {
    mockForumPoster.postReport.mockRejectedValue(new Error("Missing Permissions"));
    const cmd = createReportBugCommand(mockOrchestrator, mockForumPoster);
    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    const editArgs = interaction.editReply.mock.calls[0][0];
    expect(editArgs.content).toContain("Missing Permissions");
  });

  it("builds DiagnosticContext with error-message when provided", async () => {
    const cmd = createReportBugCommand(mockOrchestrator, mockForumPoster);
    const interaction = createMockInteraction({ "error-message": "TypeError: foo is not a function" });
    await cmd.execute(interaction);

    const ctx = mockOrchestrator.handleProblemReport.mock.calls[0][1];
    expect(ctx.errorMessages).toEqual(["TypeError: foo is not a function"]);
  });

  it("builds DiagnosticContext with network when provided", async () => {
    const cmd = createReportBugCommand(mockOrchestrator, mockForumPoster);
    const interaction = createMockInteraction({ network: "testnet" });
    await cmd.execute(interaction);

    const ctx = mockOrchestrator.handleProblemReport.mock.calls[0][1];
    expect(ctx.environment.network).toBe("testnet");
  });

  it("falls back to text reply when no diagnosticReport", async () => {
    const orch = createMockOrchestrator({ diagnosticReport: undefined });
    // Override to return no diagnosticReport
    orch.handleProblemReport.mockResolvedValue({
      reportDraft: null,
      formattedResponse: "Fallback text response",
      diagnosticReport: undefined,
    });
    const cmd = createReportBugCommand(orch, mockForumPoster);
    const interaction = createMockInteraction();
    await cmd.execute(interaction);

    expect(mockForumPoster.postReport).not.toHaveBeenCalled();
    const editArgs = interaction.editReply.mock.calls[0][0];
    expect(editArgs.content).toBe("Fallback text response");
  });
});
