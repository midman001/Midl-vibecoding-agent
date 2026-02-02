import { describe, it, expect } from "vitest";
import { ApplicabilityScorer } from "./applicability-scorer.js";
import { Solution, UserContext, IssueComment } from "../types/search-types.js";

function makeComment(): IssueComment {
  return {
    id: 1,
    author: "helper",
    body: "fix here",
    createdAt: "2025-01-01T00:00:00Z",
    isAuthor: false,
    reactions: { totalCount: 0, plusOne: 0, heart: 0 },
  };
}

function makeSolution(overrides: Partial<Solution> = {}): Solution {
  return {
    type: "fix",
    description: "Update the provider",
    sourceComment: makeComment(),
    confidence: "suggested",
    isOfficial: false,
    context: {},
    ...overrides,
  };
}

function makeUserContext(overrides: Partial<UserContext> = {}): UserContext {
  return {
    description: "My app crashes",
    ...overrides,
  };
}

describe("ApplicabilityScorer", () => {
  const scorer = new ApplicabilityScorer();

  it("returns score 0 when no context matches", () => {
    const result = scorer.scoreApplicability(makeSolution(), makeUserContext());
    expect(result.score).toBe(0);
    expect(result.level).toBe("probably not relevant");
  });

  it("adds 0.40 for exact error message match", () => {
    const solution = makeSolution({
      context: { errorMessage: "Transaction failed: insufficient funds" },
    });
    const user = makeUserContext({
      errorMessage: "Transaction failed: insufficient funds",
    });
    const result = scorer.scoreApplicability(solution, user);
    expect(result.score).toBeCloseTo(0.4, 1);
  });

  it("adds 0.20 for partial error message match (substring)", () => {
    const solution = makeSolution({
      context: { errorMessage: "insufficient funds" },
    });
    const user = makeUserContext({
      errorMessage: "Transaction failed: insufficient funds",
    });
    const result = scorer.scoreApplicability(solution, user);
    expect(result.score).toBeCloseTo(0.2, 1);
  });

  it("adds 0.20 for same SDK version", () => {
    const solution = makeSolution({ context: { sdkVersion: "1.3.0" } });
    const user = makeUserContext({ sdkVersion: "1.3.0" });
    const result = scorer.scoreApplicability(solution, user);
    expect(result.score).toBeCloseTo(0.2, 1);
  });

  it("adds 0.15 for same network", () => {
    const solution = makeSolution({ context: { network: "testnet" } });
    const user = makeUserContext({ network: "testnet" });
    const result = scorer.scoreApplicability(solution, user);
    expect(result.score).toBeCloseTo(0.15, 2);
  });

  it("adds 0.15 for same method name", () => {
    const solution = makeSolution({ context: { methodName: "broadcastTransaction" } });
    const user = makeUserContext({ methodName: "broadcastTransaction" });
    const result = scorer.scoreApplicability(solution, user);
    expect(result.score).toBeCloseTo(0.15, 2);
  });

  it("adds 0.10 for confirmed fix", () => {
    const solution = makeSolution({ confidence: "confirmed" });
    const result = scorer.scoreApplicability(solution, makeUserContext());
    expect(result.score).toBeCloseTo(0.1, 1);
  });

  it("scores >= 0.6 as 'very likely'", () => {
    const solution = makeSolution({
      confidence: "confirmed",
      context: {
        errorMessage: "insufficient funds",
        sdkVersion: "1.3.0",
        network: "testnet",
      },
    });
    const user = makeUserContext({
      errorMessage: "insufficient funds",
      sdkVersion: "1.3.0",
      network: "testnet",
    });
    const result = scorer.scoreApplicability(solution, user);
    expect(result.score).toBeGreaterThanOrEqual(0.6);
    expect(result.level).toBe("very likely");
  });

  it("scores 0.3-0.6 as 'might help'", () => {
    const solution = makeSolution({
      context: { errorMessage: "insufficient funds" },
    });
    const user = makeUserContext({
      errorMessage: "insufficient funds",
    });
    const result = scorer.scoreApplicability(solution, user);
    expect(result.score).toBeGreaterThanOrEqual(0.3);
    expect(result.score).toBeLessThan(0.6);
    expect(result.level).toBe("might help");
  });

  it("provides reasons array explaining matches", () => {
    const solution = makeSolution({
      context: { errorMessage: "insufficient funds", network: "testnet" },
    });
    const user = makeUserContext({
      errorMessage: "insufficient funds",
      network: "testnet",
    });
    const result = scorer.scoreApplicability(solution, user);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons.some((r) => r.toLowerCase().includes("error"))).toBe(true);
    expect(result.reasons.some((r) => r.toLowerCase().includes("network"))).toBe(true);
  });

  it("does not penalize missing context fields (no negative scores)", () => {
    const solution = makeSolution({ context: { sdkVersion: "1.3.0" } });
    const user = makeUserContext(); // no sdkVersion
    const result = scorer.scoreApplicability(solution, user);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("clamps score to max 1.0", () => {
    // All fields match + confirmed
    const solution = makeSolution({
      confidence: "confirmed",
      context: {
        errorMessage: "err",
        sdkVersion: "1.0.0",
        network: "testnet",
        methodName: "broadcastTransaction",
      },
    });
    const user = makeUserContext({
      errorMessage: "err",
      sdkVersion: "1.0.0",
      network: "testnet",
      methodName: "broadcastTransaction",
    });
    const result = scorer.scoreApplicability(solution, user);
    expect(result.score).toBeLessThanOrEqual(1.0);
  });
});
