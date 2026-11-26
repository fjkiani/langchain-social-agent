import { LinkedInClient } from "../src/clients/linkedin.js";

async function main() {
  const userId = process.env.LINKEDIN_USER_ID || "fjkiani@gmail.com";
  const client = await LinkedInClient.fromArcade(userId, {
    postToOrganization: false,
  });

  const stamp = new Date().toISOString();
  const text = [
    "Shipped LinkedIn posting for my LangChain social agent via Arcade auth.",
    "",
    "The agent can authenticate and publish directly to LinkedIn. Next: full generate → upload with Firecrawl + Gemini.",
    "",
    `#LangChain #Arcade #LinkedIn #AIAgents`,
    "",
    `(${stamp})`,
  ].join("\n");

  console.log("Posting as", userId);
  console.log("---");
  console.log(text);
  console.log("---");

  try {
    const result = await client.createTextPost(text, {
      postToOrganization: false,
    });
    console.log("RESULT", JSON.stringify(result));
    console.log("POSTED_OK");
  } catch (e: any) {
    // Retry once with Arcade raw tool if client fails — surface body
    console.error("createTextPost failed:", e?.message || e);
    throw e;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
