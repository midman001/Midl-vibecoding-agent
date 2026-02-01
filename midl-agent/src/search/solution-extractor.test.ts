import { describe, it, expect, vi } from "vitest";
import { SolutionExtractor } from "./solution-extractor.js";
import { GitHubClient } from "./github-client.js";
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
    it("returns empty array when no comments provided", async () => {
      expect(await extractor.extract(issue, [])).toEqual([]);
    });

    it("skips comments with negative signals", async () => {
      const comments = [
        makeComment({ body: "This fixed it but didn't work after restart" }),
      ];
      expect(await extractor.extract(issue, comments)).toEqual([]);
    });

    it("skips comments without positive signals", async () => {
      const comments = [makeComment({ body: "I have the same problem" })];
      expect(await extractor.extract(issue, comments)).toEqual([]);
    });

    it("returns solution for comment with positive signal", async () => {
      const comments = [
        makeComment({ body: "This fixed the issue for me" }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions).toHaveLength(1);
      expect(solutions[0].type).toBe("fix");
      expect(solutions[0].isOfficial).toBe(false);
    });

    it("extracts code snippet from fenced code blocks", async () => {
      const comments = [
        makeComment({
          body: "This fixed it:\n```ts\nimport { foo } from 'bar';\n```",
        }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions[0].codeSnippet).toBe("import { foo } from 'bar';");
    });

    it("returns solution without codeSnippet when no code block", async () => {
      const comments = [
        makeComment({ body: "The fix is to update your dependency" }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions[0].codeSnippet).toBeUndefined();
    });

    it("truncates description to 200 chars with code blocks stripped", async () => {
      const longText = "This fixed it. " + "A".repeat(250);
      const comments = [
        makeComment({
          body: longText + "\n```ts\ncode\n```",
        }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions[0].description.length).toBeLessThanOrEqual(200);
      expect(solutions[0].description).not.toContain("```");
    });
  });

  describe("classifyType", () => {
    it('returns "workaround" when body contains "workaround"', async () => {
      const comments = [
        makeComment({ body: "As a workaround, this fixed the issue" }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions[0].type).toBe("workaround");
    });

    it('returns "config-change" when body contains "config"', async () => {
      const comments = [
        makeComment({ body: "The fix is to change the config file" }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions[0].type).toBe("config-change");
    });

    it('returns "fix" as default type', async () => {
      const comments = [
        makeComment({ body: "This fixed the issue completely" }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions[0].type).toBe("fix");
    });
  });

  describe("determineConfidence", () => {
    it('returns "confirmed" when isAuthor and body contains "this worked"', async () => {
      const comments = [
        makeComment({
          body: "This fixed it and this worked perfectly",
          isAuthor: true,
        }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions[0].confidence).toBe("confirmed");
    });

    it('returns "confirmed" when reactions.plusOne >= 2', async () => {
      const comments = [
        makeComment({
          body: "This fixed the problem",
          reactions: { totalCount: 3, plusOne: 2, heart: 1 },
        }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions[0].confidence).toBe("confirmed");
    });

    it('returns "suggested" otherwise', async () => {
      const comments = [
        makeComment({
          body: "This fixed it for me",
          isAuthor: false,
          reactions: { totalCount: 0, plusOne: 0, heart: 0 },
        }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions[0].confidence).toBe("suggested");
    });
  });

  describe("extractContext", () => {
    it("extracts sdkVersion from @midl/core pattern", async () => {
      const comments = [
        makeComment({
          body: "This fixed it after upgrading @midl/core 1.2.3",
        }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions[0].context.sdkVersion).toBe("1.2.3");
    });

    it("extracts network from body containing testnet", async () => {
      const comments = [
        makeComment({
          body: "This fixed the testnet issue for me",
        }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions[0].context.network).toBe("testnet");
    });

    it("extracts methodName from body containing broadcastTransaction", async () => {
      const comments = [
        makeComment({
          body: "This fixed the broadcastTransaction timeout",
        }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions[0].context.methodName).toBe("broadcastTransaction");
    });

    it("returns empty object when no context found", async () => {
      const comments = [
        makeComment({ body: "This fixed it somehow" }),
      ];
      const solutions = await extractor.extract(issue, comments);
      expect(solutions[0].context).toEqual({});
    });
  });

  describe("official solution classification", () => {
    it("marks solution as official when githubClient confirms org membership", async () => {
      const mockClient = {
        checkOrgMembership: vi.fn().mockResolvedValue(true),
      } as unknown as GitHubClient;

      const officialExtractor = new SolutionExtractor(mockClient);
      const comments = [
        makeComment({ body: "This fixed the issue", author: "midl-dev" }),
      ];
      const solutions = await officialExtractor.extract(issue, comments);
      expect(solutions[0].isOfficial).toBe(true);
      expect(mockClient.checkOrgMembership).toHaveBeenCalledWith("midl-dev");
    });

    it("defaults isOfficial to false when no githubClient provided", async () => {
      const noClientExtractor = new SolutionExtractor();
      const comments = [
        makeComment({ body: "This fixed the issue" }),
      ];
      const solutions = await noClientExtractor.extract(issue, comments);
      expect(solutions[0].isOfficial).toBe(false);
    });

    it("defaults isOfficial to false when checkOrgMembership throws", async () => {
      const mockClient = {
        checkOrgMembership: vi.fn().mockRejectedValue(new Error("API error")),
      } as unknown as GitHubClient;

      const errorExtractor = new SolutionExtractor(mockClient);
      const comments = [
        makeComment({ body: "This fixed the issue" }),
      ];
      const solutions = await errorExtractor.extract(issue, comments);
      expect(solutions[0].isOfficial).toBe(false);
    });
  });
});
