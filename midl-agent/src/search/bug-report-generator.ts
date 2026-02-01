export interface BugReportDraft {
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  environment: {
    sdkVersion?: string;
    nodeVersion?: string;
    browser?: string;
    os?: string;
    network?: string;
  };
  errorOutput?: string;
  severity: "critical" | "high" | "medium" | "low";
}

const SDK_VERSION_RE = /@midl\/[\w-]+\s+([\d]+\.[\d]+\.[\d]+)/i;
const NETWORK_RE = /\b(testnet|mainnet|signet|regtest)\b/i;
const ERROR_RE = /(?:Error:\s*(.+?)(?:\n|$))|(?:"([^"]{5,})")/;
const METHOD_RE = /\b([a-z][a-zA-Z0-9]+)\s*\(/g;

export class BugReportGenerator {
  /**
   * Generate a bug report draft from conversation context.
   * Extracts error messages, SDK versions, network, method names
   * from the user's natural language description.
   */
  generate(
    userDescription: string,
    additionalContext?: Partial<BugReportDraft>
  ): BugReportDraft {
    const errorMatch = userDescription.match(ERROR_RE);
    const errorMessage = errorMatch
      ? (errorMatch[1] ?? errorMatch[2] ?? "").trim()
      : "";

    const sdkMatch = userDescription.match(SDK_VERSION_RE);
    const sdkVersion = sdkMatch ? sdkMatch[0].trim() : undefined;

    const networkMatch = userDescription.match(NETWORK_RE);
    const network = networkMatch ? networkMatch[1].toLowerCase() : undefined;

    const methods: string[] = [];
    let m: RegExpExecArray | null;
    const methodRe = new RegExp(METHOD_RE.source, METHOD_RE.flags);
    while ((m = methodRe.exec(userDescription)) !== null) {
      if (!["if", "for", "while", "switch", "catch", "return"].includes(m[1])) {
        methods.push(m[1]);
      }
    }

    const title = this.generateTitle(
      userDescription,
      errorMessage,
      methods,
      additionalContext?.title
    );

    const severity = this.inferSeverity(
      userDescription,
      additionalContext?.severity
    );

    const draft: BugReportDraft = {
      title,
      description: userDescription.trim(),
      stepsToReproduce: additionalContext?.stepsToReproduce ?? "",
      expectedBehavior: additionalContext?.expectedBehavior ?? "",
      actualBehavior:
        additionalContext?.actualBehavior ??
        (errorMessage ? `Error: ${errorMessage}` : ""),
      environment: {
        sdkVersion,
        network,
        ...additionalContext?.environment,
      },
      errorOutput: errorMessage || additionalContext?.errorOutput || undefined,
      severity,
    };

    // Merge additionalContext overrides (except environment which is merged above)
    if (additionalContext) {
      if (additionalContext.title) draft.title = additionalContext.title;
      if (additionalContext.description)
        draft.description = additionalContext.description;
      if (additionalContext.severity) draft.severity = additionalContext.severity;
      if (additionalContext.errorOutput)
        draft.errorOutput = additionalContext.errorOutput;
    }

    return draft;
  }

  formatAsMarkdown(draft: BugReportDraft): string {
    const sections: string[] = [];

    sections.push(`## Description\n\n${draft.description}`);

    if (draft.stepsToReproduce) {
      sections.push(`## Steps to Reproduce\n\n${draft.stepsToReproduce}`);
    }

    sections.push(
      `## Expected vs Actual Behavior\n\n**Expected:** ${draft.expectedBehavior || "N/A"}\n\n**Actual:** ${draft.actualBehavior || "N/A"}`
    );

    const envLines: string[] = [];
    if (draft.environment.sdkVersion)
      envLines.push(`- **SDK:** ${draft.environment.sdkVersion}`);
    if (draft.environment.nodeVersion)
      envLines.push(`- **Node.js:** ${draft.environment.nodeVersion}`);
    if (draft.environment.browser)
      envLines.push(`- **Browser:** ${draft.environment.browser}`);
    if (draft.environment.os)
      envLines.push(`- **OS:** ${draft.environment.os}`);
    if (draft.environment.network)
      envLines.push(`- **Network:** ${draft.environment.network}`);
    if (envLines.length > 0) {
      sections.push(`## Environment\n\n${envLines.join("\n")}`);
    }

    if (draft.errorOutput) {
      sections.push(
        `## Error Output\n\n\`\`\`\n${draft.errorOutput}\n\`\`\``
      );
    }

    sections.push(`**Severity:** ${draft.severity}`);

    return sections.join("\n\n");
  }

  formatAsGitHubLink(
    draft: BugReportDraft,
    owner: string,
    repo: string
  ): string {
    const body = this.formatAsMarkdown(draft);
    const params = new URLSearchParams({ title: draft.title, body });
    return `https://github.com/${owner}/${repo}/issues/new?${params.toString()}`;
  }

  private generateTitle(
    description: string,
    errorMessage: string,
    methods: string[],
    override?: string
  ): string {
    if (override) return override.slice(0, 80);

    if (methods.length > 0 && errorMessage) {
      return `${methods[0]} fails with '${errorMessage}'`.slice(0, 80);
    }
    if (errorMessage) {
      return errorMessage.slice(0, 80);
    }

    // First sentence
    const firstSentence = description.split(/[.!?\n]/)[0]?.trim() ?? "";
    if (firstSentence.length > 0) {
      return firstSentence.slice(0, 80);
    }

    return "Bug report".slice(0, 80);
  }

  private inferSeverity(
    description: string,
    override?: BugReportDraft["severity"]
  ): BugReportDraft["severity"] {
    if (override) return override;

    const lower = description.toLowerCase();
    if (/\b(crash|crashes|data loss|corrupt)\b/.test(lower)) return "critical";
    if (/\b(error|exception|fail|fails|failed|broken)\b/.test(lower))
      return "high";
    if (/\b(unexpected|wrong|incorrect|weird)\b/.test(lower)) return "medium";
    return "low";
  }
}
