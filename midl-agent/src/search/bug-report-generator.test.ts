import { describe, it, expect } from "vitest";
import { BugReportGenerator } from "./bug-report-generator.js";

describe("BugReportGenerator", () => {
  const gen = new BugReportGenerator();

  describe("generate", () => {
    it("extracts error message from description containing Error:", () => {
      const draft = gen.generate(
        'Transaction fails with Error: insufficient funds on testnet'
      );
      expect(draft.errorOutput).toBe("insufficient funds on testnet");
    });

    it("extracts SDK version from @midl/react pattern", () => {
      const draft = gen.generate(
        "Using @midl/react 1.2.3 and getting a crash"
      );
      expect(draft.environment.sdkVersion).toBe("@midl/react 1.2.3");
    });

    it("extracts network from testnet/mainnet mentions", () => {
      const draft = gen.generate("Fails on testnet but works on mainnet");
      expect(draft.environment.network).toBe("testnet");
    });

    it("generates title under 80 chars", () => {
      const longDesc =
        "This is a very long description that goes on and on about an error that happened when I was trying to broadcast a transaction using the MIDL SDK on testnet with a very specific configuration that I spent hours debugging";
      const draft = gen.generate(longDesc);
      expect(draft.title.length).toBeLessThanOrEqual(80);
    });

    it("generates title from method + error when available", () => {
      const draft = gen.generate(
        "broadcastTransaction() fails with Error: timeout exceeded"
      );
      expect(draft.title).toContain("broadcastTransaction");
      expect(draft.title).toContain("timeout exceeded");
    });

    it("handles empty/minimal description gracefully", () => {
      const draft = gen.generate("");
      expect(draft.title).toBeTruthy();
      expect(draft.severity).toBe("low");
      expect(draft.description).toBe("");
    });

    it("infers critical severity for crash mentions", () => {
      const draft = gen.generate("The app crashes when I call connect()");
      expect(draft.severity).toBe("critical");
    });

    it("infers high severity for error mentions", () => {
      const draft = gen.generate("Getting an error with sendTransaction");
      expect(draft.severity).toBe("high");
    });

    it("allows additionalContext to override extracted values", () => {
      const draft = gen.generate("Some problem on testnet", {
        title: "Custom title",
        severity: "critical",
      });
      expect(draft.title).toBe("Custom title");
      expect(draft.severity).toBe("critical");
    });
  });

  describe("formatAsMarkdown", () => {
    it("produces valid markdown with all sections", () => {
      const draft = gen.generate(
        "Error: something broke using @midl/react 1.0.0 on testnet"
      );
      const md = gen.formatAsMarkdown(draft);
      expect(md).toContain("## Description");
      expect(md).toContain("## Expected vs Actual Behavior");
      expect(md).toContain("## Environment");
      expect(md).toContain("## Error Output");
      expect(md).toContain("**Severity:**");
    });
  });

  describe("formatAsGitHubLink", () => {
    it("produces valid URL-encoded GitHub link", () => {
      const draft = gen.generate("Test bug");
      const url = gen.formatAsGitHubLink(draft, "midl-xyz", "midl-js");
      expect(url).toContain(
        "https://github.com/midl-xyz/midl-js/issues/new?"
      );
      expect(url).toContain("title=");
      expect(url).toContain("body=");
    });
  });
});
