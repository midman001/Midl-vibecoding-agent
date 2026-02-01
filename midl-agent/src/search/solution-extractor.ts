import {
  GitHubIssueResult,
  IssueComment,
  Solution,
} from "../types/search-types.js";

const POSITIVE_SIGNALS = [
  "this worked",
  "fixed it",
  "fixed by",
  "fixed in",
  "resolved",
  "the fix is",
  "this fixed",
  "solution is",
  "solved by",
  "as a workaround",
  "changing the config",
  "change the",
  "update the",
  "upgrading",
  "upgrade to",
];

const NEGATIVE_SIGNALS = [
  "didn't work",
  "doesn't work",
  "did not work",
  "still broken",
  "still not working",
  "same issue",
  "no luck",
  "not fixed",
];

const NETWORK_KEYWORDS = ["testnet", "mainnet", "devnet", "signet", "regtest"];

const METHOD_NAMES = [
  "broadcastTransaction",
  "signTransaction",
  "sendTransaction",
  "getBalance",
  "getTransaction",
  "connectWallet",
  "useAccount",
  "useMidl",
  "useConnect",
  "estimateFee",
];

const SDK_VERSION_PATTERN = /(?:@midl\/\w+\s+|v)((\d+\.\d+\.\d+))/i;

export class SolutionExtractor {
  extract(issue: GitHubIssueResult, comments: IssueComment[]): Solution[] {
    const solutions: Solution[] = [];

    for (const comment of comments) {
      const bodyLower = comment.body.toLowerCase();

      // Skip if negative signals present
      if (NEGATIVE_SIGNALS.some((sig) => bodyLower.includes(sig))) {
        continue;
      }

      // Check for positive signals
      const hasPositiveSignal = POSITIVE_SIGNALS.some((sig) =>
        bodyLower.includes(sig)
      );

      if (!hasPositiveSignal) {
        continue;
      }

      // Extract code snippet
      const codeMatch = comment.body.match(/```[\w]*\n([\s\S]*?)```/);
      const codeSnippet = codeMatch ? codeMatch[1].trim() : undefined;

      // Determine type
      const type = this.classifyType(bodyLower);

      // Determine confidence
      const confidence = this.determineConfidence(comment);

      // Extract context
      const context = this.extractContext(comment.body);

      // Build description
      const description = comment.body
        .replace(/```[\w]*\n[\s\S]*?```/g, "")
        .trim()
        .slice(0, 200);

      solutions.push({
        type,
        description,
        codeSnippet,
        sourceComment: comment,
        confidence,
        context,
      });
    }

    return solutions;
  }

  private classifyType(bodyLower: string): Solution["type"] {
    if (bodyLower.includes("workaround") || bodyLower.includes("alternative")) {
      return "workaround";
    }
    if (
      bodyLower.includes("config") ||
      bodyLower.includes("setting") ||
      bodyLower.includes("changing the config")
    ) {
      return "config-change";
    }
    return "fix";
  }

  private determineConfidence(comment: IssueComment): Solution["confidence"] {
    const bodyLower = comment.body.toLowerCase();

    // Confirmed if: issue author says it worked, or high reactions
    if (comment.isAuthor && bodyLower.includes("this worked")) {
      return "confirmed";
    }
    if (comment.reactions.plusOne >= 2) {
      return "confirmed";
    }

    return "suggested";
  }

  private extractContext(body: string): Solution["context"] {
    const context: Solution["context"] = {};

    // SDK version
    const versionMatch = body.match(SDK_VERSION_PATTERN);
    if (versionMatch) {
      context.sdkVersion = versionMatch[1];
    }

    // Network
    const bodyLower = body.toLowerCase();
    for (const network of NETWORK_KEYWORDS) {
      if (bodyLower.includes(network)) {
        context.network = network;
        break;
      }
    }

    // Method name
    for (const method of METHOD_NAMES) {
      if (body.includes(method)) {
        context.methodName = method;
        break;
      }
    }

    return context;
  }
}
