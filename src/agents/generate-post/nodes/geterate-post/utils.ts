/**
 * Parse the LLM generation to extract the report from inside the <report> tag.
 * If the report can not be parsed, the original generation is returned.
 * @param generation The text generation to parse
 * @returns The parsed generation, or the unmodified generation if it cannot be parsed
 */
export function parseGeneration(generation: string): string {
  const reportMatch = generation.match(/<post>([\s\S]*?)<\/post>/);
  if (!reportMatch) {
    console.warn(
      "Could not parse post from generation:\nSTART OF POST GENERATION\n\n",
      generation,
      "\n\nEND OF POST GENERATION",
    );
  }
  return reportMatch ? reportMatch[1].trim() : generation;
}

export function formatPrompt(report: string, link: string): string {
  return `Here is the report I wrote on the content I'd like promoted by LangChain:
<report>
${report}
</report>

And here is the link to the content I'd like promoted:
<link>
${link}
</link>`;
}
