import { describe, it, expect } from "@jest/globals";
import { LinkedInClient } from "../clients/linkedin.js";

describe("LinkedIN API wrapper", () => {
  it("Can make a text post", async () => {
    const linkedInClient = new LinkedInClient();
    const textPostResponse = await linkedInClient.createTextPost(
      "Hello, this is a test post from LinkedIn API!",
    );
    console.log("Text post created:", textPostResponse);
    expect(textPostResponse).toBeDefined();
  });

  it("Can make an image post", async () => {
    const linkedInClient = new LinkedInClient();
    const textPostResponse = await linkedInClient.createImagePost({
      text: "Hello, this is a test post from LinkedIn API!",
      imageUrl:
        "https://verdyqfuvvtxtygqekei.supabase.co/storage/v1/object/public/images/screenshot-github.com-1734639569875.jpeg",
      imageDescription: "A screenshot of the Open Canvas Readme",
      imageTitle: "Open Canvas",
    });
    console.log("Image post created:", textPostResponse);
    expect(textPostResponse).toBeDefined();
  });

  it("Can make a text post to an organization", async () => {
    const linkedInClient = new LinkedInClient();
    const textPostResponse = await linkedInClient.createTextPost(
      "Hello, this is a test post from LinkedIn API!",
      {
        postToOrganization: true,
      },
    );
    console.log("Text post created:", textPostResponse);
    expect(textPostResponse).toBeDefined();
  });

  it.only("Can make an image post to an organization", async () => {
    const linkedInClient = new LinkedInClient();
    const textPostResponse = await linkedInClient.createImagePost(
      {
        text: "Hello, this is a test post from LinkedIn API!",
        imageUrl:
          "https://verdyqfuvvtxtygqekei.supabase.co/storage/v1/object/public/images/screenshot-github.com-1734639569875.jpeg",
        imageDescription: "A screenshot of the Open Canvas Readme",
        imageTitle: "Open Canvas",
      },
      {
        postToOrganization: true,
      },
    );
    console.log("Image post created:", textPostResponse);
    expect(textPostResponse).toBeDefined();
  });
});
