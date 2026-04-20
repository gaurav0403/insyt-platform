const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchAPI<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface Mention {
  id: string;
  source_type: string;
  source_url: string | null;
  source_publication: string | null;
  title: string | null;
  author: string | null;
  published_at: string | null;
  ingested_at: string | null;
  language: string | null;
  raw_content: string | null;
}

export interface MentionStats {
  total: number;
  by_source: Record<string, number>;
}

export interface Entity {
  id: string;
  type: string;
  canonical_name: string;
  aliases: string[];
  metadata: Record<string, unknown> | null;
}

export interface Narrative {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  mention_count: number;
  velocity_score: number | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
}

export interface Brief {
  id: string;
  date: string | null;
  headline: string | null;
  subheadline: string | null;
  opening_paragraph: string | null;
  sections: unknown;
  metrics: unknown;
  generated_at: string | null;
}
