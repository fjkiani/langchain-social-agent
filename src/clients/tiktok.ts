interface TikTokTokenResponse {
  access_token?: string;
  expires_in?: number;
  open_id?: string;
  refresh_expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
  log_id?: string;
}

interface TikTokApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    log_id?: string;
  };
}

interface TikTokCreatorInfo {
  creator_avatar_url?: string;
  creator_username?: string;
  creator_nickname?: string;
  privacy_level_options?: string[];
  comment_disabled?: boolean;
  duet_disabled?: boolean;
  stitch_disabled?: boolean;
  max_video_post_duration_sec?: number;
}

interface CreateTikTokPhotoPostRequest {
  title: string;
  description?: string;
  imageUrls: string[];
  privacyLevel?: string;
  disableComment?: boolean;
  autoAddMusic?: boolean;
}

interface CreateTikTokVideoPostRequest {
  title: string;
  videoUrl: string;
  privacyLevel?: string;
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
  videoCoverTimestampMs?: number;
}

interface PublishInitResponse {
  data?: {
    publish_id?: string;
    upload_url?: string;
  };
  error?: {
    code?: string;
    message?: string;
    log_id?: string;
  };
}

const TIKTOK_API_BASE = "https://open.tiktokapis.com";
const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const DEFAULT_SCOPES = ["user.info.basic", "video.publish"];

/**
 * Native TikTok Content Posting client.
 *
 * Arcade does not currently expose a TikTok auth provider/toolkit for this
 * project, so authentication uses TikTok Login Kit + Content Posting API
 * directly (same pattern as basic LinkedIn auth).
 */
export class TikTokClient {
  private accessToken: string;
  private openId: string;

  constructor(input?: {
    accessToken?: string;
    openId?: string;
    refreshToken?: string;
    clientKey?: string;
    clientSecret?: string;
  }) {
    const accessToken =
      input?.accessToken || process.env.TIKTOK_ACCESS_TOKEN;
    const openId = input?.openId || process.env.TIKTOK_OPEN_ID;

    if (!accessToken) {
      throw new Error(
        "Missing TikTok access token. Set TIKTOK_ACCESS_TOKEN or pass accessToken.",
      );
    }
    if (!openId) {
      throw new Error(
        "Missing TikTok open ID. Set TIKTOK_OPEN_ID or pass openId.",
      );
    }

    this.accessToken = accessToken;
    this.openId = openId;
  }

  static getScopes(): string[] {
    return [...DEFAULT_SCOPES];
  }

  static getAuthorizationUrl(fields: {
    clientKey: string;
    redirectUri: string;
    state: string;
    scopes?: string[];
  }): string {
    const url = new URL(TIKTOK_AUTH_URL);
    url.searchParams.set("client_key", fields.clientKey);
    url.searchParams.set(
      "scope",
      (fields.scopes ?? TikTokClient.getScopes()).join(","),
    );
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", fields.redirectUri);
    url.searchParams.set("state", fields.state);
    return url.toString();
  }

  static async exchangeCodeForToken(fields: {
    code: string;
    redirectUri: string;
    clientKey?: string;
    clientSecret?: string;
  }): Promise<TikTokTokenResponse> {
    const clientKey = fields.clientKey || process.env.TIKTOK_CLIENT_KEY;
    const clientSecret =
      fields.clientSecret || process.env.TIKTOK_CLIENT_SECRET;
    if (!clientKey || !clientSecret) {
      throw new Error(
        "Missing TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET for token exchange.",
      );
    }

    const body = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code: fields.code,
      grant_type: "authorization_code",
      redirect_uri: fields.redirectUri,
    });

    const response = await fetch(`${TIKTOK_API_BASE}/v2/oauth/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body,
    });

    const data = (await response.json()) as TikTokTokenResponse;
    if (!response.ok || data.error || !data.access_token) {
      throw new Error(
        `TikTok token exchange failed: ${data.error || response.status} ${data.error_description || ""}`.trim(),
      );
    }
    return data;
  }

  static async refreshAccessToken(fields?: {
    refreshToken?: string;
    clientKey?: string;
    clientSecret?: string;
  }): Promise<TikTokTokenResponse> {
    const refreshToken =
      fields?.refreshToken || process.env.TIKTOK_REFRESH_TOKEN;
    const clientKey = fields?.clientKey || process.env.TIKTOK_CLIENT_KEY;
    const clientSecret =
      fields?.clientSecret || process.env.TIKTOK_CLIENT_SECRET;

    if (!refreshToken || !clientKey || !clientSecret) {
      throw new Error(
        "Missing TIKTOK_REFRESH_TOKEN / TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET for refresh.",
      );
    }

    const body = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(`${TIKTOK_API_BASE}/v2/oauth/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body,
    });

    const data = (await response.json()) as TikTokTokenResponse;
    if (!response.ok || data.error || !data.access_token) {
      throw new Error(
        `TikTok token refresh failed: ${data.error || response.status} ${data.error_description || ""}`.trim(),
      );
    }
    return data;
  }

  /**
   * Build a client from env, refreshing the access token when possible.
   * Arcade auth is intentionally unsupported for TikTok.
   */
  static async fromEnv(): Promise<TikTokClient> {
    const refreshToken = process.env.TIKTOK_REFRESH_TOKEN;
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (refreshToken && clientKey && clientSecret) {
      try {
        const refreshed = await TikTokClient.refreshAccessToken({
          refreshToken,
          clientKey,
          clientSecret,
        });
        console.log(
          "[TikTok] Refreshed access token; open_id=",
          refreshed.open_id,
          "scope=",
          refreshed.scope,
        );
        return new TikTokClient({
          accessToken: refreshed.access_token,
          openId: refreshed.open_id || process.env.TIKTOK_OPEN_ID,
          refreshToken: refreshed.refresh_token || refreshToken,
          clientKey,
          clientSecret,
        });
      } catch (error) {
        console.warn(
          "[TikTok] Token refresh failed; falling back to TIKTOK_ACCESS_TOKEN.",
          error,
        );
      }
    }

    return new TikTokClient();
  }

  static isConfigured(): boolean {
    return Boolean(
      process.env.TIKTOK_ACCESS_TOKEN ||
        (process.env.TIKTOK_REFRESH_TOKEN &&
          process.env.TIKTOK_CLIENT_KEY &&
          process.env.TIKTOK_CLIENT_SECRET),
    );
  }

  private getPrivacyLevel(preferred?: string): string {
    // Unaffected clients are limited to private viewing until TikTok audits the app.
    return (
      preferred ||
      process.env.TIKTOK_PRIVACY_LEVEL ||
      "SELF_ONLY"
    );
  }

  private truncate(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return `${text.slice(0, Math.max(0, maxChars - 1))}…`;
  }

  private async makeAuthorizedRequest<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${TIKTOK_API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        ...options.headers,
      },
    });

    const data = (await response.json()) as T & TikTokApiErrorBody;
    const errorCode = data?.error?.code;
    if (!response.ok || (errorCode && errorCode !== "ok")) {
      throw new Error(
        `TikTok API error (${path}): ${errorCode || response.status} ${data?.error?.message || ""}`.trim(),
      );
    }
    return data;
  }

  async queryCreatorInfo(): Promise<TikTokCreatorInfo> {
    const result = await this.makeAuthorizedRequest<{
      data?: TikTokCreatorInfo;
    }>("/v2/post/publish/creator_info/query/", {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (!result.data) {
      throw new Error("TikTok creator_info/query returned no data");
    }
    console.log(
      "[TikTok] Creator info:",
      result.data.creator_username,
      "privacy_options=",
      result.data.privacy_level_options,
    );
    return result.data;
  }

  /**
   * Direct-post one or more photos via PULL_FROM_URL.
   * Image URLs must be on a domain verified in the TikTok developer portal.
   */
  async createPhotoPost(
    request: CreateTikTokPhotoPostRequest,
  ): Promise<{ publishId: string }> {
    if (!request.imageUrls?.length) {
      throw new Error("TikTok photo posts require at least one image URL.");
    }

    const creator = await this.queryCreatorInfo();
    const privacyLevel = this.getPrivacyLevel(request.privacyLevel);
    if (
      creator.privacy_level_options?.length &&
      !creator.privacy_level_options.includes(privacyLevel)
    ) {
      throw new Error(
        `TikTok privacy level '${privacyLevel}' is not allowed for this creator. Options: ${creator.privacy_level_options.join(", ")}`,
      );
    }

    const payload = {
      post_info: {
        title: this.truncate(request.title, 90),
        description: this.truncate(
          request.description ?? request.title,
          4000,
        ),
        disable_comment: request.disableComment ?? false,
        privacy_level: privacyLevel,
        auto_add_music: request.autoAddMusic ?? true,
      },
      source_info: {
        source: "PULL_FROM_URL",
        photo_cover_index: 0,
        photo_images: request.imageUrls,
      },
      post_mode: "DIRECT_POST",
      media_type: "PHOTO",
    };

    const result = await this.makeAuthorizedRequest<PublishInitResponse>(
      "/v2/post/publish/content/init/",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    const publishId = result.data?.publish_id;
    if (!publishId) {
      throw new Error("TikTok photo post init returned no publish_id");
    }

    console.log(
      "[TikTok] Photo post initiated. publish_id=",
      publishId,
      "open_id=",
      this.openId,
    );
    return { publishId };
  }

  /**
   * Direct-post a video via PULL_FROM_URL.
   * Video URL must be on a domain verified in the TikTok developer portal.
   */
  async createVideoPost(
    request: CreateTikTokVideoPostRequest,
  ): Promise<{ publishId: string }> {
    const creator = await this.queryCreatorInfo();
    const privacyLevel = this.getPrivacyLevel(request.privacyLevel);
    if (
      creator.privacy_level_options?.length &&
      !creator.privacy_level_options.includes(privacyLevel)
    ) {
      throw new Error(
        `TikTok privacy level '${privacyLevel}' is not allowed for this creator. Options: ${creator.privacy_level_options.join(", ")}`,
      );
    }

    const payload = {
      post_info: {
        title: this.truncate(request.title, 2200),
        privacy_level: privacyLevel,
        disable_duet: request.disableDuet ?? false,
        disable_comment: request.disableComment ?? false,
        disable_stitch: request.disableStitch ?? false,
        video_cover_timestamp_ms: request.videoCoverTimestampMs ?? 1000,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: request.videoUrl,
      },
    };

    const result = await this.makeAuthorizedRequest<PublishInitResponse>(
      "/v2/post/publish/video/init/",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    const publishId = result.data?.publish_id;
    if (!publishId) {
      throw new Error("TikTok video post init returned no publish_id");
    }

    console.log(
      "[TikTok] Video post initiated. publish_id=",
      publishId,
      "open_id=",
      this.openId,
    );
    return { publishId };
  }
}
