export type EventTag =
  | "SS26 SF"
  | "Edge Esmeralda 26"
  | "AI Engineer Summit"
  | "NeurIPS SF satellite"
  | "Manifest 26"
  | "In SF, any week";

export type Link = {
  label: string;
  href: string;
};

export type Artifact = {
  detail: string;
  url?: string;
};

export type Card = {
  handle: string;
  name: string;
  voice: "casual" | "formal";
  headline: string;
  building: string;
  ask: string;
  offer: string;
  eventTags: EventTag[];
  origin: { city: string; country: string };
  links: Link[];
  artifacts: Artifact[];
  photo_url?: string | null;
};

export type CorpusChunk = {
  id: string;
  topic: string;
  content: string;
  tags: string[];
};

export type Profile = {
  card: Card;
  corpus: CorpusChunk[];
  voiceSamples: string[];
};

export type ExtractedInterests = {
  name: string;
  current_work: string;
  interests: string[];
  level: "student" | "ic" | "founder" | "researcher" | "other";
};

export type JudgeVerdict = {
  passes: boolean;
  score: number;
  issues: string[];
  rewrite_hint?: string;
};
