import "dotenv/config";
import { LinkedInClient } from "../src/clients/linkedin.js";

async function main() {
  if (!process.env.ARCADE_API_KEY) {
    throw new Error("MISSING_SECRETS: ARCADE_API_KEY");
  }
  const userId = process.env.LINKEDIN_USER_ID;
  if (!userId) throw new Error("MISSING_SECRETS: LINKEDIN_USER_ID");

  const client = await LinkedInClient.fromArcade(userId, {
    postToOrganization: false,
  });

  const text =
    `Testing langchain-social-agent LinkedIn upload via Arcade ` +
    `(${new Date().toISOString()}).`;

  console.log("Posting to LinkedIn as", userId);
  console.log("Text:", text);

  const result = await client.createTextPost(text, {
    postToOrganization: false,
  });
  console.log("LinkedIn createTextPost result:");
  console.dir(result, { depth: 5 });
  console.log("LINKEDIN_POST_OK");
}

main().catch((e) => {
  console.error("LINKEDIN_POST_FAILED", e);
  process.exit(1);
});
