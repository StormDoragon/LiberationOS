import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decrypt, encrypt } from "@liberation-os/utils";
import { scheduleWithBuffer } from "./buffer";
import { publishContent } from "./publish";
import { publishToWordPress } from "./wordpress";

function decryptedCredentials<T>(value: T): T {
  return JSON.parse(decrypt(encrypt(JSON.stringify(value)))) as T;
}

describe("integration adapters", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "0123456789abcdef".repeat(4);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.ENCRYPTION_KEY;
  });

  it("schedules Buffer posts with decrypted credentials", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          updates: [{ id: "update-1", scheduled_at: 1_800_000_000 }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const credentials = decryptedCredentials({ accessToken: "buffer-token" });
    const result = await scheduleWithBuffer(
      { text: "hello", profileIds: ["profile-1"] },
      credentials,
    );
    expect(result.externalId).toBe("update-1");
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain(
      "access_token=buffer-token",
    );
  });

  it("forwards scheduling and media options to Buffer and reports API failures", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ updates: [] }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("invalid token", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const credentials = decryptedCredentials({ accessToken: "buffer-token" });
    const scheduledAt = "2027-01-15T12:00:00.000Z";

    await expect(
      scheduleWithBuffer(
        {
          text: "hello",
          profileIds: ["profile-1"],
          scheduledAt,
          mediaUrls: ["https://images.test/photo.png"],
        },
        credentials,
      ),
    ).resolves.toMatchObject({ externalId: "unknown", scheduledAt });
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain(
      "media%5Bphoto%5D%5B%5D=https%3A%2F%2Fimages.test%2Fphoto.png",
    );

    await expect(
      scheduleWithBuffer({ text: "retry", profileIds: [] }, credentials),
    ).rejects.toThrow("Buffer API error 401: invalid token");
  });

  it("publishes WordPress posts with decrypted credentials", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 42,
          link: "https://site.test/post",
          status: "publish",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const credentials = decryptedCredentials({
      siteUrl: "https://site.test/",
      username: "editor",
      applicationPassword: "app-pass",
    });
    const result = await publishToWordPress(
      { title: "Title", content: "Body", status: "publish" },
      credentials,
    );
    expect(result).toMatchObject({ externalId: "42", status: "publish" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://site.test/wp-json/wp/v2/posts",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("reports WordPress API failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response("permission denied", { status: 403 })),
    );
    const credentials = decryptedCredentials({
      siteUrl: "https://site.test",
      username: "editor",
      applicationPassword: "app-pass",
    });

    await expect(
      publishToWordPress({ title: "Title", content: "Body" }, credentials),
    ).rejects.toThrow("WordPress API error 403: permission denied");
  });

  it("routes supported providers and rejects unknown adapters", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ updates: [{ id: "buffer-2" }] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const credentials = decryptedCredentials({
      accessToken: "token",
      profileIds: ["p1"],
    });
    await expect(
      publishContent(
        { id: "c1", type: "post", body: "hello" },
        "facebook",
        credentials,
      ),
    ).resolves.toMatchObject({ provider: "facebook", externalId: "buffer-2" });
    await expect(
      publishContent(
        { id: "c1", type: "post", body: "hello" },
        "unknown",
        credentials,
      ),
    ).rejects.toThrow("Unknown integration provider");
  });
});
