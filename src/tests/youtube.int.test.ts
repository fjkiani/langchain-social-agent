import { describe, it, expect } from "@jest/globals";
import { getVideoThumbnailUrl } from "../agents/shared/nodes/youtube.utils.js";

describe("YouTube utils", () => {
  it("Can get the thumbnails of YouTube videos", async () => {
    const youTubeUrls = [
      "https://www.youtube.com/watch?v=gwE3Wv4MNLw",
      "https://www.youtube.com/watch?v=VyyJFrPlHfk",
      "https://www.youtube.com/watch?v=BGvqeRB4Jpk",
      "https://www.youtube.com/watch?v=u_Xm3vgBQ9Y",
      "https://www.youtube.com/watch?v=02IDU8eCX8o",
    ];

    for await (const url of youTubeUrls) {
      const thumbnail = await getVideoThumbnailUrl(url);
      console.log(`url & thumbnail:\nURL: ${url}\nTHUMBNAIL: ${thumbnail}`);
      expect(thumbnail).toBeDefined();
    }
  });
});
