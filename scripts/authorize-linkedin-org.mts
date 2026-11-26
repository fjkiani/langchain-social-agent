/**
 * Start (or resume) Arcade LinkedIn OAuth with organization posting scopes.
 * Prints a URL if the user must approve w_organization_social in the browser.
 *
 * Usage:
 *   yarn tsx scripts/authorize-linkedin-org.mts
 */
import "dotenv/config";
import Arcade from "@arcadeai/arcadejs";

async function main() {
  if (!process.env.ARCADE_API_KEY) {
    console.error("MISSING_SECRETS: ARCADE_API_KEY");
    process.exit(1);
  }

  const arcade = new Arcade({ apiKey: process.env.ARCADE_API_KEY });
  const id = process.env.LINKEDIN_USER_ID || "fjkiani@gmail.com";
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID || "107412290";
  const scopes = ["w_member_social", "w_organization_social"];

  const authRes = await arcade.auth.start(id, "linkedin", { scopes });

  const summary = {
    userId: id,
    organizationId: orgId,
    vanity: process.env.LINKEDIN_ORG_VANITY || "crispro",
    scopes,
    status: authRes.status,
    authorizationUrl: authRes.url || null,
    hasToken: Boolean(authRes.context?.token),
    personUrn: (authRes.context?.user_info?.sub as string) || null,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (authRes.status === "completed" && authRes.context?.token) {
    console.log("ORG_AUTH_OK — company-page scopes are ready.");
    process.exit(0);
  }

  console.error(
    "ORG_AUTH_PENDING — open authorizationUrl in a browser as the LinkedIn admin for CrisPRO, approve organization posting, then re-run this script.",
  );
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
