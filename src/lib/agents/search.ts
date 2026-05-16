import Anthropic from "@anthropic-ai/sdk";
import type { Card } from "@/lib/types";

const SYSTEM = `you are a research assistant. given a person's name + handle + a brief role description, you search the public web and return short, specific, recent factual findings about their work.

rules:
- 2 to 5 findings maximum
- each finding is ONE terse sentence, lowercase except proper nouns
- only specific verifiable facts from public sources: papers, projects, talks, github repos, blog posts, podcast appearances, named results
- skip vague social-media bios, generic praise, or platitudes
- if you can't find anything specific, return an empty list

output: a JSON array of strings, nothing else. example:
["co-authored 'tinygrid' paper at neurips 2025 on distributed training",
 "maintains an open-source rust web framework (~1.2k stars on github)"]`;

/**
 * Use Anthropic's built-in web_search tool to look up recent public info about a target.
 * Returns 0-5 short factual findings. Graceful on failure (empty list).
 */
export async function webSearchTarget(card: Card): Promise<string[]> {
  const client = new Anthropic();

  // The web_search tool is server-executed by Anthropic; we cast through
  // unknown because the SDK's typed Tool union may not list it yet.
  const tool = {
    type: "web_search_20250305",
    name: "web_search",
    max_uses: 3,
  };

  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: SYSTEM,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [tool as unknown as any],
      messages: [
        {
          role: "user",
          content: `Subject: ${card.name}
Handle: @${card.handle}
Self-description: ${card.headline}
Currently building: ${card.building}
Origin: ${card.origin.city}, ${card.origin.country}

Search the public web. Return JSON array of 2-5 short factual findings about their work. Empty array if nothing specific surfaces.`,
        },
      ],
    });

    const text = res.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim();

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed: unknown = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .slice(0, 5);
  } catch (e) {
    console.error("webSearchTarget:", e instanceof Error ? e.message : e);
    return [];
  }
}
