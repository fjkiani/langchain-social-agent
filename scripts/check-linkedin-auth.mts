import Arcade from "@arcadeai/arcadejs";
import { LinkedInClient } from "../src/clients/linkedin.js";
import fs from "fs";

async function main() {
  const arcade = new Arcade({ apiKey: process.env.ARCADE_API_KEY });
  const id = process.env.LINKEDIN_USER_ID || "fjkiani@gmail.com";
  const authRes = await arcade.auth.start(id, "linkedin", {
    scopes: ["w_member_social"],
  });
  const summary = {
    userId: id,
    status: authRes.status,
    url: authRes.url || null,
    hasToken: Boolean(authRes.context?.token),
    personUrn: (authRes.context?.user_info?.sub as string) || null,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (authRes.status !== "completed" || !authRes.context?.token) {
    console.error("NOT_CONNECTED");
    process.exit(2);
  }
  fs.writeFileSync(
    "/tmp/arcade-linkedin-done.json",
    JSON.stringify(summary, null, 2),
  );
  const client = await LinkedInClient.fromArcade(id);
  console.log("LinkedInClient.fromArcade: OK");
  // touch unused to satisfy lint if needed
  void client;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
