import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { ExtractedInterests } from "@/lib/types";

const ExtractedSchema = z.object({
  interests: z.array(z.string()).min(1).max(8),
  current_work: z.string().min(1).max(220),
  level: z.enum(["student", "ic", "founder", "researcher", "other"]),
});

const SYSTEM = `you extract structured fields from a builder's brief self-description, then call submit_extraction.

rules:
- never invent details. only use what they typed.
- prefer specificity in interests. not "ai" or "tech" — "voice-ai", "agentic-workflows", "test-time-scaling", "ocr", "rag", "evals", etc. lowercase hyphenated keywords.
- "current_work" is a tight one-line cleanup of what they're building, lowercase.
- infer "level" from cues; default to "other" if unclear.`;

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "submit_extraction",
  description:
    "Submit the structured extraction. Always call this exactly once.",
  input_schema: {
    type: "object",
    properties: {
      interests: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 8,
        description:
          "3-6 specific lowercase-hyphenated technical or product domain keywords",
      },
      current_work: {
        type: "string",
        maxLength: 220,
        description: "tight one-line lowercase summary of what they're building",
      },
      level: {
        type: "string",
        enum: ["student", "ic", "founder", "researcher", "other"],
      },
    },
    required: ["interests", "current_work", "level"],
  },
};

export async function extract(
  name: string,
  work: string
): Promise<ExtractedInterests> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: SYSTEM,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: EXTRACT_TOOL.name },
    messages: [
      {
        role: "user",
        content: `name: ${name}\nworking on: ${work}`,
      },
    ],
  });

  const toolUse = res.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("extractor did not call submit_extraction");
  }
  const parsed = ExtractedSchema.parse(toolUse.input);
  return { ...parsed, name };
}
