import {
  interrupt,
  // @ts-expect-error - The type is used in the JSDoc comment, but not defined in the code.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type NodeInterrupt,
} from "@langchain/langgraph";
import { HumanInterrupt, HumanResponse } from "../../types.js";
import { TikTokClient } from "../../../clients/tiktok.js";

const TIKTOK_AUTHORIZATION_DOCS_URL =
  "https://developers.tiktok.com/doc/content-posting-api-get-started";

/**
 * Checks TikTok authorization status and triggers an interrupt if needed.
 *
 * Arcade does not provide a TikTok provider for this project, so only the
 * native Login Kit / Content Posting credentials path is supported.
 */
export async function getBasicTikTokAuthOrInterrupt(fields?: {
  tikTokUserId?: string;
  returnInterrupt?: boolean;
}) {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  const openId = process.env.TIKTOK_OPEN_ID;
  const refreshConfigured =
    Boolean(process.env.TIKTOK_REFRESH_TOKEN) &&
    Boolean(process.env.TIKTOK_CLIENT_KEY) &&
    Boolean(process.env.TIKTOK_CLIENT_SECRET);

  if ((accessToken && openId) || refreshConfigured) {
    return undefined;
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri =
    process.env.TIKTOK_REDIRECT_URI ||
    "http://localhost:3000/auth/tiktok/callback";
  const state = process.env.SESSION_SECRET || "tiktok-auth";

  let authorizeUrl: string | undefined;
  if (clientKey) {
    authorizeUrl = TikTokClient.getAuthorizationUrl({
      clientKey,
      redirectUri,
      state,
    });
  }

  const description = `# Authorization Required

${fields?.tikTokUserId ? `Missing TikTok authorization for user: ${fields.tikTokUserId}` : "Missing TikTok authorization."}

Arcade does not currently support TikTok. Use TikTok Login Kit + Content Posting API:

1. Create an app at https://developers.tiktok.com and enable Login Kit + Content Posting API (Direct Post).
2. Request the \`video.publish\` scope (and \`user.info.basic\`).
3. Set \`TIKTOK_CLIENT_KEY\` / \`TIKTOK_CLIENT_SECRET\` and run \`yarn start:auth\`, then open ${authorizeUrl ? authorizeUrl : "http://localhost:3000/auth/tiktok"}.
4. Copy \`access_token\`, \`refresh_token\`, and \`open_id\` into \`TIKTOK_ACCESS_TOKEN\`, \`TIKTOK_REFRESH_TOKEN\`, and \`TIKTOK_OPEN_ID\`.

Docs: [${TIKTOK_AUTHORIZATION_DOCS_URL}](${TIKTOK_AUTHORIZATION_DOCS_URL})

Once completed, accept this interrupt and restart with the env vars set.`;

  const authInterrupt: HumanInterrupt = {
    action_request: {
      action: "[AUTHORIZATION REQUIRED]: TikTok",
      args: {
        authorizationDocs: TIKTOK_AUTHORIZATION_DOCS_URL,
        ...(authorizeUrl ? { authorizeTikTokURL: authorizeUrl } : {}),
      },
    },
    config: {
      allow_ignore: true,
      allow_accept: true,
      allow_edit: false,
      allow_respond: false,
    },
    description,
  };

  if (fields?.returnInterrupt) {
    return authInterrupt;
  }

  const res = interrupt<HumanInterrupt[], HumanResponse[]>([authInterrupt])[0];
  if (res.type === "accept") {
    return undefined;
  }
  if (res.type === "ignore") {
    throw new Error("Authorization denied by user.");
  }

  return undefined;
}

export async function getTikTokAuthOrInterrupt(fields?: {
  tikTokUserId?: string;
  returnInterrupt?: boolean;
}) {
  // Explicitly avoid Arcade for TikTok — provider is unsupported.
  const tikTokUserId = fields?.tikTokUserId || process.env.TIKTOK_USER_ID;
  return getBasicTikTokAuthOrInterrupt({
    tikTokUserId,
    returnInterrupt: fields?.returnInterrupt,
  });
}
