import { test, expect } from "@jest/globals";
import { SlackClient } from "../clients/slack.js";

// NOTE: Change this to your specific channel name and ID.
const TEST_CHANNEL_NAME = "external-community-content";
const TEST_CHANNEL_ID = "C06BU7XF5S7";

test("Slack client can get the channel ID from a channel name", async () => {
  const client = new SlackClient({
    channelName: TEST_CHANNEL_NAME,
  });
  const channelId = await client.getChannelId();

  expect(channelId).toBeDefined();
  expect(channelId).toBe(TEST_CHANNEL_ID);
});

test("Slack client can fetch messages from channel name", async () => {
  const client = new SlackClient({
    channelId: TEST_CHANNEL_ID,
  });

  const messages = await client.fetchLast24HoursMessages({ maxMessages: 5 });
  console.log(messages);
  expect(messages).toBeDefined();
  expect(messages.length).toBeGreaterThan(0);
});
