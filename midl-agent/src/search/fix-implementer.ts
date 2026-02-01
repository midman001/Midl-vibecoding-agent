import * as fs from "node:fs";
import * as path from "node:path";
import type { Solution } from "../types/search-types.js";

export interface FixResult {
  applied: boolean;
  filePath?: string;
  diff?: string;
  explanation?: string;
  error?: string;
  /** When multiple files match, the user picks one */
  candidates?: string[];
}

export class FixImplementer {
  private fs: typeof fs;

  constructor(deps?: { fs?: typeof fs }) {
    this.fs = deps?.fs ?? fs;
  }

  /**
   * Locate relevant code in user's project and prepare a fix from a solution.
   *
   * Scope: Single-point fixes only (1-2 line changes, single file).
   * Does NOT write to disk. Returns the diff for user confirmation.
   */
  async locateAndPrepareFix(
    solution: Solution,
    projectRoot: string
  ): Promise<FixResult> {
    if (!solution.codeSnippet) {
      return {
        applied: false,
        explanation: solution.description,
        error:
          "This solution describes a fix but doesn't include a code snippet. " +
          "Here's what to look for: " +
          solution.description,
      };
    }

    // Extract identifiers from the code snippet
    const identifiers = this.extractIdentifiers(solution.codeSnippet);

    if (identifiers.length === 0) {
      return {
        applied: false,
        explanation: solution.description,
        error:
          "Could not extract identifiable code patterns from the solution. " +
          "You may need to apply this manually: " +
          solution.description,
      };
    }

    // Search for files containing those identifiers
    const candidates = await this.findRelevantFiles(identifiers, projectRoot);

    if (candidates.length === 0) {
      return {
        applied: false,
        explanation: solution.description,
        error:
          `Could not find files containing ${identifiers.slice(0, 3).join(", ")} in your project. ` +
          "The fix may apply to a different part of your code. " +
          "Here's what the solution suggests: " +
          solution.description,
      };
    }

    if (candidates.length > 1) {
      return {
        applied: false,
        candidates,
        explanation: solution.description,
        error:
          `Found ${candidates.length} files that might need this fix. ` +
          "Please specify which file to modify.",
      };
    }

    // Exactly one match - prepare the diff
    const filePath = candidates[0];
    const oldContent = this.fs.readFileSync(filePath, "utf-8");
    const diff = this.generateDiff(oldContent, solution.codeSnippet, filePath);

    return {
      applied: false, // Not yet applied, awaiting user confirmation
      filePath,
      diff,
      explanation:
        `**Why this fix works:** ${solution.description}\n\n` +
        `**File:** ${filePath}\n\n` +
        `**Confidence:** ${solution.confidence}\n\n` +
        "Review the diff above. Say **yes** to apply or **no** to skip.",
    };
  }

  /**
   * Apply a previously prepared fix (after user confirmation).
   * Writes the modified content to disk.
   */
  async applyFix(
    filePath: string,
    newContent: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.fs.writeFileSync(filePath, newContent, "utf-8");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to write to ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Extract identifiers from a code snippet (method names, imports, config keys).
   * Simple regex-based, no AST parsing for v1.
   */
  private extractIdentifiers(codeSnippet: string): string[] {
    const identifiers = new Set<string>();

    // Match import names: import { Foo } from ...
    const importMatches = codeSnippet.matchAll(
      /import\s*\{([^}]+)\}/g
    );
    for (const m of importMatches) {
      for (const name of m[1].split(",")) {
        const trimmed = name.trim();
        if (trimmed.length >= 3) {
          identifiers.add(trimmed);
        }
      }
    }

    // Match method calls: foo.bar( or bar(
    const callMatches = codeSnippet.matchAll(
      /\b([a-zA-Z_][\w]*)\s*\(/g
    );
    for (const m of callMatches) {
      const name = m[1];
      // Skip common keywords
      if (
        !["if", "for", "while", "switch", "catch", "return", "function", "new", "typeof", "instanceof"].includes(
          name
        ) &&
        name.length >= 3
      ) {
        identifiers.add(name);
      }
    }

    // Match property access: foo.barBaz
    const propMatches = codeSnippet.matchAll(
      /\.([a-zA-Z_][\w]{2,})/g
    );
    for (const m of propMatches) {
      identifiers.add(m[1]);
    }

    return [...identifiers];
  }

  /**
   * Search project files for identifiers from the solution.
   * Uses simple fs traversal + string matching (no AST parsing for v1).
   */
  private async findRelevantFiles(
    identifiers: string[],
    projectRoot: string
  ): Promise<string[]> {
    const matches: string[] = [];
    const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

    try {
      this.walkDirectory(projectRoot, extensions, (filePath) => {
        try {
          const content = this.fs.readFileSync(filePath, "utf-8");
          const matchCount = identifiers.filter((id) =>
            content.includes(id)
          ).length;
          // Require at least half the identifiers to match
          if (matchCount >= Math.ceil(identifiers.length / 2)) {
            matches.push(filePath);
          }
        } catch {
          // Skip unreadable files
        }
      });
    } catch {
      // Skip unreadable directories
    }

    return matches;
  }

  /**
   * Walk a directory tree, calling callback for files matching extensions.
   * Skips node_modules, .git, dist, build directories.
   */
  private walkDirectory(
    dir: string,
    extensions: string[],
    callback: (filePath: string) => void
  ): void {
    const SKIP_DIRS = new Set([
      "node_modules",
      ".git",
      "dist",
      "build",
      ".next",
      "coverage",
    ]);

    let entries: fs.Dirent[];
    try {
      entries = this.fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          this.walkDirectory(
            path.join(dir, entry.name),
            extensions,
            callback
          );
        }
      } else if (
        entry.isFile() &&
        extensions.some((ext) => entry.name.endsWith(ext))
      ) {
        callback(path.join(dir, entry.name));
      }
    }
  }

  /**
   * Generate a human-readable diff between old content and a solution snippet.
   * Shows the file context and where the solution code would apply.
   */
  private generateDiff(
    oldContent: string,
    solutionSnippet: string,
    filePath: string
  ): string {
    const lines: string[] = [];
    lines.push(`--- ${filePath}`);
    lines.push(`+++ ${filePath} (with fix applied)`);
    lines.push("");
    lines.push("The solution suggests applying this code:");
    lines.push("");
    lines.push("```");
    lines.push(solutionSnippet);
    lines.push("```");
    lines.push("");
    lines.push(
      "Review the suggestion above and confirm if you'd like me to apply it."
    );

    return lines.join("\n");
  }
}
