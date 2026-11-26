import { TikTokClient } from "../tiktok.js";

describe("TikTokClient", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("reports configured when access token + open id are set", () => {
    process.env.TIKTOK_ACCESS_TOKEN = "act.test";
    process.env.TIKTOK_OPEN_ID = "oid.test";
    delete process.env.TIKTOK_REFRESH_TOKEN;
    delete process.env.TIKTOK_CLIENT_KEY;
    delete process.env.TIKTOK_CLIENT_SECRET;

    expect(TikTokClient.isConfigured()).toBe(true);
  });

  it("reports configured when refresh credentials are set", () => {
    delete process.env.TIKTOK_ACCESS_TOKEN;
    process.env.TIKTOK_REFRESH_TOKEN = "rft.test";
    process.env.TIKTOK_CLIENT_KEY = "key";
    process.env.TIKTOK_CLIENT_SECRET = "secret";

    expect(TikTokClient.isConfigured()).toBe(true);
  });

  it("reports not configured without credentials", () => {
    delete process.env.TIKTOK_ACCESS_TOKEN;
    delete process.env.TIKTOK_REFRESH_TOKEN;
    delete process.env.TIKTOK_CLIENT_KEY;
    delete process.env.TIKTOK_CLIENT_SECRET;

    expect(TikTokClient.isConfigured()).toBe(false);
  });

  it("builds an authorize URL with required params", () => {
    const url = TikTokClient.getAuthorizationUrl({
      clientKey: "ck_test",
      redirectUri: "https://example.com/auth/tiktok/callback",
      state: "csrf123",
    });

    expect(url).toContain("https://www.tiktok.com/v2/auth/authorize/");
    expect(url).toContain("client_key=ck_test");
    expect(url).toContain(
      encodeURIComponent("https://example.com/auth/tiktok/callback"),
    );
    expect(url).toContain("state=csrf123");
    expect(url).toContain("response_type=code");
    expect(url).toContain(encodeURIComponent("user.info.basic,video.publish"));
  });

  it("requires access token and open id in the constructor", () => {
    delete process.env.TIKTOK_ACCESS_TOKEN;
    delete process.env.TIKTOK_OPEN_ID;

    expect(() => new TikTokClient()).toThrow(/access token/i);
    expect(
      () =>
        new TikTokClient({
          accessToken: "act",
        }),
    ).toThrow(/open ID/i);
  });
});
