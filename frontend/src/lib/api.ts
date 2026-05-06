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
  relevance_tier: string | null;
  relevance_score: number | null;
  query_group: string | null;
}

export interface MentionStats {
  total: number;
  by_source: Record<string, number>;
  by_publication: Record<string, number>;
  analyzed: number;
  entity_links: number;
  avg_sentiment: number | null;
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
  sentiment_trajectory: number[] | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
}

export interface MentionWithSentiment {
  id: string;
  title: string | null;
  source_url: string | null;
  source_publication: string | null;
  published_at: string | null;
  raw_content: string | null;
  sentiment_score: number | null;
  themes: string[] | null;
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

export interface Signal {
  id: string;
  title: string | null;
  content: string | null;
  source_type: string;
  source_publication: string | null;
  published_at: string | null;
  source_url: string | null;
  author: string | null;
  sentiment: number | null;
  signal_type: string;
  urgency: number | null;
  themes: string[];
  why_it_matters: string | null;
  non_obvious: string | null;
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
    views: number;
    total: number;
  } | null;
}

export interface SignalSummary {
  total: number;
  actionable: number;
  strategic: number;
  contextual: number;
  noise: number;
  urgent: number;
  avg_sentiment: number | null;
  source_types: number;
  publications: number;
  by_source: { type: string; count: number; actionable: number }[];
  top_themes: { theme: string; count: number }[];
}

export interface ComplaintPattern {
  pattern: string;
  display_name: string;
  total_mentions: number;
  platforms: string[];
  is_cross_platform: boolean;
  regions: Record<string, number>;
  is_systemic: boolean;
  severity: string;
}

export interface StoreHealth {
  store: string;
  city: string;
  state: string;
  total_reviews: number;
  avg_rating: number | null;
  avg_sentiment: number | null;
  critical_reviews: number;
  positive_reviews: number;
  health_score: number;
  status: string;
}

export interface TrendData {
  theme: string;
  display_name: string;
  recent_count: number;
  prior_count: number;
  volume_change_pct: number;
  sentiment_change: number;
  direction: string;
}

export interface PatternIntelligence {
  patterns: {
    complaint_patterns: ComplaintPattern[];
    store_health: StoreHealth[];
    trends: TrendData[];
    cross_platform: { theme: string; display_name: string; platform_count: number; platforms: string[]; total_signals: number; avg_sentiment: number | null }[];
  };
  brief: string;
}

export interface Complaint {
  id: string;
  title: string | null;
  content: string | null;
  source_type: string;
  author: string | null;
  published_at: string | null;
  source_url: string | null;
  sentiment: number | null;
  severity: number | null;
  themes: string[];
  why_it_matters: string | null;
  engagement: { likes: number; retweets: number; views: number };
}
