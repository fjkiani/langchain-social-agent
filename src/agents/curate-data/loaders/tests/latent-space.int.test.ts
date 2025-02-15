import { test, expect } from "@jest/globals";
import { latentSpaceLoader } from "../latent-space.js";
import { InMemoryStore } from "@langchain/langgraph";
import { putLatentSpaceLinks } from "../../utils/stores/latent-space-links.js";

test("Latent space loader", async () => {
  const store = new InMemoryStore();
  const config = {
    store,
  };
  // Seed the store with some existing values
  await putLatentSpaceLinks(
    [
      "https://www.latent.space/p/2024-simonw",
      "https://www.latent.space/p/o1-skill-issue",
      "https://www.latent.space/p/exa",
    ],
    config,
  );
  const data = await latentSpaceLoader(config);
  expect(data.length).toBeGreaterThan(1);
});
