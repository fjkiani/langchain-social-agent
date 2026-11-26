/**
 * Resolve a public HTTPS video/mp4 URL for CrisPRO LinkedIn video posts.
 *
 * Prefers Hygraph Content API when HYGRAPH_TOKEN/GRAPHCMS_TOKEN (+ endpoint) are set.
 * Falls back to the known published glassbox-ai MediaItem videoFile on crispro.ai.
 *
 * Usage:
 *   yarn tsx scripts/resolve-hygraph-video.mts
 *   SLUG=glassbox-ai yarn tsx scripts/resolve-hygraph-video.mts
 */
import "dotenv/config";

const FALLBACK_GLASSBOX_MP4 =
  "https://us-west-2.graphassets.com/cm65gc2pl00vr08gs2em34vmw/cmkrjbuftdycb07lpstjklcss";

const DEFAULT_ENDPOINT =
  process.env.HYGRAPH_ENDPOINT ||
  process.env.GRAPHCMS_ENDPOINT ||
  "https://api-us-west-2.hygraph.com/v2/cm65g7pxd09kx07my82376f33/master";

async function fetchFromHygraph(slug: string): Promise<{
  url: string | null;
  source: string;
  detail?: unknown;
}> {
  const token =
    process.env.HYGRAPH_TOKEN ||
    process.env.GRAPHCMS_TOKEN ||
    process.env.HYGRAPH_PERMANENT_AUTH_TOKEN;
  if (!token) {
    return { url: null, source: "hygraph-api-skipped-no-token" };
  }

  const query = `
    query MediaBySlug($slug: String!) {
      mediaItem(where: { slug: $slug }) {
        id
        slug
        title
        videoFile {
          url
          fileName
          mimeType
        }
      }
    }
  `;

  const res = await fetch(DEFAULT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables: { slug } }),
  });
  const json = (await res.json()) as {
    data?: {
      mediaItem?: {
        videoFile?: { url?: string; mimeType?: string; fileName?: string };
      };
    };
    errors?: unknown;
  };

  const file = json.data?.mediaItem?.videoFile;
  if (file?.url && (!file.mimeType || file.mimeType.includes("mp4"))) {
    return { url: file.url, source: "hygraph-api", detail: file };
  }
  return {
    url: null,
    source: "hygraph-api-miss",
    detail: { status: res.status, errors: json.errors, data: json.data },
  };
}

async function verifyMp4(url: string): Promise<{
  ok: boolean;
  contentType: string | null;
  contentLength: string | null;
  status: number;
}> {
  const res = await fetch(url, { method: "HEAD" });
  return {
    ok: res.ok && (res.headers.get("content-type") || "").includes("video"),
    contentType: res.headers.get("content-type"),
    contentLength: res.headers.get("content-length"),
    status: res.status,
  };
}

async function main() {
  const slug = process.env.SLUG || "glassbox-ai";
  const fromApi = await fetchFromHygraph(slug);
  const url = fromApi.url || FALLBACK_GLASSBOX_MP4;
  const source = fromApi.url ? fromApi.source : "fallback-glassbox-public-page";
  const probe = await verifyMp4(url);

  const out = {
    slug,
    url,
    source,
    probe,
    linkedInReady: Boolean(probe.ok && url.startsWith("https://")),
    note: "Do not use NotebookLM googleusercontent URLs for LinkedIn video fetch.",
  };
  console.log(JSON.stringify(out, null, 2));
  if (!probe.ok) process.exit(2);
  console.log("VIDEO_URL=" + url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
