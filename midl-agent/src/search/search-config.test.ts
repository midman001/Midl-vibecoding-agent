import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "node:fs";
import { loadSearchConfig, DEFAULT_SEARCH_CONFIG } from "./search-config.js";

vi.mock("node:fs");

const mockedFs = vi.mocked(fs);

describe("loadSearchConfig", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns defaults when no path provided", () => {
    const config = loadSearchConfig();
    expect(config).toEqual(DEFAULT_SEARCH_CONFIG);
  });

  it("returns defaults when file does not exist", () => {
    mockedFs.existsSync.mockReturnValue(false);
    const config = loadSearchConfig("/some/path.json");
    expect(config).toEqual(DEFAULT_SEARCH_CONFIG);
  });

  it("parses valid JSON and merges with defaults", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify({ duplicateThreshold: 0.9, maxResults: 10 })
    );
    const config = loadSearchConfig("/some/path.json");
    expect(config.duplicateThreshold).toBe(0.9);
    expect(config.maxResults).toBe(10);
    expect(config.searchTimeoutMs).toBe(DEFAULT_SEARCH_CONFIG.searchTimeoutMs);
    expect(config.cacheTtlMs).toBe(DEFAULT_SEARCH_CONFIG.cacheTtlMs);
  });

  it("partial config merges with defaults", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify({ duplicateThreshold: 0.5 })
    );
    const config = loadSearchConfig("/path.json");
    expect(config.duplicateThreshold).toBe(0.5);
    expect(config.maxResults).toBe(DEFAULT_SEARCH_CONFIG.maxResults);
    expect(config.applicabilityWeights).toEqual(
      DEFAULT_SEARCH_CONFIG.applicabilityWeights
    );
  });

  it("malformed JSON returns defaults and warns", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue("not json{{{");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const config = loadSearchConfig("/path.json");
    expect(config).toEqual(DEFAULT_SEARCH_CONFIG);
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });

  it("nested applicabilityWeights partial merge works", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify({
        applicabilityWeights: { errorMessage: 0.8 },
      })
    );
    const config = loadSearchConfig("/path.json");
    expect(config.applicabilityWeights.errorMessage).toBe(0.8);
    expect(config.applicabilityWeights.sdkVersion).toBe(
      DEFAULT_SEARCH_CONFIG.applicabilityWeights.sdkVersion
    );
    expect(config.applicabilityWeights.network).toBe(
      DEFAULT_SEARCH_CONFIG.applicabilityWeights.network
    );
  });
});
