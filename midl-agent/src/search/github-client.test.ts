import { describe, it, expect, vi } from "vitest";
import { GitHubClient } from "./github-client.js";

function makeConfig(overrides: Record<string, any> = {}) {
  return { token: "ghp_testtoken123", owner: "", repo: "", ...overrides };
}

function makeMockOctokit(overrides: Record<string, any> = {}) {
  return {
    rest: {
      search: {
        issuesAndPullRequests: vi.fn().mockResolvedValue({
          data: { items: [] },
        }),
      },
      issues: {
        get: vi.fn().mockResolvedValue({ data: {} }),
      },
      rateLimit: {
        get: vi.fn().mockResolvedValue({
          data: {
            resources: {
              search: { remaining: 30, limit: 30, reset: Math.floor(Date.now() / 1000) + 3600 },
            },
          },
        }),
      },
      ...overrides,
    },
  } as any;
}

describe("GitHubClient", () => {
  it("throws on missing token", () => {
    expect(() => new GitHubClient({ token: "", owner: "", repo: "" })).toThrow(
      "GitHub token is required"
    );
  });

  it("throws on empty string token", () => {
    expect(
      () => new GitHubClient({ token: "   ", owner: "", repo: "" })
    ).toThrow("GitHub token is required");
  });

  it("uses production repo by default", () => {
    const client = new GitHubClient(makeConfig(), makeMockOctokit());
    expect(client.owner).toBe("midl-xyz");
    expect(client.repo).toBe("midl-js");
  });

  it("uses testing repo when testingMode is true", () => {
    const client = new GitHubClient(
      makeConfig({ testingMode: true }),
      makeMockOctokit()
    );
    expect(client.owner).toBe("midman001");
    expect(client.repo).toBe("agent-testing");
  });

  it("searchIssues builds correct query", async () => {
    const mock = makeMockOctokit();
    const client = new GitHubClient(makeConfig(), mock);

    await client.searchIssues("wallet error");

    expect(mock.rest.search.issuesAndPullRequests).toHaveBeenCalledWith(
      expect.objectContaining({
        q: expect.stringContaining("wallet error"),
      })
    );
    expect(mock.rest.search.issuesAndPullRequests).toHaveBeenCalledWith(
      expect.objectContaining({
        q: expect.stringContaining("repo:midl-xyz/midl-js"),
      })
    );
  });

  it("searchIssues maps results correctly", async () => {
    const mock = makeMockOctokit();
    mock.rest.search.issuesAndPullRequests.mockResolvedValue({
      data: {
        items: [
          {
            number: 42,
            title: "Test issue",
            html_url: "https://github.com/midl-xyz/midl-js/issues/42",
            state: "open",
            labels: [{ name: "bug" }],
            comments: 3,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-02T00:00:00Z",
            body: "Issue body",
            user: { login: "testuser" },
          },
        ],
      },
    });

    const client = new GitHubClient(makeConfig(), mock);
    const results = await client.searchIssues("test");

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      number: 42,
      title: "Test issue",
      url: "https://github.com/midl-xyz/midl-js/issues/42",
      status: "open",
      labels: ["bug"],
      comments: 3,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
      body: "Issue body",
      author: "testuser",
    });
  });

  it("handles rate limit exhaustion", async () => {
    const mock = makeMockOctokit();
    mock.rest.rateLimit.get.mockResolvedValue({
      data: {
        resources: {
          search: { remaining: 0, limit: 30, reset: Math.floor(Date.now() / 1000) + 3600 },
        },
      },
    });

    const client = new GitHubClient(makeConfig(), mock);

    await expect(client.searchIssues("test")).rejects.toThrow(
      "rate limit exhausted"
    );
  });

  it("handles auth failure (401)", async () => {
    const mock = makeMockOctokit();
    mock.rest.rateLimit.get.mockResolvedValue({
      data: {
        resources: {
          search: { remaining: 30, limit: 30, reset: Math.floor(Date.now() / 1000) + 3600 },
        },
      },
    });
    mock.rest.search.issuesAndPullRequests.mockRejectedValue({ status: 401 });

    const client = new GitHubClient(makeConfig(), mock);

    await expect(client.searchIssues("test")).rejects.toThrow(
      "authentication failed"
    );
  });
});
