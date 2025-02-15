export const GROUP_BY_CONTENT_CRITERIA = `<grouping-criteria>
- Tweets discussing a new model, benchmark, tool, product or other released by an individual or organization
- Tweets discussing a new UI/UX pattern for AI applications
- Tweets discussing pitfalls of specific prompting strategies when working with LLMs
- General news or updates about AI
- You should try to group your tweets into fine-grained topics, to avoid grouping unrelated tweets into the same group.
</grouping-criteria>

<grouping-rules>
Tweets which discuss/reference the same model, benchmark, product, tool, etc should be grouped together. Ensure you do not group unrelated tweets together, unless you believe they are relevant to each others subjects.
Remember, you are allowed to put the same tweet into multiple groups, if you think they're relevant to each other. This should be used if a single tweet is relevant to multiple topics.
If you think a tweet is talking about a model, benchmark, tool, product or other, do your very best to identify what exactly it is, and group it accordingly.
</grouping-rules>`;
