import { NextRequest } from "next/server";
import { z } from "zod";
import { extract } from "@/lib/agents/extract";
import { retrieve } from "@/lib/agents/retrieve";
import { draft } from "@/lib/agents/draft";
import { judge } from "@/lib/agents/judge";
import { webSearchTarget } from "@/lib/agents/search";
import { resolveTarget } from "@/lib/synthesize";

export const runtime = "nodejs";
export const maxDuration = 90;

const InputSchema = z.object({
  name: z.string().min(1).max(80),
  work: z.string().min(1).max(240),
  target: z.string().default("serhan"),
});

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      "ANTHROPIC_API_KEY not configured on the server.",
      { status: 503 }
    );
  }

  let body: z.infer<typeof InputSchema>;
  try {
    body = InputSchema.parse(await req.json());
  } catch {
    return new Response("invalid input", { status: 400 });
  }

  const target = await resolveTarget(body.target);
  if (!target) return new Response("unknown target", { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // client disconnected
        }
      };

      try {
        send("stage", { id: "extract" });
        const extracted = await extract(body.name, body.work);
        send("extracted", extracted);

        // Kick off web search early — it's the slowest step. Run it in parallel
        // with the (instant, local) BM25 retrieve.
        const searchP = webSearchTarget(target.card);

        send("stage", { id: "retrieve" });
        const retrieved = retrieve(extracted, target.corpus, 5);
        send("retrieved", {
          chunks: retrieved.map((r) => ({
            id: r.chunk.id,
            score: Number(r.score.toFixed(3)),
          })),
        });

        send("stage", { id: "search" });
        const webFindings = await searchP;
        send("search", { findings: webFindings });

        send("stage", { id: "draft" });
        const drafted = await draft({
          visitor: extracted,
          retrieved: retrieved.map((r) => r.chunk),
          webFindings,
          target: target.card,
          voiceSamples: target.voiceSamples,
          onToken: (token) => send("token", { text: token, pass: 1 }),
        });

        send("stage", { id: "judge" });
        const verdict = await judge({
          draft: drafted,
          visitor: extracted,
          retrieved: retrieved.map((r) => r.chunk),
          webFindings,
        });
        send("verdict", verdict);

        let finalText = drafted;
        if (!verdict.passes && verdict.rewrite_hint) {
          send("stage", { id: "revise" });
          finalText = await draft({
            visitor: extracted,
            retrieved: retrieved.map((r) => r.chunk),
            webFindings,
            target: target.card,
            voiceSamples: target.voiceSamples,
            critique: verdict.rewrite_hint,
            onToken: (token) => send("token", { text: token, pass: 2 }),
          });
        }

        send("final", { text: finalText });
        send("done", {});
        controller.close();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "unknown error";
        send("error", { message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
