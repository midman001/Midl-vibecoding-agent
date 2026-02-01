export interface DiagnosticContext {
  userDescription: string;
  errorMessages: string[];
  environment: {
    sdkPackages?: Record<string, string>;
    nodeVersion?: string;
    os?: string;
    browser?: string;
    walletVersion?: string;
    network?: string;
    relevantDependencies?: Record<string, string>;
  };
  searchSteps: {
    searchTerms: string[];
    resultsCount: number;
    duplicatesFound: number;
    similarityScores: { issueNumber: number; score: number }[];
  };
  fixesAttempted: {
    description: string;
    outcome: "success" | "failed" | "partial";
    reason?: string;
  }[];
  suggestions: {
    possibleCauses: string[];
    recommendedFixes: string[];
    testCases: string[];
  };
}

export interface DiagnosticReport {
  markdown: string;
  sizeBytes: number;
  sectionCount: number;
  filename: string;
}

const MAX_ERROR_LENGTH = 500;

function truncateError(msg: string): string {
  if (msg.length > MAX_ERROR_LENGTH) {
    return msg.slice(0, MAX_ERROR_LENGTH) + "... (truncated)";
  }
  return msg;
}

export class DiagnosticReportGenerator {
  generate(context: DiagnosticContext): DiagnosticReport {
    const sections: string[] = [];

    // Section 1: Problem Description
    sections.push(this.buildProblemDescription(context));

    // Section 2: Environment Details
    sections.push(this.buildEnvironmentDetails(context));

    // Section 3: Steps Taken by Agent
    sections.push(this.buildStepsTaken(context));

    // Section 4: Fixes Attempted
    sections.push(this.buildFixesAttempted(context));

    // Section 5: Suggestions for Team
    sections.push(this.buildSuggestions(context));

    const markdown = sections.join("\n\n");
    return {
      markdown,
      sizeBytes: Buffer.byteLength(markdown, "utf-8"),
      sectionCount: 5,
      filename: this.generateFilename(),
    };
  }

  generateFilename(): string {
    const now = new Date();
    const iso = now.toISOString().replace(/:/g, "-").replace(/\.\d+Z$/, "");
    return `diagnostic-report-${iso}.md`;
  }

  generateIssueSummary(context: DiagnosticContext): string {
    const problem = context.userDescription.split(/[.!?\n]/)[0]?.trim() || "An issue was reported";
    const searchCount = context.searchSteps.resultsCount;
    const dupCount = context.searchSteps.duplicatesFound;
    const fixCount = context.fixesAttempted.length;

    let summary = `${problem}. `;
    summary += `The agent searched existing issues and found ${searchCount} result(s) with ${dupCount} potential duplicate(s). `;

    if (fixCount > 0) {
      const successful = context.fixesAttempted.filter((f) => f.outcome === "success").length;
      summary += `${fixCount} fix(es) were attempted, ${successful} succeeded. `;
    } else {
      summary += "No automated fixes were attempted. ";
    }

    summary += "A detailed diagnostic report is attached.";
    return summary;
  }

  private buildProblemDescription(context: DiagnosticContext): string {
    const lines: string[] = ["## Problem Description", ""];
    lines.push(context.userDescription);

    if (context.errorMessages.length > 0) {
      lines.push("");
      lines.push("**Error Messages:**");
      for (const msg of context.errorMessages) {
        lines.push("");
        lines.push("```");
        lines.push(truncateError(msg));
        lines.push("```");
      }
    }

    return lines.join("\n");
  }

  private buildEnvironmentDetails(context: DiagnosticContext): string {
    const env = context.environment;
    const lines: string[] = ["## Environment Details", ""];

    // SDK packages table
    lines.push("### SDK Packages");
    lines.push("");
    lines.push("| Package | Version |");
    lines.push("|---------|---------|");
    if (env.sdkPackages && Object.keys(env.sdkPackages).length > 0) {
      for (const [pkg, ver] of Object.entries(env.sdkPackages)) {
        lines.push(`| ${pkg} | ${ver} |`);
      }
    } else {
      lines.push("| _None detected_ | - |");
    }

    lines.push("");
    lines.push("### System Information");
    lines.push("");
    lines.push(`- **Node.js:** ${env.nodeVersion || "Not detected"}`);
    lines.push(`- **OS:** ${env.os || "Not detected"}`);
    lines.push(`- **Browser:** ${env.browser || "Not detected"}`);
    lines.push(`- **Wallet Version:** ${env.walletVersion || "Not detected"}`);
    lines.push(`- **Network:** ${env.network || "Not detected"}`);

    // Relevant dependencies table
    lines.push("");
    lines.push("### Relevant Dependencies");
    lines.push("");
    lines.push("| Package | Version |");
    lines.push("|---------|---------|");
    if (env.relevantDependencies && Object.keys(env.relevantDependencies).length > 0) {
      for (const [pkg, ver] of Object.entries(env.relevantDependencies)) {
        lines.push(`| ${pkg} | ${ver} |`);
      }
    } else {
      lines.push("| _None detected_ | - |");
    }

    return lines.join("\n");
  }

  private buildStepsTaken(context: DiagnosticContext): string {
    const steps = context.searchSteps;
    const lines: string[] = ["## Steps Taken by Agent", ""];

    lines.push(`- **Search terms used:** ${steps.searchTerms.join(", ") || "None"}`);
    lines.push(`- **Results found:** ${steps.resultsCount}`);
    lines.push(`- **Potential duplicates:** ${steps.duplicatesFound}`);

    if (steps.similarityScores.length > 0) {
      lines.push("");
      lines.push("### Top Similarity Scores");
      lines.push("");
      lines.push("| Issue # | Score |");
      lines.push("|---------|-------|");
      for (const entry of steps.similarityScores) {
        lines.push(`| #${entry.issueNumber} | ${Math.round(entry.score * 100)}% |`);
      }
    }

    return lines.join("\n");
  }

  private buildFixesAttempted(context: DiagnosticContext): string {
    const lines: string[] = ["## Fixes Attempted", ""];

    if (context.fixesAttempted.length === 0) {
      lines.push("No automated fixes were attempted.");
      return lines.join("\n");
    }

    for (const fix of context.fixesAttempted) {
      const badge =
        fix.outcome === "success" ? "SUCCESS" :
        fix.outcome === "failed" ? "FAILED" :
        "PARTIAL";
      lines.push(`- **[${badge}]** ${fix.description}`);
      if (fix.reason) {
        lines.push(`  - _Reason:_ ${fix.reason}`);
      }
    }

    return lines.join("\n");
  }

  private buildSuggestions(context: DiagnosticContext): string {
    const sug = context.suggestions;
    const lines: string[] = ["## Suggestions for Team", ""];

    lines.push("### Possible Causes");
    lines.push("");
    if (sug.possibleCauses.length > 0) {
      for (const cause of sug.possibleCauses) {
        lines.push(`- ${cause}`);
      }
    } else {
      lines.push("None identified.");
    }

    lines.push("");
    lines.push("### Recommended Fixes");
    lines.push("");
    if (sug.recommendedFixes.length > 0) {
      for (const fix of sug.recommendedFixes) {
        lines.push(`- ${fix}`);
      }
    } else {
      lines.push("None identified.");
    }

    lines.push("");
    lines.push("### Test Cases");
    lines.push("");
    if (sug.testCases.length > 0) {
      for (const tc of sug.testCases) {
        lines.push(`- ${tc}`);
      }
    } else {
      lines.push("None identified.");
    }

    return lines.join("\n");
  }
}
