/**
 * Post a short text (or optional video) to the CrisPRO LinkedIn company page.
 * Requires Arcade auth with w_organization_social for LINKEDIN_USER_ID.
 *
 *   yarn tsx scripts/post-crispro-org.mts
 *   DRY_RUN=1 yarn tsx scripts/post-crispro-org.mts
 *   VIDEO_URL=https://…/file.mp4 yarn tsx scripts/post-crispro-org.mts
 */
import "dotenv/config";
import { LinkedInClient } from "../src/clients/linkedin.js";

async function main() {
  const missing: string[] = [];
  if (!process.env.ARCADE_API_KEY) missing.push("ARCADE_API_KEY");
  const userId = process.env.LINKEDIN_USER_ID;
  if (!userId) missing.push("LINKEDIN_USER_ID");
  if (missing.length) {
    console.error("MISSING_SECRETS:", missing.join(", "));
    process.exit(1);
  }

  const orgId = process.env.LINKEDIN_ORGANIZATION_ID || "107412290";
  const dryRun =
    process.env.DRY_RUN === "1" ||
    process.env.DRY_RUN === "true" ||
    process.env.CRISPRO_DRY_RUN === "1";

  const videoUrl = process.env.VIDEO_URL || "";
  const text =
    process.env.POST_TEXT ||
    `[CrisPRO] NotebookLM → social agent bridge check (${new Date().toISOString()}).`;

  const plan = {
    userId,
    organizationId: orgId,
    vanity: "crispro",
    hasVideo: Boolean(videoUrl),
    videoUrl: videoUrl || null,
    dryRun,
    textPreview: text.slice(0, 120),
  };
  console.log(JSON.stringify(plan, null, 2));

  if (dryRun) {
    console.log(
      "CRISPRO_DRY_RUN — skipping live LinkedIn call. Unset DRY_RUN to post.",
    );
    process.exit(0);
  }

  const client = await LinkedInClient.fromArcade(userId!, {
    postToOrganization: true,
    organizationId: orgId,
  });

  const result = videoUrl
    ? await client.createVideoPost(
        { text, videoUrl },
        { postToOrganization: true },
      )
    : await client.createTextPost(text, { postToOrganization: true });

  console.log("CRISPRO_POST_OK", JSON.stringify(result));
}

main().catch((e) => {
  console.error("CRISPRO_POST_FAILED", e?.message || e);
  process.exit(1);
});
