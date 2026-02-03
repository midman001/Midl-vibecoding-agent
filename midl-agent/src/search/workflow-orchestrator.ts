import {
  BugReportGenerator,
  BugReportDraft,
} from "./bug-report-generator.js";
import {
  DiagnosticReportGenerator,
  DiagnosticContext,
} from "./diagnostic-report-generator.js";
import {
  loadSearchConfig,
  SearchConfig,
} from "./search-config.js";

export interface WorkflowResult {
  /** Auto-generated report draft */
  reportDraft: BugReportDraft | null;
  /** Formatted output for the agent to present to the user */
  formattedResponse: string;
  /** Diagnostic report if diagnostic context was provided */
  diagnosticReport?: { markdown: string; sizeBytes: number; sectionCount: number };
}

export class WorkflowOrchestrator {
  private reportGenerator: BugReportGenerator;
  private diagnosticReportGenerator: DiagnosticReportGenerator;
  private config: SearchConfig;

  constructor(deps?: {
    reportGenerator?: BugReportGenerator;
    diagnosticReportGenerator?: DiagnosticReportGenerator;
    config?: SearchConfig;
  }) {
    this.config = deps?.config ?? loadSearchConfig();
    this.reportGenerator =
      deps?.reportGenerator ?? new BugReportGenerator();
    this.diagnosticReportGenerator =
      deps?.diagnosticReportGenerator ?? new DiagnosticReportGenerator();
  }

  /**
   * Main entry point: user describes a problem.
   * Generates a diagnostic report and bug report draft.
   */
  async handleProblemReport(
    userDescription: string,
    diagnosticContext?: Partial<DiagnosticContext>
  ): Promise<WorkflowResult> {
    // Generate bug report draft
    const reportDraft = this.reportGenerator.generate(userDescription);

    // Generate diagnostic report if context provided
    let diagnosticReport: WorkflowResult["diagnosticReport"] | undefined;
    if (diagnosticContext) {
      const fullContext: DiagnosticContext = {
        userDescription: diagnosticContext.userDescription ?? userDescription,
        errorMessages: diagnosticContext.errorMessages ?? [],
        environment: diagnosticContext.environment ?? {},
        searchSteps: diagnosticContext.searchSteps ?? {
          searchTerms: [],
          resultsCount: 0,
          duplicatesFound: 0,
          similarityScores: [],
        },
        fixesAttempted: diagnosticContext.fixesAttempted ?? [],
        suggestions: diagnosticContext.suggestions ?? {
          possibleCauses: [],
          recommendedFixes: [],
          testCases: [],
        },
      };

      const report = this.diagnosticReportGenerator.generate(fullContext);
      diagnosticReport = {
        markdown: report.markdown,
        sizeBytes: report.sizeBytes,
        sectionCount: report.sectionCount,
      };
    }

    // Build formatted response
    const formattedResponse = this.formatReportDraftResponse(reportDraft, diagnosticReport);

    return {
      reportDraft,
      formattedResponse,
      diagnosticReport,
    };
  }

  /**
   * Generate a bug report draft from user description.
   */
  generateReportDraft(
    userDescription: string,
    additionalContext?: Partial<BugReportDraft>
  ): BugReportDraft {
    return this.reportGenerator.generate(userDescription, additionalContext);
  }

  /**
   * Format report draft for user review.
   */
  private formatReportDraftResponse(
    draft: BugReportDraft,
    diagnosticReport?: WorkflowResult["diagnosticReport"]
  ): string {
    const lines: string[] = [];

    lines.push(
      "Here's a diagnostic report based on your issue description:\n"
    );

    lines.push(`**Title:** ${draft.title}\n`);
    lines.push(this.reportGenerator.formatAsMarkdown(draft));

    if (diagnosticReport) {
      lines.push("");
      lines.push("---\n");
      lines.push("**Detailed Diagnostic Report:**\n");
      lines.push(diagnosticReport.markdown);
    }

    lines.push("");
    lines.push(
      "You can share this report with the MIDL team on Discord or by opening an issue on GitHub."
    );
    lines.push(
      'Does this look right? You can say "yes" to finalize, "edit" to modify, or add more details.'
    );
    lines.push("");
    lines.push(
      "To share this on Discord, use the `create_discord_thread` MCP tool. Make sure you have your MCP_API_KEY configured."
    );
    lines.push(
      "Run `/setup-mcp` in the MIDL Discord server to get your API key if you don't have one."
    );

    return lines.join("\n");
  }
}
