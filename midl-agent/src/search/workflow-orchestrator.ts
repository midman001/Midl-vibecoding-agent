import { DuplicateDetector } from "./duplicate-detector.js";
import { SolutionExtractor } from "./solution-extractor.js";
import { ApplicabilityScorer } from "./applicability-scorer.js";
import {
  BugReportGenerator,
  BugReportDraft,
} from "./bug-report-generator.js";
import { IssueCreator, IssueCreationResult } from "./issue-creator.js";
import { FixImplementer, FixResult } from "./fix-implementer.js";
import { GitHubClient } from "./github-client.js";
import {
  loadSearchConfig,
  SearchConfig,
} from "./search-config.js";
import type {
  ApplicabilityResult,
  DuplicateDetectionResult,
  UserContext,
} from "../types/search-types.js";

export interface WorkflowResult {
  /** Whether a GitHub search was performed */
  searchPerformed: boolean;
  /** Raw duplicate detection results */
  duplicatesFound: DuplicateDetectionResult | null;
  /** Scored solutions from matching issues */
  solutions: ApplicabilityResult[];
  /** Whether any actionable solutions were found */
  hasSolutions: boolean;
  /** Auto-generated report draft (only if no solutions helped) */
  reportDraft: BugReportDraft | null;
  /** Formatted output for the agent to present to the user */
  formattedResponse: string;
}

export class WorkflowOrchestrator {
  private duplicateDetector: DuplicateDetector;
  private solutionExtractor: SolutionExtractor;
  private applicabilityScorer: ApplicabilityScorer;
  private reportGenerator: BugReportGenerator;
  private issueCreator: IssueCreator;
  private fixImplementer: FixImplementer;
  private githubClient: GitHubClient;
  private config: SearchConfig;

  constructor(deps?: {
    duplicateDetector?: DuplicateDetector;
    solutionExtractor?: SolutionExtractor;
    applicabilityScorer?: ApplicabilityScorer;
    reportGenerator?: BugReportGenerator;
    issueCreator?: IssueCreator;
    fixImplementer?: FixImplementer;
    githubClient?: GitHubClient;
    config?: SearchConfig;
  }) {
    this.config = deps?.config ?? loadSearchConfig();
    this.githubClient =
      deps?.githubClient ??
      new GitHubClient({ token: process.env.GITHUB_TOKEN });
    this.duplicateDetector =
      deps?.duplicateDetector ??
      new DuplicateDetector({ threshold: this.config.duplicateThreshold });
    this.solutionExtractor =
      deps?.solutionExtractor ?? new SolutionExtractor();
    this.applicabilityScorer =
      deps?.applicabilityScorer ?? new ApplicabilityScorer();
    this.reportGenerator =
      deps?.reportGenerator ?? new BugReportGenerator();
    this.issueCreator =
      deps?.issueCreator ?? new IssueCreator({ client: this.githubClient });
    this.fixImplementer = deps?.fixImplementer ?? new FixImplementer();
  }

  /**
   * Main entry point: user describes a problem.
   * 1. Search for duplicates (Phase 2 DuplicateDetector)
   * 2. For top matches, fetch comments and extract solutions
   * 3. Score solution applicability against user's context
   * 4. Return formatted response with solutions or report draft
   */
  async handleProblemReport(
    userDescription: string,
    userContext?: Partial<UserContext>
  ): Promise<WorkflowResult> {
    const context = this.buildUserContext(userDescription, userContext);

    // Step 1: Search for duplicates
    let duplicatesFound: DuplicateDetectionResult | null = null;
    try {
      duplicatesFound = await this.duplicateDetector.detect(userDescription, {
        limit: this.config.maxResults,
        includeClosedIssues: true,
        timeoutMs: this.config.searchTimeoutMs,
      });
    } catch (error) {
      // Graceful degradation: search failure should not block the user
      console.warn(
        `Search failed: ${error instanceof Error ? error.message : String(error)}. Proceeding without search results.`
      );
    }

    // Step 2 & 3: Extract and score solutions from top results
    const solutions: ApplicabilityResult[] = [];
    if (duplicatesFound && duplicatesFound.results.length > 0) {
      const topResults = duplicatesFound.results
        .filter((r) => r.issue.comments > 0)
        .slice(0, 3);

      for (const result of topResults) {
        try {
          const comments = await this.githubClient.getIssueComments(
            result.issue.number
          );

          // Mark comments from issue author
          for (const comment of comments) {
            comment.isAuthor = comment.author === result.issue.author;
          }

          const extracted = this.solutionExtractor.extract(
            result.issue,
            comments
          );

          for (const solution of extracted) {
            const scored = this.applicabilityScorer.scoreApplicability(
              solution,
              context
            );
            solutions.push(scored);
          }
        } catch (error) {
          // Skip issues we can't fetch comments for
          console.warn(
            `Failed to fetch comments for issue #${result.issue.number}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }

    // Step 4: Filter and sort solutions
    const actionableSolutions = solutions
      .filter((s) => s.level !== "probably not relevant")
      .sort((a, b) => b.score - a.score);

    // Step 5: Format response
    const hasSolutions = actionableSolutions.length > 0;
    let reportDraft: BugReportDraft | null = null;
    let formattedResponse: string;

    if (hasSolutions) {
      formattedResponse = this.formatSolutionsResponse(
        actionableSolutions,
        duplicatesFound!
      );
    } else {
      reportDraft = this.reportGenerator.generate(userDescription);
      formattedResponse = this.formatReportDraftResponse(reportDraft);
    }

    return {
      searchPerformed: duplicatesFound !== null,
      duplicatesFound,
      solutions: actionableSolutions,
      hasSolutions,
      reportDraft,
      formattedResponse,
    };
  }

  /**
   * Called when user decides to create a report (no solution helped).
   * Generates draft from conversation context.
   */
  generateReportDraft(
    userDescription: string,
    additionalContext?: Partial<BugReportDraft>
  ): BugReportDraft {
    return this.reportGenerator.generate(userDescription, additionalContext);
  }

  /**
   * Called when user approves the report draft.
   * Creates GitHub issue or returns manual link.
   */
  async submitReport(
    draft: BugReportDraft,
    labels?: string[]
  ): Promise<IssueCreationResult> {
    return this.issueCreator.createFromDraft(draft, labels);
  }

  /**
   * Called when user says "Yes, implement it" (Decision 5).
   * Delegates to FixImplementer to locate code, apply fix, and return diff.
   * Only proceeds with explicit user consent.
   */
  async implementSolution(
    solution: ApplicabilityResult,
    projectRoot: string
  ): Promise<FixResult> {
    return this.fixImplementer.locateAndPrepareFix(
      solution.solution,
      projectRoot
    );
  }

  /**
   * Format solutions for agent to present to user.
   * Conversational tone per CONTEXT.md Decision 4.
   */
  private formatSolutionsResponse(
    solutions: ApplicabilityResult[],
    duplicates: DuplicateDetectionResult
  ): string {
    const lines: string[] = [];

    lines.push(
      "I searched GitHub and found some existing solutions that might help:\n"
    );

    for (let i = 0; i < solutions.length; i++) {
      const s = solutions[i];
      const issueNum = s.solution.sourceComment.id;
      const pct = Math.round(s.score * 100);
      const levelLabel =
        s.level === "very likely"
          ? "Very likely to help"
          : "Might help";

      lines.push(`**${i + 1}. ${levelLabel}** (${pct}% match)`);
      lines.push(`   ${s.solution.description}`);

      if (s.solution.codeSnippet) {
        lines.push("");
        lines.push("   ```");
        lines.push(`   ${s.solution.codeSnippet}`);
        lines.push("   ```");
      }

      if (s.reasons.length > 0) {
        lines.push(`   _Why: ${s.reasons.join(", ")}_`);
      }

      lines.push("");
    }

    lines.push("**What would you like to do?**");
    lines.push('- "Want me to implement this fix?" - I\'ll locate the code and show you a diff');
    lines.push('- "Show me how" - I\'ll walk you through the change');
    lines.push('- "That\'s not my issue" - I\'ll help you file a bug report instead');

    return lines.join("\n");
  }

  /**
   * Format report draft for user review.
   */
  private formatReportDraftResponse(draft: BugReportDraft): string {
    const lines: string[] = [];

    lines.push(
      "I searched GitHub but didn't find an existing solution for your issue. " +
        "Here's a draft bug report based on our conversation:\n"
    );

    lines.push(`**Title:** ${draft.title}\n`);
    lines.push(this.reportGenerator.formatAsMarkdown(draft));
    lines.push("");
    lines.push('Does this look right? You can say "yes" to submit, "edit" to modify, or add more details.');

    return lines.join("\n");
  }

  /**
   * Build UserContext from description and optional overrides.
   */
  private buildUserContext(
    description: string,
    overrides?: Partial<UserContext>
  ): UserContext {
    // Extract context from description using simple patterns
    const errorMatch = description.match(/Error:\s*(.+?)(?:\n|$)/i);
    const versionMatch = description.match(
      /@midl\/[\w-]+\s+([\d]+\.[\d]+\.[\d]+)/i
    );
    const networkMatch = description.match(
      /\b(testnet|mainnet|signet|regtest)\b/i
    );
    const methodMatch = description.match(
      /\b(broadcastTransaction|signTransaction|sendTransaction|getBalance|getTransaction|connectWallet|useAccount|useMidl|useConnect|estimateFee)\b/
    );

    return {
      description,
      errorMessage: overrides?.errorMessage ?? (errorMatch ? errorMatch[1].trim() : undefined),
      sdkVersion: overrides?.sdkVersion ?? (versionMatch ? versionMatch[1] : undefined),
      network: overrides?.network ?? (networkMatch ? networkMatch[1].toLowerCase() : undefined),
      methodName: overrides?.methodName ?? (methodMatch ? methodMatch[1] : undefined),
    };
  }
}
