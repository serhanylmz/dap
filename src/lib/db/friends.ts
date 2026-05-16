import {
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
  supabasePublic,
  supabaseService,
} from "@/lib/supabase";

export type FriendshipStatus = "pending" | "accepted" | "rejected";

export type Friendship = {
  id: string;
  requester_handle: string;
  recipient_handle: string;
  status: FriendshipStatus;
  created_at: string;
  responded_at: string | null;
};

export type Inbox = {
  incoming: Friendship[];
  outgoing: Friendship[];
  accepted: Friendship[];
};

export async function createFriendRequest(
  requester: string,
  recipient: string
): Promise<{ ok: true; status: FriendshipStatus } | { ok: false; error: string }> {
  if (requester === recipient) {
    return { ok: false, error: "can't friend yourself." };
  }
  if (!isSupabaseServiceConfigured()) {
    return { ok: false, error: "friends are temporarily disabled (supabase not configured)." };
  }

  const supa = supabaseService();

  // If anything exists between these two (either direction), surface its status.
  const { data: existing } = await supa
    .from("friendships")
    .select("id,status,requester_handle,recipient_handle")
    .or(
      `and(requester_handle.eq.${requester},recipient_handle.eq.${recipient}),and(requester_handle.eq.${recipient},recipient_handle.eq.${requester})`
    )
    .maybeSingle();

  if (existing) {
    return { ok: true, status: existing.status as FriendshipStatus };
  }

  const { error } = await supa.from("friendships").insert({
    requester_handle: requester,
    recipient_handle: recipient,
    status: "pending",
  });

  if (error) {
    console.error("createFriendRequest:", error.message);
    return { ok: false, error: "couldn't send the request." };
  }
  return { ok: true, status: "pending" };
}

export async function respondToFriendRequest(
  friendshipId: string,
  recipientHandle: string,
  action: "accept" | "reject"
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseServiceConfigured()) {
    return { ok: false, error: "friends are temporarily disabled." };
  }

  const supa = supabaseService();

  const { data: row, error: readErr } = await supa
    .from("friendships")
    .select("recipient_handle,status")
    .eq("id", friendshipId)
    .maybeSingle();

  if (readErr || !row) {
    return { ok: false, error: "request not found." };
  }
  if (row.recipient_handle !== recipientHandle) {
    return { ok: false, error: "only the recipient can respond." };
  }
  if (row.status !== "pending") {
    return { ok: false, error: `already ${row.status}.` };
  }

  const { error: updErr } = await supa
    .from("friendships")
    .update({
      status: action === "accept" ? "accepted" : "rejected",
      responded_at: new Date().toISOString(),
    })
    .eq("id", friendshipId);

  if (updErr) {
    console.error("respondToFriendRequest:", updErr.message);
    return { ok: false, error: "couldn't update the request." };
  }
  return { ok: true };
}

export async function listInbox(handle: string): Promise<Inbox> {
  const empty: Inbox = { incoming: [], outgoing: [], accepted: [] };
  if (!isSupabaseServiceConfigured()) return empty;

  const supa = supabaseService();
  const { data, error } = await supa
    .from("friendships")
    .select("*")
    .or(`requester_handle.eq.${handle},recipient_handle.eq.${handle}`)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("listInbox:", error?.message);
    return empty;
  }

  const rows = data as Friendship[];
  return {
    incoming: rows.filter((r) => r.recipient_handle === handle && r.status === "pending"),
    outgoing: rows.filter((r) => r.requester_handle === handle && r.status === "pending"),
    accepted: rows.filter((r) => r.status === "accepted"),
  };
}

/**
 * Status between two handles (either direction), from the perspective of `me`.
 * Returns "none", "pending_outgoing", "pending_incoming", "accepted", or "rejected".
 */
export async function relationStatus(
  me: string,
  other: string
): Promise<{
  state: "none" | "pending_outgoing" | "pending_incoming" | "accepted" | "rejected";
  friendshipId?: string;
}> {
  if (!isSupabaseServiceConfigured()) return { state: "none" };
  const supa = supabaseService();
  const { data } = await supa
    .from("friendships")
    .select("id,status,requester_handle,recipient_handle")
    .or(
      `and(requester_handle.eq.${me},recipient_handle.eq.${other}),and(requester_handle.eq.${other},recipient_handle.eq.${me})`
    )
    .maybeSingle();

  if (!data) return { state: "none" };
  if (data.status === "accepted") return { state: "accepted", friendshipId: data.id };
  if (data.status === "rejected") return { state: "rejected", friendshipId: data.id };
  if (data.status === "pending") {
    return data.requester_handle === me
      ? { state: "pending_outgoing", friendshipId: data.id }
      : { state: "pending_incoming", friendshipId: data.id };
  }
  return { state: "none" };
}

/**
 * Shortest path between two handles in the accepted-friendships graph.
 * Uses BFS. Returns the list of handles including endpoints, or null if disconnected.
 */
export async function findShortestPath(
  source: string,
  target: string
): Promise<string[] | null> {
  if (source === target) return [source];
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabasePublic()
    .from("friendships")
    .select("requester_handle,recipient_handle")
    .eq("status", "accepted");

  if (error || !data) {
    console.error("findShortestPath:", error?.message);
    return null;
  }

  const graph = new Map<string, Set<string>>();
  for (const row of data as { requester_handle: string; recipient_handle: string }[]) {
    const a = row.requester_handle;
    const b = row.recipient_handle;
    if (!graph.has(a)) graph.set(a, new Set());
    if (!graph.has(b)) graph.set(b, new Set());
    graph.get(a)!.add(b);
    graph.get(b)!.add(a);
  }

  if (!graph.has(source) || !graph.has(target)) return null;

  const queue: string[][] = [[source]];
  const seen = new Set<string>([source]);
  while (queue.length > 0) {
    const path = queue.shift()!;
    const last = path[path.length - 1];
    if (last === target) return path;
    const neighbors = graph.get(last);
    if (!neighbors) continue;
    for (const next of neighbors) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push([...path, next]);
      }
    }
  }
  return null;
}
