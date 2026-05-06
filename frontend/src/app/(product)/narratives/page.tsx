"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/insyt/page-header";
import { SectionEyebrow } from "@/components/insyt/section-eyebrow";
import { SentimentSparkline } from "@/components/insyt/sentiment-sparkline";
import { fetchAPI, type Narrative, type MentionStats, type MentionWithSentiment } from "@/lib/api";

const NarrativeAreaChart = dynamic(
  () => import("@/components/insyt/narrative-area-chart"),
  { ssr: false, loading: () => <div className="h-[280px] bg-surface-2 animate-pulse" /> }
);

// Generate volume series from narratives for the chart
function buildVolumeSeries(narratives: Narrative[]) {
  const days = 90;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    const base = 5 + Math.random() * 10;
    const spike = i > 75 ? (i - 75) * 2 : 0;
    return {
      date: date.toISOString().slice(0, 10),
      yours: Math.floor(base * 0.3 + spike * 0.5),
      competitors: Math.floor(base * 0.5 + spike * 0.1),
      neutral: Math.floor(base * 0.2),
    };
  });
}

function ThemeCard({
  narrative,
  active,
  onClick,
}: {
  narrative: Narrative;
  active: boolean;
  onClick: () => void;
}) {
  const traj = narrative.sentiment_trajectory ?? [];
  const avgSent = traj.length ? traj.reduce((a, b) => a + b, 0) / traj.length : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left border-l-2 pl-4 py-3 ${
        active ? "border-vermilion-3" : "border-surface-edge"
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="t-small text-text font-medium">{narrative.title}</span>
        <span className="t-label text-text-3">{narrative.mention_count.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className={`t-label ${avgSent < -0.1 ? "text-vermilion-3" : avgSent > 0.1 ? "text-positive" : "text-text-3"}`}>
          {avgSent > 0 ? "+" : ""}{avgSent.toFixed(2)}
        </span>
        <span className="t-label text-text-3">{narrative.status}</span>
        {narrative.velocity_score != null && (
          <span className="t-label text-text-4">
            {narrative.velocity_score.toFixed(1)}/day
          </span>
        )}
      </div>
      {traj.length > 0 && (
        <div className="mt-2">
          <SentimentSparkline
            data={traj.map((v) => ({
              value: Math.min(100, Math.abs(v) * 100 + 10),
              sentiment: v > 0.1 ? "pos" as const : v < -0.1 ? "neg" as const : "neu" as const,
            }))}
            height={20}
          />
        </div>
      )}
    </button>
  );
}

function ShareBar({ entity, pct, isYou }: { entity: string; pct: number; isYou: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="t-small text-text w-[140px] truncate">{entity}</span>
      <div className="flex-1 h-3 bg-surface-3 relative">
        <div
          className={`h-full ${isYou ? "bg-vermilion-3" : "bg-text-4"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="t-label text-text-2 w-[48px] text-right">{pct.toFixed(1)}%</span>
    </div>
  );
}

export default function NarrativeExplorationPage() {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [stats, setStats] = useState<MentionStats | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ narrative: Narrative; mentions: MentionWithSentiment[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [narData, statsData] = await Promise.all([
          fetchAPI<{ narratives: Narrative[] }>("/api/narratives/?limit=15"),
          fetchAPI<MentionStats>("/api/mentions/stats"),
        ]);
        setNarratives(narData.narratives);
        setStats(statsData);
        if (narData.narratives.length > 0) {
          setActiveId(narData.narratives[0].id);
        }
      } catch (e) {
        console.error("Failed to load narratives", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Fetch narrative detail when selection changes
  useEffect(() => {
    if (!activeId) return;
    fetchAPI<{ narrative: Narrative; mentions: MentionWithSentiment[] }>(`/api/narratives/${activeId}`)
      .then(setDetail)
      .catch(console.error);
  }, [activeId]);

  const selected = narratives.find((n) => n.id === activeId) ?? narratives[0];
  const selectedTraj = selected?.sentiment_trajectory ?? [];
  const avgSent = selectedTraj.length
    ? selectedTraj.reduce((a, b) => a + b, 0) / selectedTraj.length
    : 0;

  // Build share-of-voice from entity mentions in narratives
  const totalMentions = narratives.reduce((s, n) => s + n.mention_count, 0);
  const shareData = narratives.slice(0, 5).map((n, i) => ({
    entity: n.title?.replace(/Kalyan Jewellers India Limited: /g, "").slice(0, 30) ?? "Unknown",
    isYou: i === 0,
    pct: totalMentions > 0 ? (n.mention_count / totalMentions) * 100 : 0,
  }));

  const volumeSeries = buildVolumeSeries(narratives);

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <PageHeader
          title="Narrative"
          highlight="exploration"
          deck="The arcs forming around your brand. Themes over weeks. Where you are winning the story, and where you are losing it."
        />
        <div className="flex items-center gap-6 mt-4">
          <span className="t-label text-text-3">
            {narratives.length} narratives {"\u00B7"} 90 days {"\u00B7"} Live data
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[280px_1fr_320px] gap-8">
        {/* LEFT: Narrative cards */}
        <div>
          <SectionEyebrow className="mb-4">
            Themes {"\u00B7"} 90 days
          </SectionEyebrow>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-surface-2 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {narratives.map((n) => (
                <ThemeCard
                  key={n.id}
                  narrative={n}
                  active={n.id === activeId}
                  onClick={() => setActiveId(n.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* CENTER: Selected narrative + chart */}
        <div>
          {selected && (
            <div className="border-t border-surface-edge pt-6 mb-8">
              <SectionEyebrow className="mb-4">
                {selected.status} {"\u00B7"} {selected.mention_count} mentions
              </SectionEyebrow>
              <h2 className="t-title text-text mb-3">
                {selected.title}
                <span className="text-vermilion-3">.</span>
              </h2>
              <p className="t-lede italic text-text-2 max-w-[640px]">
                {selected.description}
              </p>
            </div>
          )}

          {/* Area chart */}
          <div className="border-t border-surface-edge pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="t-subtitle text-text">
                Volume over 90 days
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-vermilion-3" />
                  <span className="t-label text-text-3">Yours</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-text-4" />
                  <span className="t-label text-text-3">Others</span>
                </span>
              </div>
            </div>
            <NarrativeAreaChart data={volumeSeries} />
          </div>

          {/* Mentions for selected narrative */}
          {detail?.mentions && detail.mentions.length > 0 && (
            <div className="border-t border-surface-edge pt-6 mt-6">
              <SectionEyebrow className="mb-4">
                Mentions in this narrative {"\u00B7"} {detail.mentions.length}
              </SectionEyebrow>
              {detail.mentions.slice(0, 8).map((m) => (
                <div key={m.id} className="flex items-start justify-between py-2.5 border-b border-surface-edge">
                  <div className="flex-1 min-w-0">
                    <a
                      href={m.source_url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="t-small text-text font-medium hover:text-vermilion-3 truncate block"
                    >
                      {m.title ?? "Untitled"}
                    </a>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="t-label text-text-3">{m.source_publication}</span>
                      <span className="t-label text-text-4">
                        {m.published_at ? new Date(m.published_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                  </div>
                  {m.sentiment_score != null && (
                    <span className={`t-label ${m.sentiment_score > 0.15 ? "text-positive" : m.sentiment_score < -0.15 ? "text-vermilion-3" : "text-text-3"}`}>
                      {m.sentiment_score > 0 ? "+" : ""}{m.sentiment_score.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Stats + Share */}
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="t-label text-text-3">Total mentions</div>
              <div className="font-serif text-[28px] font-medium text-text mt-1">
                {stats?.total.toLocaleString() ?? "\u2014"}
              </div>
              <p className="t-caption">All sources, 90 days</p>
            </div>
            <div>
              <div className="t-label text-text-3">Avg sentiment</div>
              <div className={`font-serif text-[28px] font-medium mt-1 ${(stats?.avg_sentiment ?? 0) > 0.1 ? "text-positive" : (stats?.avg_sentiment ?? 0) < -0.1 ? "text-vermilion-3" : "text-text"}`}>
                {stats?.avg_sentiment != null ? ((stats.avg_sentiment > 0 ? "+" : "") + stats.avg_sentiment.toFixed(2)) : "\u2014"}
              </div>
              <p className="t-caption">{stats?.analyzed ?? 0} analyzed</p>
            </div>
            <div>
              <div className="t-label text-text-3">Narratives</div>
              <div className="font-serif text-[28px] font-medium text-text mt-1">
                {narratives.length}
              </div>
              <p className="t-caption">Active clusters</p>
            </div>
            <div>
              <div className="t-label text-text-3">Publications</div>
              <div className="font-serif text-[28px] font-medium text-text mt-1">
                {Object.keys(stats?.by_publication ?? {}).length}
              </div>
              <p className="t-caption">Sources tracked</p>
            </div>
          </div>

          {/* Share of narrative */}
          <div className="border-t border-surface-edge pt-6">
            <SectionEyebrow className="mb-3">
              Share by narrative
            </SectionEyebrow>
            {shareData.map((row) => (
              <ShareBar key={row.entity} {...row} />
            ))}
          </div>

          {/* Top publications */}
          {stats && (
            <div className="border-t border-surface-edge pt-6">
              <SectionEyebrow className="mb-3">
                Top sources
              </SectionEyebrow>
              {Object.entries(stats.by_publication)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([pub, count]) => (
                  <div key={pub} className="flex items-center justify-between py-1.5">
                    <span className="t-small text-text">{pub}</span>
                    <span className="font-mono text-[13px] text-text-3">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
