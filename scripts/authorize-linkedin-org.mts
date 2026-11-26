/**
 * Start (or resume) Arcade LinkedIn OAuth with organization posting scopes.
 * Prints a URL if the user must approve w_organization_social in the browser.
 *
 * Usage:
 *   yarn tsx scripts/authorize-linkedin-org.mts
 *
 * Note: Arcade auth URLs are single-use / short-lived. A browser error
 * `flow_not_found` means the prior flow ID expired or was already consumed —
 * re-run this script for a fresh URL; do not reuse an old cloud.arcade.dev link.
 */
import "dotenv/config";
import Arcade from "@arcadeai/arcadejs";

async function main() {
  if (!process.env.ARCADE_API_KEY) {
    console.error("MISSING_SECRETS: ARCADE_API_KEY");
    process.exit(1);
  }
  if (process.env.USE_ARCADE_AUTH !== "true") {
    console.error(
      `USE_ARCADE_AUTH must be true (got ${JSON.stringify(process.env.USE_ARCADE_AUTH)})`,
    );
    process.exit(1);
  }

  const arcade = new Arcade({ apiKey: process.env.ARCADE_API_KEY });
  const id = process.env.LINKEDIN_USER_ID || "fjkiani@gmail.com";
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID || "107412290";
  const scopes = ["w_member_social", "w_organization_social"];

  // Always start a new auth check. If scopes were previously granted with
  // only w_member_social, Arcade returns pending + a new URL for the upgrade.
  const authRes = await arcade.auth.start(id, "linkedin", { scopes });

  const summary = {
    userId: id,
    organizationId: orgId,
    vanity: process.env.LINKEDIN_ORG_VANITY || "crispro",
    scopes,
    status: authRes.status,
    // Flow IDs in authorization URLs expire; never reuse a prior pending URL.
    authorizationUrl: authRes.url || null,
    hasToken: Boolean(authRes.context?.token),
    personUrn: (authRes.context?.user_info?.sub as string) || null,
    postToOrg: process.env.POST_TO_LINKEDIN_ORGANIZATION === "true",
  };

  console.log(JSON.stringify(summary, null, 2));

  if (authRes.status === "completed" && authRes.context?.token) {
    console.log("ORG_AUTH_OK — company-page scopes are ready.");
    process.exit(0);
  }

  console.error(
    "ORG_AUTH_PENDING — open authorizationUrl in a browser as the LinkedIn admin for CrisPRO (org " +
      orgId +
      "), approve organization posting (w_organization_social), then re-run:\n" +
      "  yarn tsx scripts/authorize-linkedin-org.mts",
  );
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
