import { describe, it, expect, vi } from "vitest";
import { IssueCreator } from "./issue-creator.js";
import { BugReportGenerator } from "./bug-report-generator.js";
import type { BugReportDraft } from "./bug-report-generator.js";

function makeDraft(overrides: Partial<BugReportDraft> = {}): BugReportDraft {
  return {
    title: "Test bug",
    description: "Something broke",
    stepsToReproduce: "",
    expectedBehavior: "It works",
    actualBehavior: "It doesn't",
    environment: {},
    severity: "medium",
    ...overrides,
  };
}

function makeMockClient(overrides: Record<string, any> = {}) {
  return {
    owner: "midl-xyz",
    repo: "midl-js",
    createIssue: vi.fn().mockResolvedValue({
      number: 42,
      url: "https://github.com/midl-xyz/midl-js/issues/42",
    }),
    ...overrides,
  } as any;
}

describe("IssueCreator", () => {
  it("returns created=true with issue number/url on success", async () => {
    const client = makeMockClient();
    const creator = new IssueCreator({ client });
    const result = await creator.createFromDraft(makeDraft());

    expect(result.created).toBe(true);
    expect(result.issueNumber).toBe(42);
    expect(result.issueUrl).toBe(
      "https://github.com/midl-xyz/midl-js/issues/42"
    );
    expect(client.createIssue).toHaveBeenCalledOnce();
  });

  it("returns created=false with fallbackUrl on permission error", async () => {
    const client = makeMockClient({
      createIssue: vi
        .fn()
        .mockRejectedValue(new Error("Resource not accessible")),
    });
    const creator = new IssueCreator({
      client,
      reportGenerator: new BugReportGenerator(),
    });
    const result = await creator.createFromDraft(makeDraft());

    expect(result.created).toBe(false);
    expect(result.error).toContain("Resource not accessible");
    expect(result.fallbackUrl).toBeDefined();
  });

  it("fallbackUrl is a valid GitHub new issue URL", async () => {
    const client = makeMockClient({
      createIssue: vi.fn().mockRejectedValue(new Error("forbidden")),
    });
    const creator = new IssueCreator({
      client,
      reportGenerator: new BugReportGenerator(),
    });
    const result = await creator.createFromDraft(makeDraft());

    expect(result.fallbackUrl).toContain(
      "https://github.com/midl-xyz/midl-js/issues/new?"
    );
    expect(result.fallbackUrl).toContain("title=");
  });
});
