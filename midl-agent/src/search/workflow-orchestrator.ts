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
import type { ForumPoster } from "../discord/forum-poster.js";

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
  private forumPoster?: ForumPoster;

  constructor(deps?: {
    reportGenerator?: BugReportGenerator;
    diagnosticReportGenerator?: DiagnosticReportGenerator;
    config?: SearchConfig;
    forumPoster?: ForumPoster;
  }) {
    this.config = deps?.config ?? loadSearchConfig();
    this.reportGenerator =
      deps?.reportGenerator ?? new BugReportGenerator();
    this.diagnosticReportGenerator =
      deps?.diagnosticReportGenerator ?? new DiagnosticReportGenerator();
    this.forumPoster = deps?.forumPoster;
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
   * Post a diagnostic report to the Discord forum.
   * Returns thread URL on success, null if no forumPoster configured or on Discord API error.
   */
  async postToDiscord(
    diagnosticReport: { markdown: string },
    options: { title: string; authorName?: string }
  ): Promise<{ threadUrl: string } | null> {
    if (!this.forumPoster) {
      return null;
    }

    const reportFilename = `diagnostic-report-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.md`;

    try {
      const result = await this.forumPoster.postReport({
        title: options.title,
        summary: options.title,
        reportMarkdown: diagnosticReport.markdown,
        reportFilename,
        authorName: options.authorName,
      });
      return { threadUrl: result.threadUrl };
    } catch (error) {
      console.error("Failed to post to Discord:", error);
      return null;
    }
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
      "Want to share this on Discord? I can post it to the MIDL support forum for you."
    );

    return lines.join("\n");
  }
}
