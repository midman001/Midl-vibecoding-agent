import { describe, it, expect } from "vitest";
import { WorkflowOrchestrator } from "./workflow-orchestrator.js";
import type { DiagnosticContext } from "./diagnostic-report-generator.js";

describe("WorkflowOrchestrator", () => {
  describe("handleProblemReport", () => {
    it("returns a reportDraft with title and body from description", async () => {
      const orchestrator = new WorkflowOrchestrator();

      const result = await orchestrator.handleProblemReport(
        "Error: timeout exceeded when calling broadcastTransaction"
      );

      expect(result.reportDraft).not.toBeNull();
      expect(result.reportDraft!.title).toBeTruthy();
      expect(result.reportDraft!.description).toContain("timeout exceeded");
    });

    it("generates diagnostic report with all 5 sections when diagnosticContext provided", async () => {
      const orchestrator = new WorkflowOrchestrator();
      const diagCtx: Partial<DiagnosticContext> = {
        errorMessages: ["Error: timeout"],
        environment: { nodeVersion: "20.0.0" },
        fixesAttempted: [{ description: "Retried call", outcome: "failed" }],
        suggestions: {
          possibleCauses: ["Network issue"],
          recommendedFixes: ["Check connection"],
          testCases: ["Test with mock"],
        },
      };

      const result = await orchestrator.handleProblemReport(
        "broadcastTransaction timeout on testnet",
        diagCtx
      );

      expect(result.diagnosticReport).toBeDefined();
      expect(result.diagnosticReport!.sectionCount).toBe(5);
      expect(result.diagnosticReport!.markdown).toContain("Problem Description");
      expect(result.diagnosticReport!.markdown).toContain("Environment Details");
      expect(result.diagnosticReport!.markdown).toContain("Steps Taken by Agent");
      expect(result.diagnosticReport!.markdown).toContain("Fixes Attempted");
      expect(result.diagnosticReport!.markdown).toContain("Suggestions for Team");
    });

    it("returns reportDraft without diagnosticReport when no context provided", async () => {
      const orchestrator = new WorkflowOrchestrator();

      const result = await orchestrator.handleProblemReport("some issue");

      expect(result.reportDraft).not.toBeNull();
      expect(result.diagnosticReport).toBeUndefined();
    });

    it("formattedResponse does NOT contain 'searched GitHub'", async () => {
      const orchestrator = new WorkflowOrchestrator();

      const result = await orchestrator.handleProblemReport("some issue");

      expect(result.formattedResponse).not.toContain("searched GitHub");
      expect(result.formattedResponse).not.toContain("I searched GitHub");
    });

    it("formattedResponse contains instructions to share with MIDL team", async () => {
      const orchestrator = new WorkflowOrchestrator();

      const result = await orchestrator.handleProblemReport("some issue");

      expect(result.formattedResponse).toContain("MIDL team");
      expect(result.formattedResponse).toContain("Discord");
    });

    it("formattedResponse mentions MCP tool for Discord posting", async () => {
      const orchestrator = new WorkflowOrchestrator();

      const result = await orchestrator.handleProblemReport("some issue");

      expect(result.formattedResponse).toContain("create_discord_thread");
      expect(result.formattedResponse).toContain("MCP_API_KEY");
      expect(result.formattedResponse).toContain("/setup-mcp");
    });
  });

  describe("generateReportDraft", () => {
    it("returns a BugReportDraft", () => {
      const orchestrator = new WorkflowOrchestrator();

      const draft = orchestrator.generateReportDraft("Error: something broke");

      expect(draft.title).toBeTruthy();
      expect(draft.description).toContain("something broke");
      expect(draft.severity).toBeTruthy();
    });
  });
});
