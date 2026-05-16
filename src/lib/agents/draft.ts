import Anthropic from "@anthropic-ai/sdk";
import type { Card, CorpusChunk, ExtractedInterests } from "@/lib/types";

type DraftArgs = {
  visitor: ExtractedInterests;
  retrieved: CorpusChunk[];
  webFindings?: string[];
  target: Card;
  voiceSamples: string[];
  critique?: string;
  /**
   * Ordered handles on the friendship-graph shortest path from source to target.
   * First handle is the source, last is the target. Empty if no path.
   */
  path?: { handles: string[]; names: Record<string, string> };
  onToken: (token: string) => void;
};

function buildSystem(target: Card, voiceSamples: string[]) {
  const first = target.name.split(" ")[0];
  return [
    {
      type: "text" as const,
      text: `you are writing in the voice of ${target.name} (handle: @${target.handle}).

context: a builder you don't know has just typed a brief description of themselves. you write the cold intro that ${first} would actually send back to start a conversation when they meet in person at one of his upcoming events.

VOICE:
- lowercase except proper nouns (paper titles, people, places, institutions, repo names)
- two or three sentences total. count them.
- end with a casual closer pointing to one of ${first}'s upcoming events ("see you at SS26", "ping me when you land in SF"). no exclamation points. no "looking forward."

GROUNDING:
- if there IS a genuine, specific overlap (paper, project, named metric, tool, institution) in the retrieved corpus or web findings — name it, naturally.
- if there ISN'T — say so honestly: "i don't see a direct overlap on paper, but ${first} works on X — curious if Y." it is BETTER to write an honest "no obvious overlap, but…" than to fake a specific connection. judges reward honesty; they fail forced specificity.
- never invent claims. only use facts shown in the retrieved chunks, the web findings, or the visitor's input.

PROHIBITED:
- "excited", "passionate", "amazing", "powerful", "leverage" (verb), "ecosystem", "delve", "robust", "streamline", "synergy", "tapestry", "paradigm"
- em-dashes more than once. no negative parallelism ("it's not X — it's Y").
- generic openers like "you both work on AI" or "you both build agents" without a specific anchor.

VOICE SAMPLES (${first}'s actual writing — match this register):
${voiceSamples.map((s) => `> ${s}`).join("\n")}

you'll see the visitor's input + retrieved facts + web findings below. write the intro.`,
      cache_control: { type: "ephemeral" as const },
    },
  ];
}

export async function draft(args: DraftArgs): Promise<string> {
  const client = new Anthropic();
  const system = buildSystem(args.target, args.voiceSamples);
  const targetFirst = args.target.name.split(" ")[0];

  let pathBlock = "";
  if (args.path && args.path.handles.length >= 2) {
    const named = args.path.handles
      .map((h) => args.path!.names[h] ?? h)
      .join(" → ");
    if (args.path.handles.length === 2) {
      pathBlock = `\nGRAPH PATH: ${named} — direct contacts on dap. you can write more warmly; the connection already exists.`;
    } else {
      const intermediates = args.path.handles.slice(1, -1);
      const intermediateNames = intermediates
        .map((h) => args.path!.names[h] ?? h)
        .join(", ");
      pathBlock = `\nGRAPH PATH: ${named} — you share mutual contact${intermediates.length > 1 ? "s" : ""}: ${intermediateNames}. mentioning a mutual is OPTIONAL — only if it reads naturally.`;
    }
  }

  const webBlock =
    args.webFindings && args.webFindings.length > 0
      ? `\n\nWEB FINDINGS about ${targetFirst} (recent, from public web):\n${args.webFindings.map((f, i) => `[w${i + 1}] ${f}`).join("\n")}`
      : "\n\nWEB FINDINGS: none surfaced. work only from retrieved corpus + visitor input.";

  const userMessage = `VISITOR:
name: ${args.visitor.name}
working on: ${args.visitor.current_work}
interests: ${args.visitor.interests.join(", ")}
level: ${args.visitor.level}

${targetFirst.toUpperCase()}'S UPCOMING EVENTS (use one in the closer):
${args.target.eventTags.map((t) => `- ${t}`).join("\n")}

RETRIEVED CORPUS about ${targetFirst} (bm25 top-k):
${args.retrieved.map((c, i) => `[${i + 1}] ${c.topic}\n${c.content}`).join("\n\n")}${webBlock}${pathBlock}
${args.critique ? `\nan earlier draft failed the judge. fix this specifically: ${args.critique}` : ""}

write the intro now. lowercase. 2-3 sentences max. honest if no specific overlap.`;

  let full = "";
  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      const text = event.delta.text;
      full += text;
      args.onToken(text);
    }
  }

  return full.trim();
}
