import { GitHubClient } from "./github-client.js";
import { BugReportDraft, BugReportGenerator } from "./bug-report-generator.js";

export interface IssueCreationResult {
  created: boolean;
  issueNumber?: number;
  issueUrl?: string;
  fallbackUrl?: string;
  error?: string;
}

export class IssueCreator {
  private client: GitHubClient;
  private reportGenerator: BugReportGenerator;

  constructor(deps?: {
    client?: GitHubClient;
    reportGenerator?: BugReportGenerator;
  }) {
    this.client =
      deps?.client ??
      new GitHubClient({ token: process.env.GITHUB_TOKEN });
    this.reportGenerator = deps?.reportGenerator ?? new BugReportGenerator();
  }

  async createFromDraft(
    draft: BugReportDraft,
    labels?: string[],
    diagnosticReport?: { markdown: string; filename: string; summary: string }
  ): Promise<IssueCreationResult> {
    const body = diagnosticReport
      ? diagnosticReport.summary + "\n\n---\n\nSee attached diagnostic report for full details."
      : this.reportGenerator.formatAsMarkdown(draft);
    try {
      const result = await this.client.createIssue(draft.title, body, labels);

      if (diagnosticReport && result.number) {
        const filePath = `diagnostics/${diagnosticReport.filename}`;
        const uploadResult = await this.client.uploadFileToRepo(
          filePath,
          diagnosticReport.markdown,
          `Add diagnostic report for issue #${result.number}`
        );

        if (uploadResult) {
          await this.client.updateIssueBody(
            result.number,
            diagnosticReport.summary +
              `\n\n---\n\n[View full diagnostic report](${uploadResult.url})`
          );
        } else {
          // Fallback: embed full report in issue body
          await this.client.updateIssueBody(
            result.number,
            diagnosticReport.summary +
              "\n\n---\n\n## Diagnostic Report\n\n" +
              diagnosticReport.markdown
          );
        }
      }

      return {
        created: true,
        issueNumber: result.number,
        issueUrl: result.url,
      };
    } catch (error) {
      const fallbackUrl = this.reportGenerator.formatAsGitHubLink(
        draft,
        this.client.owner,
        this.client.repo
      );
      return {
        created: false,
        fallbackUrl,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
