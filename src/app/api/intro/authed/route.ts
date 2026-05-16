import { NextRequest } from "next/server";
import { z } from "zod";
import { extract } from "@/lib/agents/extract";
import { retrieve } from "@/lib/agents/retrieve";
import { draft } from "@/lib/agents/draft";
import { judge } from "@/lib/agents/judge";
import { webSearchTarget } from "@/lib/agents/search";
import { resolveTarget } from "@/lib/synthesize";
import { createServerSupabase } from "@/lib/supabase-server";
import { getCardForUser, listVerifiedCards } from "@/lib/db/cards";
import { findShortestPath } from "@/lib/db/friends";
import { serhan } from "@/data/serhan";

export const runtime = "nodejs";
export const maxDuration = 90;

const InputSchema = z.object({
  target: z.string().min(1).max(64),
  additional_notes: z.string().max(600).optional(),
});

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY not configured on the server.", {
      status: 503,
    });
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return new Response("not signed in", { status: 401 });
  }

  const source = await getCardForUser(user.email);
  if (!source) {
    return new Response("no card for this email", { status: 403 });
  }

  let body: z.infer<typeof InputSchema>;
  try {
    body = InputSchema.parse(await req.json());
  } catch {
    return new Response("invalid input", { status: 400 });
  }

  if (body.target === source.handle) {
    return new Response("you can't intro yourself to yourself", { status: 400 });
  }

  const target = await resolveTarget(body.target);
  if (!target) return new Response("unknown target", { status: 404 });

  const work = [
    source.building,
    source.ask && `looking for: ${source.ask}`,
    source.offer && `can offer: ${source.offer}`,
    body.additional_notes && `additional context: ${body.additional_notes}`,
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 240);

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
        const extracted = await extract(source.name, work);
        send("extracted", extracted);

        // Kick off web search early. It's the slowest step.
        const searchP = webSearchTarget(target.card);

        send("stage", { id: "path" });
        const pathHandles = await findShortestPath(source.handle, target.card.handle);
        const allCards = await listVerifiedCards();
        const nameMap: Record<string, string> = {
          [serhan.card.handle]: serhan.card.name,
          [source.handle]: source.name,
          [target.card.handle]: target.card.name,
        };
        for (const c of allCards) nameMap[c.handle] = c.name;
        const path = pathHandles
          ? { handles: pathHandles, names: nameMap }
          : { handles: [], names: nameMap };
        send("path", { handles: pathHandles ?? [], names: nameMap });

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
          path,
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
            path,
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
