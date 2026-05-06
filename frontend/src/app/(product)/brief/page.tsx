"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionEyebrow } from "@/components/insyt/section-eyebrow";
import {
  fetchAPI,
  type SignalSummary,
  type PatternIntelligence,
} from "@/lib/api";

interface AgendaItem {
  title: string;
  detail: string;
  sources: string;
  sentiment: number;
  theme: string;
}

export default function DailyIntelligencePage() {
  const [summary, setSummary] = useState<SignalSummary | null>(null);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [patternBrief, setPatternBrief] = useState<string>("");
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [worstStore, setWorstStore] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const [sumData, agendaData, patData] = await Promise.all([
          fetchAPI<SignalSummary>("/api/signals/summary"),
          fetch(`${base}/api/signals/agenda`, { cache: "no-store" })
            .then((r) => (r.ok ? (r.json() as Promise<{ agenda: AgendaItem[] }>) : null))
            .catch(() => null),
          fetch(`${base}/api/patterns/`, { cache: "no-store" })
            .then((r) => (r.ok ? (r.json() as Promise<PatternIntelligence>) : null))
            .catch(() => null),
        ]);
        setSummary(sumData);
        if (agendaData?.agenda) setAgenda(agendaData.agenda);
        if (patData?.brief) {
          // Take first two sentences only
          const sentences = patData.brief.split(". ");
          setPatternBrief(sentences.slice(0, 2).join(". ") + ".");
        }
        if (patData?.patterns) {
          const complaints = patData.patterns.complaint_patterns ?? [];
          setTotalComplaints(complaints.reduce((s, c) => s + c.total_mentions, 0));
          const worst = (patData.patterns.store_health ?? []).find((s) => s.status === "critical");
          if (worst) setWorstStore(`${worst.store?.replace("Kalyan Jewellers - ", "").slice(0, 20)} ${worst.avg_rating?.toFixed(1)}\u2605`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <div className="border border-vermilion/30 p-6">
          <p className="text-[16px] text-vermilion-3">API error: {error}</p>
          <p className="text-[14px] text-text-3 italic mt-1">Ensure backend is running on localhost:8000</p>
        </div>
      </div>
    );
  }

  const hero = agenda[0] ?? null;
  const supporting = agenda.slice(1, 4);

  return (
    <div>
      {/* ── MASTHEAD ── */}
      <div className="flex items-center justify-between py-3 border-b border-surface-edge mb-8">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-[28px] font-medium text-text">
            The morning <em className="italic">brief</em>
            <span className="text-vermilion-3">.</span>
          </h1>
          <span className="text-[13px] text-text-3 font-mono tracking-wide">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
        {summary && (
          <span className="text-[12px] font-mono text-text-4 tracking-wide uppercase">
            {summary.total.toLocaleString()} signals {"\u00B7"} {summary.source_types} platforms {"\u00B7"} {summary.publications} sources
          </span>
        )}
      </div>

      {/* ── HERO + SIDEBAR ── */}
      {!loading && (
        <div className="grid grid-cols-[1fr_360px] gap-6 mb-8">
          {/* HERO */}
          {hero ? (
            <div
              className={`p-6 ${
                hero.sentiment < -0.3
                  ? "border-l-[3px] border-l-vermilion-3 bg-vermilion/[0.03]"
                  : hero.sentiment > 0.3
                    ? "border-l-[3px] border-l-positive bg-positive/[0.03]"
                    : "border-l-[3px] border-l-surface-edge bg-surface-2"
              }`}
            >
              <SectionEyebrow className="mb-3">Lead</SectionEyebrow>
              <h2 className="font-serif text-[22px] font-medium text-text leading-[1.3] mb-3">
                {hero.title}
              </h2>
              <p className="font-serif text-[16px] text-text-2 leading-[1.6] mb-3">
                {hero.detail}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-text-4 uppercase tracking-[0.1em]">
                  {hero.sources}
                </span>
                <Link href="/narratives" className="text-[13px] text-text-3 hover:text-text transition-colors">
                  View narratives {"\u2192"}
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-surface-2 p-6">
              <p className="font-serif text-[16px] text-text-3 italic">
                Steady state. Nothing significant in the last 48 hours.
              </p>
            </div>
          )}

          {/* SIDEBAR */}
          <div className="flex flex-col gap-4">
            {/* Agenda */}
            {supporting.length > 0 && (
              <div className="border border-surface-edge p-4 flex-1">
                <SectionEyebrow className="mb-3">Also noted</SectionEyebrow>
                <div className="space-y-3">
                  {supporting.map((item, i) => {
                    const linkMap: Record<string, string> = {
                      consumer_experience: "/ground",
                      competitive_threat: "/narratives",
                      crisis_signal: "/narratives",
                      stock_pressure: "/narratives",
                      expansion: "/narratives",
                      brand_campaign: "/narratives",
                      regional_narrative: "/regional",
                    };
                    const href = linkMap[item.theme] ?? "/narratives";
                    return (
                      <Link key={i} href={href} className="flex items-start gap-2 group">
                        <span
                          className={`mt-1.5 block w-2 h-2 shrink-0 ${
                            item.sentiment < -0.3
                              ? "bg-vermilion-3"
                              : item.sentiment > 0.3
                                ? "bg-positive"
                                : "bg-text-4"
                          }`}
                        />
                        <div>
                          <p className="text-[14px] text-text leading-[1.4] group-hover:text-vermilion-3 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[12px] text-text-4 mt-0.5">{item.sources}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Alert strip */}
            <Link href="/ground" className={`border p-4 block group ${totalComplaints > 10 ? "border-vermilion-3/40" : "border-surface-edge"} hover:bg-surface-2 transition-colors`}>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-text">Complaints</span>
                <span className={`font-mono text-[16px] font-medium ${totalComplaints > 10 ? "text-vermilion-3" : "text-text"}`}>
                  {totalComplaints}
                </span>
              </div>
              {worstStore && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[13px] text-text-3">Worst store</span>
                  <span className="text-[13px] text-vermilion-3">{worstStore}</span>
                </div>
              )}
              <span className="text-[12px] text-text-4 group-hover:text-text-3 mt-2 block transition-colors">
                View store intelligence {"\u2192"}
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* ── THREE NUMBERS ── */}
      {summary && (
        <div className="flex items-center gap-8 mb-8">
          <Link href="/sources" className="group">
            <div className="font-serif text-[36px] font-medium text-vermilion-3 group-hover:opacity-80 transition-opacity">{summary.actionable}</div>
            <div className="text-[11px] font-mono text-text-3 uppercase tracking-[0.1em]">
              Actionable <span className="text-text-4 group-hover:text-text-3 transition-colors">{"\u2192"}</span>
            </div>
          </Link>
          <div className="w-px h-10 bg-surface-edge" />
          <Link href="/narratives" className="group">
            <div className="font-serif text-[36px] font-medium text-text group-hover:opacity-80 transition-opacity">{summary.strategic}</div>
            <div className="text-[11px] font-mono text-text-3 uppercase tracking-[0.1em]">
              Strategic <span className="text-text-4 group-hover:text-text-3 transition-colors">{"\u2192"}</span>
            </div>
          </Link>
          <div className="w-px h-10 bg-surface-edge" />
          <Link href="/narratives" className="group">
            <div className={`font-serif text-[36px] font-medium group-hover:opacity-80 transition-opacity ${(summary.avg_sentiment ?? 0) > 0.1 ? "text-positive" : (summary.avg_sentiment ?? 0) < -0.1 ? "text-vermilion-3" : "text-text"}`}>
              {summary.avg_sentiment != null ? (summary.avg_sentiment > 0 ? "+" : "") + summary.avg_sentiment.toFixed(2) : "\u2014"}
            </div>
            <div className="text-[11px] font-mono text-text-3 uppercase tracking-[0.1em]">
              Sentiment <span className="text-text-4 group-hover:text-text-3 transition-colors">{"\u2192"}</span>
            </div>
          </Link>
        </div>
      )}

      {/* ── PATTERN SUMMARY (2 sentences, not a section) ── */}
      {patternBrief && (
        <div className="border-t border-surface-edge pt-4 mb-4">
          <p className="font-serif text-[15px] text-text-2 leading-[1.6] max-w-[800px] italic">
            {patternBrief}
          </p>
          <Link href="/ground" className="text-[12px] text-text-4 hover:text-text-3 transition-colors mt-2 inline-block">
            View full pattern analysis {"\u2192"}
          </Link>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div className="pt-3 border-t border-surface-edge">
        <span className="text-[11px] font-mono text-text-4 tracking-[0.08em]">
          {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST {"\u00B7"}
          {" "}Claude Sonnet {"\u00B7"}
          {" "}News + X + YouTube + Reviews + Reddit + Instagram
        </span>
      </div>
    </div>
  );
}
