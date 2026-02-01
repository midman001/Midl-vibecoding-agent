import { describe, it, expect } from "vitest";
import {
  DiagnosticReportGenerator,
  DiagnosticContext,
} from "./diagnostic-report-generator.js";

function makeContext(overrides?: Partial<DiagnosticContext>): DiagnosticContext {
  return {
    userDescription: "Transaction fails when calling sendBTC on testnet.",
    errorMessages: ["Error: insufficient funds for gas"],
    environment: {
      sdkPackages: { "@midl/core": "1.2.0", "@midl/react": "2.1.0" },
      nodeVersion: "18.17.0",
      os: "macOS 14.2",
      browser: "Chrome 120",
      walletVersion: "Leather 6.0",
      network: "testnet",
      relevantDependencies: { react: "18.2.0", vite: "5.0.0" },
    },
    searchSteps: {
      searchTerms: ["sendBTC", "insufficient funds", "testnet"],
      resultsCount: 8,
      duplicatesFound: 2,
      similarityScores: [
        { issueNumber: 42, score: 0.85 },
        { issueNumber: 17, score: 0.62 },
      ],
    },
    fixesAttempted: [
      { description: "Increased gas limit to 21000", outcome: "failed", reason: "Still insufficient" },
      { description: "Switched to mainnet RPC", outcome: "success" },
    ],
    suggestions: {
      possibleCauses: ["Testnet faucet balance depleted", "Gas estimation bug"],
      recommendedFixes: ["Check wallet balance before send", "Use explicit gas limit"],
      testCases: ["Send 0 BTC to verify gas-only tx", "Send on mainnet for comparison"],
    },
    ...overrides,
  };
}

describe("DiagnosticReportGenerator", () => {
  const gen = new DiagnosticReportGenerator();

  it("generates all 5 sections with full context", () => {
    const report = gen.generate(makeContext());
    expect(report.markdown).toContain("## Problem Description");
    expect(report.markdown).toContain("## Environment Details");
    expect(report.markdown).toContain("## Steps Taken by Agent");
    expect(report.markdown).toContain("## Fixes Attempted");
    expect(report.markdown).toContain("## Suggestions for Team");
  });

  it("shows 'Not detected' for missing environment fields", () => {
    const report = gen.generate(makeContext({ environment: {} }));
    expect(report.markdown).toContain("**Node.js:** Not detected");
    expect(report.markdown).toContain("**OS:** Not detected");
    expect(report.markdown).toContain("**Browser:** Not detected");
    expect(report.markdown).toContain("**Wallet Version:** Not detected");
    expect(report.markdown).toContain("**Network:** Not detected");
  });

  it("shows appropriate message when no fixes attempted", () => {
    const report = gen.generate(makeContext({ fixesAttempted: [] }));
    expect(report.markdown).toContain("No automated fixes were attempted.");
  });

  it("truncates error messages longer than 500 chars", () => {
    const longError = "x".repeat(600);
    const report = gen.generate(makeContext({ errorMessages: [longError] }));
    expect(report.markdown).toContain("... (truncated)");
    expect(report.markdown).not.toContain("x".repeat(600));
  });

  it("generateIssueSummary returns brief text under 500 chars", () => {
    const summary = gen.generateIssueSummary(makeContext());
    expect(summary.length).toBeLessThan(500);
    expect(summary).toContain("Transaction fails");
    expect(summary).toContain("diagnostic report");
  });

  it("generateFilename returns valid format", () => {
    const filename = gen.generateFilename();
    expect(filename).toMatch(/^diagnostic-report-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.md$/);
  });

  it("sizeBytes and sectionCount are accurate", () => {
    const report = gen.generate(makeContext());
    expect(report.sectionCount).toBe(5);
    expect(report.sizeBytes).toBe(Buffer.byteLength(report.markdown, "utf-8"));
  });

  it("shows empty suggestions sub-sections as 'None identified.'", () => {
    const report = gen.generate(
      makeContext({
        suggestions: { possibleCauses: [], recommendedFixes: [], testCases: [] },
      })
    );
    const noneCount = (report.markdown.match(/None identified\./g) || []).length;
    expect(noneCount).toBe(3);
  });
});
