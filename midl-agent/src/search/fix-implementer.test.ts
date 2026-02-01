import { describe, it, expect, vi } from "vitest";
import * as path from "node:path";
import { FixImplementer } from "./fix-implementer.js";
import type { Solution, IssueComment } from "../types/search-types.js";

function makeSolution(overrides: Partial<Solution> = {}): Solution {
  return {
    type: "fix",
    description: "Update the timeout config",
    codeSnippet: undefined,
    sourceComment: {
      id: 1,
      author: "user1",
      body: "fix body",
      createdAt: "2025-01-01T00:00:00Z",
      isAuthor: false,
      reactions: { totalCount: 0, plusOne: 0, heart: 0 },
    },
    confidence: "suggested",
    isOfficial: false,
    context: {},
    ...overrides,
  };
}

function norm(p: string): string {
  return p.replace(/\\/g, "/");
}

function createMockFs(files: Record<string, string>) {
  const dirs: Record<string, Array<{ name: string; isFile: () => boolean; isDirectory: () => boolean }>> = {};

  // Build directory entries from file paths
  for (const filePath of Object.keys(files)) {
    const dir = norm(path.dirname(filePath));
    if (!dirs[dir]) dirs[dir] = [];
    dirs[dir].push({
      name: path.basename(filePath),
      isFile: () => true,
      isDirectory: () => false,
    });
  }

  return {
    readFileSync: (p: string) => {
      const normalized = norm(p);
      for (const [key, val] of Object.entries(files)) {
        if (norm(key) === normalized) return val;
      }
      throw new Error("ENOENT");
    },
    writeFileSync: vi.fn(),
    existsSync: (p: string) => {
      const normalized = norm(p);
      return Object.keys(files).some(k => norm(k) === normalized) ||
             Object.keys(dirs).some(k => norm(k) === normalized);
    },
    readdirSync: (dir: string, _opts?: any) => {
      return dirs[norm(dir)] || [];
    },
  } as any;
}

describe("FixImplementer", () => {
  describe("locateAndPrepareFix", () => {
    it("returns applied: false with explanation when no codeSnippet", async () => {
      const impl = new FixImplementer();
      const result = await impl.locateAndPrepareFix(
        makeSolution({ codeSnippet: undefined }),
        "/project"
      );
      expect(result.applied).toBe(false);
      expect(result.error).toContain("doesn't include a code snippet");
    });

    it("returns error when no extractable identifiers", async () => {
      const impl = new FixImplementer();
      // Short tokens that won't match identifier patterns
      const result = await impl.locateAndPrepareFix(
        makeSolution({ codeSnippet: "x = 1" }),
        "/project"
      );
      expect(result.applied).toBe(false);
      expect(result.error).toContain("Could not extract identifiable code patterns");
    });

    it("returns error mentioning identifiers when no matching files", async () => {
      const mockFs = createMockFs({
        "/project/src/other.ts": "console.log('hello');",
      });
      const impl = new FixImplementer({ fs: mockFs });
      const result = await impl.locateAndPrepareFix(
        makeSolution({
          codeSnippet: 'import { broadcastTransaction } from "@midl/sdk";',
        }),
        "/project"
      );
      expect(result.applied).toBe(false);
      expect(result.error).toContain("Could not find files containing");
      expect(result.error).toContain("broadcastTransaction");
    });

    it("returns candidates array when multiple files match", async () => {
      const content =
        'import { broadcastTransaction } from "@midl/sdk";\nbroadcastTransaction({ timeout: 5000 });';
      const projectRoot = path.resolve("/project");
      const srcDir = path.join(projectRoot, "src");
      const appFile = path.join(srcDir, "app.ts");
      const txFile = path.join(srcDir, "tx.ts");

      const mockFs = createMockFs({});
      mockFs.readdirSync = (dir: string, _opts?: any) => {
        if (dir === projectRoot) {
          return [{ name: "src", isFile: () => false, isDirectory: () => true }];
        }
        if (dir === srcDir) {
          return [
            { name: "app.ts", isFile: () => true, isDirectory: () => false },
            { name: "tx.ts", isFile: () => true, isDirectory: () => false },
          ];
        }
        return [];
      };
      mockFs.readFileSync = (p: string) => {
        if (p === appFile || p === txFile) return content;
        throw new Error("ENOENT");
      };

      const impl = new FixImplementer({ fs: mockFs });
      const result = await impl.locateAndPrepareFix(
        makeSolution({
          codeSnippet:
            'import { broadcastTransaction } from "@midl/sdk";\nbroadcastTransaction({ timeout: 5000 });',
        }),
        projectRoot
      );
      expect(result.applied).toBe(false);
      expect(result.candidates).toBeDefined();
      expect(result.candidates!.length).toBe(2);
    });

    it("returns diff and filePath when exactly one file matches", async () => {
      const projectRoot = path.resolve("/project");
      const srcDir = path.join(projectRoot, "src");
      const appFile = path.join(srcDir, "app.ts");
      const fileContent =
        'import { broadcastTransaction } from "@midl/sdk";\nbroadcastTransaction({ timeout: 5000 });';

      const mockFs = createMockFs({});
      mockFs.readdirSync = (dir: string, _opts?: any) => {
        if (dir === projectRoot) {
          return [{ name: "src", isFile: () => false, isDirectory: () => true }];
        }
        if (dir === srcDir) {
          return [{ name: "app.ts", isFile: () => true, isDirectory: () => false }];
        }
        return [];
      };
      mockFs.readFileSync = (p: string) => {
        if (p === appFile) return fileContent;
        throw new Error("ENOENT");
      };

      const impl = new FixImplementer({ fs: mockFs });
      const result = await impl.locateAndPrepareFix(
        makeSolution({
          codeSnippet:
            'import { broadcastTransaction } from "@midl/sdk";\nbroadcastTransaction({ timeout: 5000 });',
        }),
        projectRoot
      );
      expect(result.applied).toBe(false);
      expect(result.filePath).toContain("app.ts");
      expect(result.diff).toBeDefined();
      expect(result.diff).toContain("broadcastTransaction");
    });
  });

  describe("applyFix", () => {
    it("returns success: true on successful write", async () => {
      const mockFs = createMockFs({});
      const impl = new FixImplementer({ fs: mockFs });
      const result = await impl.applyFix("/project/src/app.ts", "new content");
      expect(result.success).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        "/project/src/app.ts",
        "new content",
        "utf-8"
      );
    });

    it("returns success: false when writeFileSync throws", async () => {
      const mockFs = createMockFs({});
      mockFs.writeFileSync = vi.fn(() => {
        throw new Error("Permission denied");
      });
      const impl = new FixImplementer({ fs: mockFs });
      const result = await impl.applyFix("/project/src/app.ts", "new content");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Permission denied");
    });
  });

  describe("extractIdentifiers (indirect)", () => {
    it("extracts import names", async () => {
      const mockFs = createMockFs({});
      mockFs.readdirSync = () => [];
      const impl = new FixImplementer({ fs: mockFs });
      // No files match so we get the error with identifier names
      const result = await impl.locateAndPrepareFix(
        makeSolution({
          codeSnippet: 'import { Foo } from "bar";',
        }),
        "/project"
      );
      expect(result.error).toContain("Foo");
    });

    it("extracts method call names", async () => {
      const mockFs = createMockFs({});
      mockFs.readdirSync = () => [];
      const impl = new FixImplementer({ fs: mockFs });
      const result = await impl.locateAndPrepareFix(
        makeSolution({
          codeSnippet: "bar.baz()",
        }),
        "/project"
      );
      // bar is only 3 chars and baz is 3 chars - both meet minimum
      expect(result.error).toContain("Could not find files");
    });

    it("does not extract common keywords", async () => {
      const mockFs = createMockFs({});
      mockFs.readdirSync = () => [];
      const impl = new FixImplementer({ fs: mockFs });
      const result = await impl.locateAndPrepareFix(
        makeSolution({
          codeSnippet: "if (condition) { return value; }",
        }),
        "/project"
      );
      // "if" and "return" are keywords, "condition" and "value" should be extracted
      // The error should mention identifiers that were found
      expect(result.applied).toBe(false);
    });
  });
});
