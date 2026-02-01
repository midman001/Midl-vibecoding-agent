import { describe, it, expect } from "vitest";
import { SolutionExtractor } from "./solution-extractor.js";
import { GitHubIssueResult, IssueComment } from "../types/search-types.js";

function makeComment(overrides: Partial<IssueComment> = {}): IssueComment {
  return {
    id: 1,
    author: "helper",
    body: "",
    createdAt: "2025-01-01T00:00:00Z",
    isAuthor: false,
    reactions: { totalCount: 0, plusOne: 0, heart: 0 },
    ...overrides,
  };
}

function makeIssue(overrides: Partial<GitHubIssueResult> = {}): GitHubIssueResult {
  return {
    number: 1,
    title: "Test issue",
    url: "https://github.com/test/repo/issues/1",
    status: "open",
    labels: [],
    comments: 0,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    body: "Something is broken",
    author: "reporter",
    ...overrides,
  };
}

describe("SolutionExtractor", () => {
  const extractor = new SolutionExtractor();

  it("returns empty array when no comments", () => {
    const result = extractor.extract(makeIssue(), []);
    expect(result).toEqual([]);
  });

  it("returns empty array when no solutions found in comments", () => {
    const comments = [makeComment({ body: "I have the same issue" })];
    const result = extractor.extract(makeIssue(), comments);
    expect(result).toEqual([]);
  });

  it("extracts solution from comment with code block", () => {
    const comments = [
      makeComment({
        body: "This fixed it for me:\n```typescript\nconst tx = await broadcastTransaction({ network: 'testnet' });\n```",
      }),
    ];
    const result = extractor.extract(makeIssue(), comments);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("fix");
    expect(result[0].codeSnippet).toContain("broadcastTransaction");
  });

  it("detects positive signals: 'this worked', 'fixed', 'resolved'", () => {
    const comments = [
      makeComment({ body: "this worked for me: just update the config" }),
    ];
    const result = extractor.extract(makeIssue(), comments);
    expect(result.length).toBe(1);
    expect(result[0].confidence).toBe("suggested");
  });

  it("skips comments with negative signals", () => {
    const comments = [
      makeComment({ body: "I tried updating the config but it didn't work, still broken" }),
    ];
    const result = extractor.extract(makeIssue(), comments);
    expect(result).toEqual([]);
  });

  it("marks confirmed when reactions plusOne >= 2", () => {
    const comments = [
      makeComment({
        body: "Fixed it by upgrading @midl/react to 1.2.0",
        reactions: { totalCount: 3, plusOne: 3, heart: 0 },
      }),
    ];
    const result = extractor.extract(makeIssue(), comments);
    expect(result.length).toBe(1);
    expect(result[0].confidence).toBe("confirmed");
  });

  it("marks confirmed when issue author says 'this worked'", () => {
    const comments = [
      makeComment({
        body: "this worked! thanks!",
        isAuthor: true,
      }),
    ];
    const result = extractor.extract(makeIssue(), comments);
    expect(result.length).toBe(1);
    expect(result[0].confidence).toBe("confirmed");
  });

  it("extracts SDK version from context", () => {
    const comments = [
      makeComment({
        body: "Fixed in @midl/react 1.3.0 by updating the provider",
      }),
    ];
    const result = extractor.extract(makeIssue(), comments);
    expect(result.length).toBe(1);
    expect(result[0].context.sdkVersion).toBe("1.3.0");
  });

  it("extracts network from context", () => {
    const comments = [
      makeComment({
        body: "This fixed it on testnet: change the endpoint URL",
      }),
    ];
    const result = extractor.extract(makeIssue(), comments);
    expect(result[0].context.network).toBe("testnet");
  });

  it("extracts method name from context", () => {
    const comments = [
      makeComment({
        body: "The fix is to call broadcastTransaction with the correct params",
      }),
    ];
    const result = extractor.extract(makeIssue(), comments);
    expect(result[0].context.methodName).toBe("broadcastTransaction");
  });

  it("classifies config-change type", () => {
    const comments = [
      makeComment({
        body: "Fixed by changing the config setting to enable testnet",
      }),
    ];
    const result = extractor.extract(makeIssue(), comments);
    expect(result[0].type).toBe("config-change");
  });

  it("classifies workaround type", () => {
    const comments = [
      makeComment({
        body: "As a workaround, you can use the alternative API endpoint",
      }),
    ];
    const result = extractor.extract(makeIssue(), comments);
    expect(result[0].type).toBe("workaround");
  });
});
