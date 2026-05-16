import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { CorpusChunk, ExtractedInterests, JudgeVerdict } from "@/lib/types";

const VerdictSchema = z.object({
  passes: z.boolean(),
  score: z.number().min(0).max(10),
  issues: z.array(z.string()).max(6),
  rewrite_hint: z.string().max(400).nullish().transform((v) => v ?? undefined),
});

const SYSTEM = `you are an editor judging a cold-intro draft. apply this rubric.

ONLY #1 and #2 are pass/fail. #3 is a quality score, not a gate.

1. GROUNDING — every factual claim about the target must be supported by the retrieved corpus chunks, web findings, or the target's card (all shown below). a hallucinated claim = FAIL.

2. PLATITUDES — any of these = FAIL:
   "excited", "passionate", "amazing", "powerful", "synergy", "leverage" (as a verb), "ecosystem", "delve", "robust", "streamline", "tapestry", "paradigm"
   ALSO fail: generic-and-vague openers like "you both work on AI" or "you both build agents" with no specific evidence.

3. SCORE (0-10, informational) — how natural does this read?
   - 9-10: specific, grounded, conversational, sounds like a real person sent it
   - 5-8: fine, maybe a touch awkward or generic
   - 0-4: forced, robotic, or pretending an overlap exists when it doesn't
   forced fake-specificity LOSES POINTS but is NOT a fail. honest acknowledgments of no-overlap also do NOT fail — they pass cleanly.

include rewrite_hint ONLY when passes=false (i.e. groundng or platitude fail). one specific actionable instruction, 1-2 sentences.`;

const JUDGE_TOOL: Anthropic.Tool = {
  name: "submit_verdict",
  description: "Submit the judgment. Always call this exactly once.",
  input_schema: {
    type: "object",
    properties: {
      passes: { type: "boolean" },
      score: { type: "number", minimum: 0, maximum: 10 },
      issues: { type: "array", items: { type: "string" }, maxItems: 6 },
      rewrite_hint: {
        type: "string",
        maxLength: 400,
        description: "Present only when passes=false.",
      },
    },
    required: ["passes", "score", "issues"],
  },
};

export async function judge(args: {
  draft: string;
  visitor: ExtractedInterests;
  retrieved: CorpusChunk[];
  webFindings?: string[];
}): Promise<JudgeVerdict> {
  const client = new Anthropic();
  const findings = args.webFindings ?? [];
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 700,
    system: SYSTEM,
    tools: [JUDGE_TOOL],
    tool_choice: { type: "tool", name: JUDGE_TOOL.name },
    messages: [
      {
        role: "user",
        content: `DRAFT TO JUDGE:
${args.draft}

VISITOR:
name: ${args.visitor.name}
working on: ${args.visitor.current_work}
interests: ${args.visitor.interests.join(", ")}

RETRIEVED CORPUS CHUNKS:
${args.retrieved.map((c) => `- ${c.topic}: ${c.content}`).join("\n")}

WEB FINDINGS:
${findings.length > 0 ? findings.map((f, i) => `- [w${i + 1}] ${f}`).join("\n") : "(none)"}`,
      },
    ],
  });

  const toolUse = res.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("judge did not call submit_verdict");
  }
  return VerdictSchema.parse(toolUse.input);
}
