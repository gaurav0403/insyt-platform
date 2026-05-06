"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAPI, type Mention, type MentionStats } from "@/lib/api";

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-label text-stone">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-display text-4xl font-semibold text-ink">
          {value}
        </div>
        {sub && <p className="text-meta text-stone mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function MentionRow({ mention }: { mention: Mention }) {
  const time = mention.published_at
    ? new Date(mention.published_at).toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        {mention.source_url ? (
          <a
            href={mention.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-ink hover:text-ochre transition-colors truncate block"
          >
            {mention.title || "Untitled"}
          </a>
        ) : (
          <p className="text-sm font-medium text-ink truncate">
            {mention.title || "Untitled"}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-label">
            {mention.source_publication || mention.source_type}
          </Badge>
          <span className="text-meta text-stone">{time}</span>
          {mention.source_url && (
            <a
              href={mention.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-meta text-stone hover:text-ochre"
            >
              ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface BriefData {
  headline: string | null;
  subheadline: string | null;
  opening_paragraph: string | null;
  sections: { title: string; content: string }[] | string | null;
  metrics: { label: string; value: string; source: string }[] | string | null;
  date: string | null;
}

export default function BriefPage() {
  const [stats, setStats] = useState<MentionStats | null>(null);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, mentionsData, briefData] = await Promise.all([
          fetchAPI<MentionStats>("/api/mentions/stats"),
          fetchAPI<{ mentions: Mention[] }>("/api/mentions/?limit=10&sort=date"),
          fetchAPI<{ brief: BriefData | null }>("/api/briefs/latest"),
        ]);
        setStats(statsData);
        setMentions(mentionsData.mentions);
        setBrief(briefData.brief);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-ochre/30 bg-ochre/5">
          <CardContent className="pt-6">
            <p className="text-sm text-ochre">
              Could not connect to API. Ensure the backend is running on{" "}
              <code className="font-mono text-xs">localhost:8000</code>.
            </p>
            <p className="text-meta text-stone mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Brief headline */}
      <div>
        {brief ? (
          <>
            <h1 className="font-display text-3xl lg:text-4xl font-semibold text-ink leading-tight">
              {brief.headline}
            </h1>
            <p className="text-base text-slate mt-2 max-w-3xl leading-relaxed">
              {brief.subheadline}
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-ink leading-tight">
              The Kalyan narrative, today
            </h1>
            <p className="text-base text-slate mt-2 max-w-2xl leading-relaxed">
              Context intelligence across news, social, regulatory, and market
              signals for Kalyan Jewellers India Limited.
            </p>
          </>
        )}
      </div>

      {/* Brief opening paragraph */}
      {brief?.opening_paragraph && (
        <Card className="bg-parchment border-0">
          <CardContent className="pt-5 pb-5">
            <p className="text-[15px] text-ink leading-[1.7] max-w-3xl">
              {brief.opening_paragraph}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <MetricCard
              label="Total mentions"
              value={(stats?.total ?? 0).toLocaleString()}
              sub={`${Object.keys(stats?.by_publication ?? {}).length}+ publications`}
            />
            <MetricCard
              label="Sentiment pulse"
              value={stats?.avg_sentiment != null ? (stats.avg_sentiment > 0 ? "+" : "") + stats.avg_sentiment.toFixed(2) : "—"}
              sub={stats?.analyzed ? `${stats.analyzed.toLocaleString()} analyzed` : "Pending"}
            />
            <MetricCard
              label="Entity links"
              value={(stats?.entity_links ?? 0).toLocaleString()}
              sub="Across 39 tracked entities"
            />
          </>
        )}
      </div>

      {/* Latest mentions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-label text-stone">
            Latest mentions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : mentions.length > 0 ? (
            <div>
              {mentions.map((m) => (
                <MentionRow key={m.id} mention={m} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone py-4">No mentions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
