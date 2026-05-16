import type { CorpusChunk, ExtractedInterests } from "@/lib/types";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "as", "is", "was", "are", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "should", "could",
  "may", "might", "must", "shall", "can", "this", "that", "these", "those",
  "i", "you", "he", "she", "it", "we", "they", "what", "which", "who", "whom",
  "my", "your", "his", "her", "its", "our", "their", "me", "him", "us", "them",
  "if", "then", "than", "so", "too", "also", "only", "very", "just", "into",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

const K1 = 1.5;
const B = 0.75;

type Indexed = {
  chunk: CorpusChunk;
  length: number;
  termFreqs: Map<string, number>;
};

type Index = {
  signature: string;
  entries: Indexed[];
  avgLen: number;
  df: Map<string, number>;
};

let cached: Index | null = null;

function buildIndex(corpus: CorpusChunk[]): Index {
  const entries: Indexed[] = corpus.map((chunk) => {
    const tokens = [
      ...tokenize(chunk.content),
      ...chunk.tags.flatMap((t) => tokenize(t)),
      ...tokenize(chunk.topic),
    ];
    const termFreqs = new Map<string, number>();
    for (const t of tokens) termFreqs.set(t, (termFreqs.get(t) ?? 0) + 1);
    return { chunk, length: tokens.length, termFreqs };
  });

  const avgLen =
    entries.reduce((sum, i) => sum + i.length, 0) / Math.max(1, entries.length);

  const df = new Map<string, number>();
  for (const e of entries) {
    for (const term of e.termFreqs.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }

  return {
    signature: corpus.map((c) => c.id).join("|"),
    entries,
    avgLen,
    df,
  };
}

export function retrieve(
  query: ExtractedInterests,
  corpus: CorpusChunk[],
  k: number
): { chunk: CorpusChunk; score: number }[] {
  const signature = corpus.map((c) => c.id).join("|");
  if (!cached || cached.signature !== signature) {
    cached = buildIndex(corpus);
  }
  const index = cached;
  const N = index.entries.length;

  const queryText = `${query.current_work} ${query.interests.join(" ")}`;
  const queryTokens = tokenize(queryText);

  const scored = index.entries.map((entry) => {
    let score = 0;
    for (const term of queryTokens) {
      const tf = entry.termFreqs.get(term);
      if (!tf) continue;
      const dfTerm = index.df.get(term) ?? 0;
      const idf = Math.log(1 + (N - dfTerm + 0.5) / (dfTerm + 0.5));
      const num = tf * (K1 + 1);
      const den = tf + K1 * (1 - B + B * (entry.length / index.avgLen));
      score += idf * (num / den);
    }
    return { chunk: entry.chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
