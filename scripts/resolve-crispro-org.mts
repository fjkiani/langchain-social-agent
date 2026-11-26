import Arcade from "@arcadeai/arcadejs";

async function probeOrgs(token: string, label: string) {
  console.log("PROBE_LABEL:", label);
  const endpoints = [
    "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&projection=(elements*(organizationalTarget~(id,localizedName,vanityName)))",
    "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
    "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee",
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": "202405",
        },
      });
      const text = await res.text();
      console.log("ENDPOINT_STATUS:", res.status, "URL:", url.slice(0, 90));
      console.log(text.slice(0, 2500));
    } catch (e: any) {
      console.log("ENDPOINT_ERR:", e.message);
    }
  }

  const vanityUrl =
    "https://api.linkedin.com/v2/organizations?q=vanityName&vanityName=crispro";
  try {
    const res = await fetch(vanityUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });
    const text = await res.text();
    console.log("VANITY_LOOKUP STATUS:", res.status);
    console.log(text.slice(0, 2500));
  } catch (e: any) {
    console.log("VANITY_ERR:", e.message);
  }
}

async function main() {
  const arcade = new Arcade({ apiKey: process.env.ARCADE_API_KEY });
  const id = process.env.LINKEDIN_USER_ID || "fjkiani@gmail.com";

  const authRes = await arcade.auth.start(id, "linkedin", {
    scopes: [
      "w_member_social",
      "w_organization_social",
      "r_organization_social",
    ],
  });

  console.log(
    "AUTH:",
    JSON.stringify(
      {
        userId: id,
        status: authRes.status,
        url: authRes.url || null,
        hasToken: Boolean(authRes.context?.token),
        personUrn: (authRes.context?.user_info?.sub as string) || null,
      },
      null,
      2,
    ),
  );

  if (authRes.status === "completed" && authRes.context?.token) {
    await probeOrgs(authRes.context.token as string, "with-org-scopes");
    return;
  }

  const fallback = await arcade.auth.start(id, "linkedin", {
    scopes: ["w_member_social"],
  });
  console.log(
    "FALLBACK_AUTH:",
    JSON.stringify(
      {
        status: fallback.status,
        url: fallback.url || null,
        hasToken: Boolean(fallback.context?.token),
        personUrn: (fallback.context?.user_info?.sub as string) || null,
      },
      null,
      2,
    ),
  );
  if (!fallback.context?.token) process.exit(2);
  await probeOrgs(fallback.context.token as string, "member-only");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
