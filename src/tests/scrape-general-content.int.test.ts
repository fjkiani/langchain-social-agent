import { describe, expect, it } from "@jest/globals";
import {
  extractAllImageUrlsFromMarkdown,
  getPageText,
} from "../agents/utils.js";
import { getUrlContents } from "../agents/shared/nodes/verify-general.js";

describe("Get page contents", () => {
  it("Can return markdown from a blog URL", async () => {
    const url =
      "https://diamantai.substack.com/p/atlas-when-artificial-intelligence?r=336pe4&amp%3Butm_campaign=post&amp%3Butm_medium=web&amp%3BshowWelcomeOnShare=false&triedRedirect=true";
    const contents = await getPageText(url);
    expect(contents).toBeDefined();

    // Verify it can extract images from the text
    const allImageUrls = extractAllImageUrlsFromMarkdown(contents || "");
    expect(allImageUrls).toBeDefined();
    expect(allImageUrls.length).toBeGreaterThan(0);
  });

  it("Can use firecrawl to extract markdown and images from a page", async () => {
    const url = "https://qdrant.tech/documentation/data-ingestion-beginners/#";
    const contents = await getUrlContents(url);
    expect(contents).toBeDefined();
    expect(contents.content).toBeGreaterThan(10);
    expect(contents.imageUrls).toBeDefined();
    expect(contents.imageUrls?.length).toBeGreaterThan(0);
  });
});
