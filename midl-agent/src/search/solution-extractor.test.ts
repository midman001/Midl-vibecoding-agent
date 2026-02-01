import { describe, it, expect } from "vitest";
import { SolutionExtractor } from "./solution-extractor.js";
import type {
  GitHubIssueResult,
  IssueComment,
} from "../types/search-types.js";

function makeComment(overrides: Partial<IssueComment> = {}): IssueComment {
  return {
    id: 1,
    author: "user1",
    body: "",
    createdAt: "2025-01-01T00:00:00Z",
    isAuthor: false,
    reactions: { totalCount: 0, plusOne: 0, heart: 0 },
    ...overrides,
  };
}

const issue: GitHubIssueResult = {
  number: 1,
  title: "Test issue",
  url: "https://github.com/test/repo/issues/1",
  status: "open",
  labels: [],
  comments: 0,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  body: "Test body",
  author: "user1",
};

describe("SolutionExtractor", () => {
  const extractor = new SolutionExtractor();

  describe("extract", () => {
    it("returns empty array when no comments provided", () => {
      expect(extractor.extract(issue, [])).toEqual([]);
    });

    it("skips comments with negative signals", () => {
      const comments = [
        makeComment({ body: "This fixed it but didn't work after restart" }),
      ];
      expect(extractor.extract(issue, comments)).toEqual([]);
    });

    it("skips comments without positive signals", () => {
      const comments = [makeComment({ body: "I have the same problem" })];
      expect(extractor.extract(issue, comments)).toEqual([]);
    });

    it("returns solution for comment with positive signal", () => {
      const comments = [
        makeComment({ body: "This fixed the issue for me" }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions).toHaveLength(1);
      expect(solutions[0].type).toBe("fix");
    });

    it("extracts code snippet from fenced code blocks", () => {
      const comments = [
        makeComment({
          body: "This fixed it:\n```ts\nimport { foo } from 'bar';\n```",
        }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions[0].codeSnippet).toBe("import { foo } from 'bar';");
    });

    it("returns solution without codeSnippet when no code block", () => {
      const comments = [
        makeComment({ body: "The fix is to update your dependency" }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions[0].codeSnippet).toBeUndefined();
    });

    it("truncates description to 200 chars with code blocks stripped", () => {
      const longText = "This fixed it. " + "A".repeat(250);
      const comments = [
        makeComment({
          body: longText + "\n```ts\ncode\n```",
        }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions[0].description.length).toBeLessThanOrEqual(200);
      expect(solutions[0].description).not.toContain("```");
    });
  });

  describe("classifyType", () => {
    it('returns "workaround" when body contains "workaround"', () => {
      const comments = [
        makeComment({ body: "As a workaround, this fixed the issue" }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions[0].type).toBe("workaround");
    });

    it('returns "config-change" when body contains "config"', () => {
      const comments = [
        makeComment({ body: "The fix is to change the config file" }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions[0].type).toBe("config-change");
    });

    it('returns "fix" as default type', () => {
      const comments = [
        makeComment({ body: "This fixed the issue completely" }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions[0].type).toBe("fix");
    });
  });

  describe("determineConfidence", () => {
    it('returns "confirmed" when isAuthor and body contains "this worked"', () => {
      const comments = [
        makeComment({
          body: "This fixed it and this worked perfectly",
          isAuthor: true,
        }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions[0].confidence).toBe("confirmed");
    });

    it('returns "confirmed" when reactions.plusOne >= 2', () => {
      const comments = [
        makeComment({
          body: "This fixed the problem",
          reactions: { totalCount: 3, plusOne: 2, heart: 1 },
        }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions[0].confidence).toBe("confirmed");
    });

    it('returns "suggested" otherwise', () => {
      const comments = [
        makeComment({
          body: "This fixed it for me",
          isAuthor: false,
          reactions: { totalCount: 0, plusOne: 0, heart: 0 },
        }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions[0].confidence).toBe("suggested");
    });
  });

  describe("extractContext", () => {
    it("extracts sdkVersion from @midl/core pattern", () => {
      const comments = [
        makeComment({
          body: "This fixed it after upgrading @midl/core 1.2.3",
        }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions[0].context.sdkVersion).toBe("1.2.3");
    });

    it("extracts network from body containing testnet", () => {
      const comments = [
        makeComment({
          body: "This fixed the testnet issue for me",
        }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions[0].context.network).toBe("testnet");
    });

    it("extracts methodName from body containing broadcastTransaction", () => {
      const comments = [
        makeComment({
          body: "This fixed the broadcastTransaction timeout",
        }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions[0].context.methodName).toBe("broadcastTransaction");
    });

    it("returns empty object when no context found", () => {
      const comments = [
        makeComment({ body: "This fixed it somehow" }),
      ];
      const solutions = extractor.extract(issue, comments);
      expect(solutions[0].context).toEqual({});
    });
  });
});
