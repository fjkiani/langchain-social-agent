import { describe, it, expect } from "@jest/globals";
import { getFileContents } from "../utils/github-repo-contents.js";

describe("GitHub get file contents", () => {
  it("Can get the download_url of a Gif from a public GitHub repo", async () => {
    const repoUrl = "https://github.com/Integuru-AI/Integuru";
    const gifFileName = "integuru_demo.gif";
    const contents = await getFileContents(repoUrl, gifFileName);
    expect(contents.download_url).toBeDefined();
    expect(contents.type).toBe("file");
  });

  it("Can get the download_url of an image from a public GitHub repo", async () => {
    const repoUrl = "https://github.com/glance-io/steer-backend";
    const imgFileName = "logo_banner.png";
    const contents = await getFileContents(repoUrl, imgFileName);
    expect(contents.download_url).toBeDefined();
    expect(contents.type).toBe("file");
  });
});
