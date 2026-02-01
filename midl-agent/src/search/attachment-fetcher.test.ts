import { describe, it, expect, vi } from "vitest";
import { AttachmentFetcher } from "./attachment-fetcher.js";

describe("AttachmentFetcher", () => {
  describe("extractAttachmentUrls", () => {
    it("returns empty array for empty body", () => {
      const fetcher = new AttachmentFetcher();
      expect(fetcher.extractAttachmentUrls("")).toEqual([]);
    });

    it("returns empty array for null/undefined body", () => {
      const fetcher = new AttachmentFetcher();
      expect(fetcher.extractAttachmentUrls(null as any)).toEqual([]);
      expect(fetcher.extractAttachmentUrls(undefined as any)).toEqual([]);
    });

    it("returns empty array when no attachment URLs present", () => {
      const fetcher = new AttachmentFetcher();
      const body = "This is a regular issue with no attachments. https://google.com";
      expect(fetcher.extractAttachmentUrls(body)).toEqual([]);
    });

    it("extracts user-attachments URLs", () => {
      const fetcher = new AttachmentFetcher();
      const url = "https://github.com/user-attachments/assets/abc-123/MIDL_SDK_REPORT.md";
      const body = `Here is the report:\n[report](${url})\nPlease review.`;
      expect(fetcher.extractAttachmentUrls(body)).toEqual([url]);
    });

    it("extracts multiple attachment URLs", () => {
      const fetcher = new AttachmentFetcher();
      const url1 = "https://github.com/user-attachments/assets/abc-123/report.md";
      const url2 = "https://github.com/user-attachments/assets/def-456/log.txt";
      const body = `[report](${url1})\n[log](${url2})`;
      expect(fetcher.extractAttachmentUrls(body)).toEqual([url1, url2]);
    });

    it("extracts repo files URLs", () => {
      const fetcher = new AttachmentFetcher();
      const url = "https://github.com/midl-xyz/midl-js/files/12345/error-log.txt";
      const body = `See attached: ${url}`;
      expect(fetcher.extractAttachmentUrls(body)).toEqual([url]);
    });

    it("extracts user-attachments URLs without file extension", () => {
      const fetcher = new AttachmentFetcher();
      const url = "https://github.com/user-attachments/assets/abc-def-123";
      const body = `Attachment: ${url}`;
      expect(fetcher.extractAttachmentUrls(body)).toEqual([url]);
    });
  });

  describe("fetchAttachmentContent", () => {
    it("returns empty string for empty body", async () => {
      const fetcher = new AttachmentFetcher();
      expect(await fetcher.fetchAttachmentContent(1, "")).toBe("");
    });

    it("returns empty string when no attachment URLs found", async () => {
      const fetcher = new AttachmentFetcher();
      expect(await fetcher.fetchAttachmentContent(1, "no attachments here")).toBe("");
    });

    it("fetches and concatenates attachment content", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("Content A") })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("Content B") });

      const fetcher = new AttachmentFetcher({ fetchFn: mockFetch as any });
      const url1 = "https://github.com/user-attachments/assets/abc/report.md";
      const url2 = "https://github.com/user-attachments/assets/def/log.txt";
      const body = `[r](${url1})\n[l](${url2})`;

      const result = await fetcher.fetchAttachmentContent(42, body);
      expect(result).toBe("Content A\n\nContent B");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("skips failed fetches gracefully", async () => {
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("Content B") });

      const fetcher = new AttachmentFetcher({ fetchFn: mockFetch as any });
      const url1 = "https://github.com/user-attachments/assets/abc/a.md";
      const url2 = "https://github.com/user-attachments/assets/def/b.md";
      const body = `${url1}\n${url2}`;

      const result = await fetcher.fetchAttachmentContent(1, body);
      expect(result).toBe("Content B");
    });

    it("returns empty string when all fetches fail", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("fail"));
      const fetcher = new AttachmentFetcher({ fetchFn: mockFetch as any });
      const body = "https://github.com/user-attachments/assets/abc/a.md";

      const result = await fetcher.fetchAttachmentContent(1, body);
      expect(result).toBe("");
    });

    it("skips non-ok responses", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve("Not found") });
      const fetcher = new AttachmentFetcher({ fetchFn: mockFetch as any });
      const body = "https://github.com/user-attachments/assets/abc/a.md";

      const result = await fetcher.fetchAttachmentContent(1, body);
      expect(result).toBe("");
    });

    it("uses cache on second call for same issue", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValue({ ok: true, text: () => Promise.resolve("Cached content") });

      const fetcher = new AttachmentFetcher({ fetchFn: mockFetch as any });
      const body = "https://github.com/user-attachments/assets/abc/a.md";

      await fetcher.fetchAttachmentContent(10, body);
      const result = await fetcher.fetchAttachmentContent(10, body);

      expect(result).toBe("Cached content");
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only fetched once
    });

    it("times out slow fetches after 3 seconds", async () => {
      const mockFetch = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, text: () => "late" }), 5000))
      );

      const fetcher = new AttachmentFetcher({ fetchFn: mockFetch as any });
      const body = "https://github.com/user-attachments/assets/abc/a.md";

      const result = await fetcher.fetchAttachmentContent(1, body);
      expect(result).toBe("");
    }, 10000);
  });
});
