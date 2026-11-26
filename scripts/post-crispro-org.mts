/**
 * Post a short text (or optional video) to the CrisPRO LinkedIn company page.
 * Requires Arcade auth with w_organization_social for LINKEDIN_USER_ID.
 *
 *   yarn tsx scripts/post-crispro-org.mts
 *   VIDEO_URL=https://…/file.mp4 yarn tsx scripts/post-crispro-org.mts
 */
import { LinkedInClient } from "../src/clients/linkedin.js";

async function main() {
  const userId = process.env.LINKEDIN_USER_ID;
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID || "107412290";
  if (!userId) throw new Error("LINKEDIN_USER_ID missing");

  const client = await LinkedInClient.fromArcade(userId, {
    postToOrganization: true,
    organizationId: orgId,
  });

  const videoUrl = process.env.VIDEO_URL || "";
  const text =
    process.env.POST_TEXT ||
    `[CrisPRO] NotebookLM → social agent bridge check (${new Date().toISOString()}).`;

  console.log(
    JSON.stringify(
      {
        userId,
        organizationId: orgId,
        vanity: "crispro",
        hasVideo: Boolean(videoUrl),
      },
      null,
      2,
    ),
  );

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
