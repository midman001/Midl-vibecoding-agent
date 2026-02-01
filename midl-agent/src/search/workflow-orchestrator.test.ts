import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkflowOrchestrator } from "./workflow-orchestrator.js";
import type {
  ApplicabilityResult,
  DuplicateDetectionResult,
  GitHubIssueResult,
  IssueComment,
  Solution,
  UserContext,
} from "../types/search-types.js";
import type { BugReportDraft } from "./bug-report-generator.js";

function makeIssue(
  n: number,
  overrides: Partial<GitHubIssueResult> = {}
): GitHubIssueResult {
  return {
    number: n,
    title: `Issue ${n}`,
    url: `https://github.com/test/repo/issues/${n}`,
    status: "open",
    labels: [],
    comments: 3,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    body: "Issue body",
    author: "testuser",
    ...overrides,
  };
}

function makeComment(id: number, body: string): IssueComment {
  return {
    id,
    author: "helper",
    body,
    createdAt: "2026-01-01T00:00:00Z",
    isAuthor: false,
    reactions: { totalCount: 0, plusOne: 0, heart: 0 },
  };
}

function makeSolution(overrides: Partial<Solution> = {}): Solution {
  return {
    type: "fix",
    description: "Try updating the SDK version",
    codeSnippet: 'npm install @midl/core@latest',
    sourceComment: makeComment(1, "This fixed it for me"),
    confidence: "confirmed",
    context: {
      sdkVersion: "1.2.3",
      network: "testnet",
      methodName: "broadcastTransaction",
      errorMessage: "timeout exceeded",
    },
    ...overrides,
  };
}

function makeApplicabilityResult(
  overrides: Partial<ApplicabilityResult> = {}
): ApplicabilityResult {
  return {
    solution: makeSolution(),
    score: 0.8,
    level: "very likely",
    reasons: ["Same network: testnet (+0.15)"],
    ...overrides,
  };
}

function makeDuplicateResult(
  issues: GitHubIssueResult[] = [makeIssue(1)]
): DuplicateDetectionResult {
  return {
    results: issues.map((issue) => ({ issue, similarityScore: 0.8 })),
    duplicates: issues.map((issue) => ({ issue, similarityScore: 0.8 })),
    hasDuplicates: true,
    searchTerms: ["test"],
  };
}

function makeDraft(): BugReportDraft {
  return {
    title: "Test bug",
    description: "Something broke",
    stepsToReproduce: "1. Do thing",
    expectedBehavior: "Works",
    actualBehavior: "Broken",
    environment: {},
    severity: "medium",
  };
}

function buildMocks() {
  return {
    duplicateDetector: {
      detect: vi.fn().mockResolvedValue(makeDuplicateResult()),
    } as any,
    solutionExtractor: {
      extract: vi.fn().mockReturnValue([makeSolution()]),
    } as any,
    applicabilityScorer: {
      scoreApplicability: vi.fn().mockReturnValue(makeApplicabilityResult()),
    } as any,
    reportGenerator: {
      generate: vi.fn().mockReturnValue(makeDraft()),
      formatAsMarkdown: vi.fn().mockReturnValue("## Description\n\nTest"),
    } as any,
    issueCreator: {
      createFromDraft: vi.fn().mockResolvedValue({
        created: true,
        issueNumber: 99,
        issueUrl: "https://github.com/test/repo/issues/99",
      }),
    } as any,
    fixImplementer: {
      locateAndPrepareFix: vi.fn().mockResolvedValue({
        applied: false,
        filePath: "/src/test.ts",
        diff: "some diff",
        explanation: "Fix explanation",
      }),
    } as any,
    githubClient: {
      getIssueComments: vi
        .fn()
        .mockResolvedValue([makeComment(1, "This fixed it: update SDK")]),
    } as any,
    config: {
      duplicateThreshold: 0.75,
      maxResults: 5,
      searchTimeoutMs: 5000,
      cacheTtlMs: 300000,
      applicabilityWeights: {
        errorMessage: 0.4,
        sdkVersion: 0.2,
        network: 0.15,
        methodName: 0.15,
        confirmedFix: 0.1,
      },
    },
  };
}

describe("WorkflowOrchestrator", () => {
  describe("handleProblemReport", () => {
    it("happy path: returns solutions when found", async () => {
      const mocks = buildMocks();
      const orchestrator = new WorkflowOrchestrator(mocks);

      const result = await orchestrator.handleProblemReport("broadcastTransaction timeout");

      expect(result.searchPerformed).toBe(true);
      expect(result.hasSolutions).toBe(true);
      expect(result.solutions.length).toBeGreaterThan(0);
      expect(result.reportDraft).toBeNull();
      expect(result.formattedResponse).toContain("solutions");
    });

    it("no solutions: returns report draft when extractor finds nothing", async () => {
      const mocks = buildMocks();
      mocks.solutionExtractor.extract.mockReturnValue([]);
      const orchestrator = new WorkflowOrchestrator(mocks);

      const result = await orchestrator.handleProblemReport("some issue");

      expect(result.hasSolutions).toBe(false);
      expect(result.reportDraft).not.toBeNull();
      expect(result.formattedResponse).toContain("didn't find an existing solution");
    });

    it("search fails gracefully: proceeds to report generation", async () => {
      const mocks = buildMocks();
      mocks.duplicateDetector.detect.mockRejectedValue(new Error("network error"));
      const orchestrator = new WorkflowOrchestrator(mocks);

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = await orchestrator.handleProblemReport("some issue");
      warnSpy.mockRestore();

      expect(result.searchPerformed).toBe(false);
      expect(result.duplicatesFound).toBeNull();
      expect(result.reportDraft).not.toBeNull();
    });

    it("comment fetch fails gracefully: skips that issue", async () => {
      const mocks = buildMocks();
      mocks.githubClient.getIssueComments.mockRejectedValue(
        new Error("fetch failed")
      );
      const orchestrator = new WorkflowOrchestrator(mocks);

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = await orchestrator.handleProblemReport("some issue");
      warnSpy.mockRestore();

      // No solutions extracted since comments failed
      expect(result.hasSolutions).toBe(false);
      expect(result.reportDraft).not.toBeNull();
    });

    it("extracts context from description correctly", async () => {
      const mocks = buildMocks();
      // Return "probably not relevant" so we can inspect scorer calls without affecting hasSolutions logic
      mocks.applicabilityScorer.scoreApplicability.mockReturnValue(
        makeApplicabilityResult({ score: 0.8, level: "very likely" })
      );
      const orchestrator = new WorkflowOrchestrator(mocks);

      const description =
        "Error: timeout exceeded when using @midl/react 1.2.3 on testnet with broadcastTransaction";

      await orchestrator.handleProblemReport(description);

      // Verify the scorer was called with correct userContext
      const call = mocks.applicabilityScorer.scoreApplicability.mock.calls[0];
      const userContext: UserContext = call[1];
      expect(userContext.errorMessage).toBe("timeout exceeded when using @midl/react 1.2.3 on testnet with broadcastTransaction");
      expect(userContext.sdkVersion).toBe("1.2.3");
      expect(userContext.network).toBe("testnet");
      expect(userContext.methodName).toBe("broadcastTransaction");
    });

    it("filters issues with 0 comments", async () => {
      const mocks = buildMocks();
      const issueNoComments = makeIssue(2, { comments: 0 });
      mocks.duplicateDetector.detect.mockResolvedValue(
        makeDuplicateResult([issueNoComments])
      );
      const orchestrator = new WorkflowOrchestrator(mocks);

      await orchestrator.handleProblemReport("test");

      expect(mocks.githubClient.getIssueComments).not.toHaveBeenCalled();
    });
  });

  describe("submitReport", () => {
    it("delegates to issueCreator.createFromDraft", async () => {
      const mocks = buildMocks();
      const orchestrator = new WorkflowOrchestrator(mocks);
      const draft = makeDraft();

      const result = await orchestrator.submitReport(draft, ["bug"]);

      expect(mocks.issueCreator.createFromDraft).toHaveBeenCalledWith(
        draft,
        ["bug"]
      );
      expect(result.created).toBe(true);
    });
  });

  describe("implementSolution", () => {
    it("delegates to fixImplementer.locateAndPrepareFix", async () => {
      const mocks = buildMocks();
      const orchestrator = new WorkflowOrchestrator(mocks);
      const solution = makeApplicabilityResult();

      const result = await orchestrator.implementSolution(solution, "/project");

      expect(mocks.fixImplementer.locateAndPrepareFix).toHaveBeenCalledWith(
        solution.solution,
        "/project"
      );
      expect(result.applied).toBe(false);
    });
  });
});
