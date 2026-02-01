import * as fs from "node:fs";

export interface ApplicabilityWeights {
  errorMessage: number;
  sdkVersion: number;
  network: number;
  methodName: number;
  confirmedFix: number;
}

export interface SearchConfig {
  duplicateThreshold: number;
  maxResults: number;
  searchTimeoutMs: number;
  cacheTtlMs: number;
  applicabilityWeights: ApplicabilityWeights;
}

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  duplicateThreshold: 0.75,
  maxResults: 5,
  searchTimeoutMs: 5000,
  cacheTtlMs: 300000,
  applicabilityWeights: {
    errorMessage: 0.4,
    sdkVersion: 0.2,
    network: 0.15,
    methodName: 0.15,
    confirmedFix: 0.1,
  },
};

export function loadSearchConfig(configPath?: string): SearchConfig {
  if (!configPath) {
    return { ...DEFAULT_SEARCH_CONFIG };
  }

  try {
    if (!fs.existsSync(configPath)) {
      return { ...DEFAULT_SEARCH_CONFIG };
    }

    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<SearchConfig>;

    return {
      duplicateThreshold:
        parsed.duplicateThreshold ?? DEFAULT_SEARCH_CONFIG.duplicateThreshold,
      maxResults: parsed.maxResults ?? DEFAULT_SEARCH_CONFIG.maxResults,
      searchTimeoutMs:
        parsed.searchTimeoutMs ?? DEFAULT_SEARCH_CONFIG.searchTimeoutMs,
      cacheTtlMs: parsed.cacheTtlMs ?? DEFAULT_SEARCH_CONFIG.cacheTtlMs,
      applicabilityWeights: {
        ...DEFAULT_SEARCH_CONFIG.applicabilityWeights,
        ...(parsed.applicabilityWeights ?? {}),
      },
    };
  } catch (error) {
    console.warn(
      `Failed to parse search config at ${configPath}: ${error instanceof Error ? error.message : String(error)}. Using defaults.`
    );
    return { ...DEFAULT_SEARCH_CONFIG };
  }
}
