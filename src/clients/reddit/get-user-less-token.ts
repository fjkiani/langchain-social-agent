interface RedditTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export async function getRedditUserlessToken(): Promise<RedditTokenResponse> {
  const redditClientId = process.env.REDDIT_CLIENT_ID;
  const redditClientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!redditClientId || !redditClientSecret) {
    throw new Error("Missing Reddit client ID or secret");
  }

  const tokenUrl = "https://www.reddit.com/api/v1/access_token";

  // Create Basic Auth header
  const authHeader = Buffer.from(
    `${redditClientId}:${redditClientSecret}`,
  ).toString("base64");

  // Prepare the form data based on grant type
  const formData = new URLSearchParams({ grant_type: "client_credentials" });

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RedditTokenResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Failed to get Reddit token: ${error}`);
  }
}
