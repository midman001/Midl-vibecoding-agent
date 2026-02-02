import {
  ApplicabilityResult,
  SearchConfig,
  Solution,
  UserContext,
} from "../types/search-types.js";

const DEFAULT_WEIGHTS: SearchConfig["applicabilityWeights"] = {
  errorMessage: 0.4,
  sdkVersion: 0.2,
  network: 0.15,
  methodName: 0.15,
  confirmedFix: 0.1,
};

export class ApplicabilityScorer {
  private weights: SearchConfig["applicabilityWeights"];

  constructor(deps?: {
    weights?: Partial<SearchConfig["applicabilityWeights"]>;
  }) {
    this.weights = { ...DEFAULT_WEIGHTS, ...deps?.weights };
  }

  scoreApplicability(
    solution: Solution,
    userContext: UserContext
  ): ApplicabilityResult {
    let score = 0;
    const reasons: string[] = [];

    // Error message comparison
    if (solution.context.errorMessage && userContext.errorMessage) {
      const solErr = solution.context.errorMessage.toLowerCase();
      const userErr = userContext.errorMessage.toLowerCase();

      if (solErr === userErr) {
        score += this.weights.errorMessage;
        reasons.push(`Exact error message match (+${this.weights.errorMessage})`);
      } else if (userErr.includes(solErr) || solErr.includes(userErr)) {
        const partial = this.weights.errorMessage / 2;
        score += partial;
        reasons.push(`Partial error message match (+${partial})`);
      }
    }

    // SDK version
    if (solution.context.sdkVersion && userContext.sdkVersion) {
      if (solution.context.sdkVersion === userContext.sdkVersion) {
        score += this.weights.sdkVersion;
        reasons.push(`Same SDK version: ${userContext.sdkVersion} (+${this.weights.sdkVersion})`);
      }
    }

    // Network
    if (solution.context.network && userContext.network) {
      if (solution.context.network === userContext.network) {
        score += this.weights.network;
        reasons.push(`Same network: ${userContext.network} (+${this.weights.network})`);
      }
    }

    // Method name
    if (solution.context.methodName && userContext.methodName) {
      if (solution.context.methodName === userContext.methodName) {
        score += this.weights.methodName;
        reasons.push(`Same method: ${userContext.methodName} (+${this.weights.methodName})`);
      }
    }

    // Confirmed fix bonus
    if (solution.confidence === "confirmed") {
      score += this.weights.confirmedFix;
      reasons.push(`Confirmed fix (+${this.weights.confirmedFix})`);
    }

    // Clamp
    score = Math.min(1, Math.max(0, score));

    // Level
    let level: ApplicabilityResult["level"];
    if (score >= 0.6) {
      level = "very likely";
    } else if (score >= 0.3) {
      level = "might help";
    } else {
      level = "probably not relevant";
    }

    return { solution, score, level, reasons };
  }
}
