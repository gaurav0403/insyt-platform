"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/insyt/page-header";
import { SectionEyebrow } from "@/components/insyt/section-eyebrow";
import { fetchAPI } from "@/lib/api";

interface LangSummary {
  code: string;
  name: string;
  mentions: number;
  publications: number;
  avg_sentiment: number | null;
  latest: string | null;
}

interface RegionalMention {
  id: string;
  title: string | null;
  content: string | null;
  source_publication: string | null;
  published_at: string | null;
  source_url: string | null;
  language: string;
  language_name: string;
  sentiment: number | null;
  insight: string | null;
}

interface PubData {
  language: string;
  code: string;
  publications: { name: string; mentions: number }[];
}

export default function RegionalDepthPage() {
  const [languages, setLanguages] = useState<LangSummary[]>([]);
  const [totalMentions, setTotalMentions] = useState(0);
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const [mentions, setMentions] = useState<RegionalMention[]>([]);
  const [publications, setPublications] = useState<PubData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sumData, pubData] = await Promise.all([
          fetchAPI<{ languages: LangSummary[]; total_mentions: number }>("/api/regional/summary"),
          fetchAPI<{ languages: PubData[] }>("/api/regional/publications"),
        ]);
        setLanguages(sumData.languages);
        setTotalMentions(sumData.total_mentions);
        setPublications(pubData.languages);
        if (sumData.languages.length > 0) {
          setActiveLang(sumData.languages[0].code);
        }
      } catch (e) {
        console.error("Failed to load regional data", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Fetch mentions when language changes
  useEffect(() => {
    if (!activeLang) return;
    fetchAPI<{ mentions: RegionalMention[] }>(`/api/regional/mentions?lang=${activeLang}&limit=20`)
      .then((d) => setMentions(d.mentions))
      .catch(console.error);
  }, [activeLang]);

  const activeLangData = languages.find((l) => l.code === activeLang);
  const activePubs = publications.find((p) => p.code === activeLang);

  // Build headline from data
  const headline = languages.length > 0
    ? `${totalMentions} vernacular signals across ${languages.length} languages. ${languages[0].name} leads with ${languages[0].mentions} mentions from ${languages[0].publications} publications.`
    : "Loading regional data...";

  return (
    <div>
      <PageHeader
        title="Regional"
        highlight="depth"
        deck={headline}
      />

      {/* Language chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => setActiveLang(l.code)}
            className={`px-4 py-2.5 border transition-colors ${
              activeLang === l.code
                ? "border-text text-text bg-surface-2"
                : "border-surface-edge text-text-3 hover:text-text"
            }`}
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.1em]">
              {l.code}
            </span>
            <span className="text-[14px] ml-2">{l.name}</span>
            <span className="text-[12px] text-text-4 ml-2">{l.mentions}</span>
          </button>
        ))}
      </div>

      {/* Stats strip */}
      {activeLangData && (
        <div className="flex items-center gap-8 py-3 border-y border-surface-edge mb-8">
          <span className="text-[14px] text-text font-medium">{activeLangData.name}</span>
          <span className="text-[13px] text-text-2">{activeLangData.mentions} mentions</span>
          <span className="text-[13px] text-text-2">{activeLangData.publications} publications</span>
          <span className={`text-[13px] font-mono font-medium ${(activeLangData.avg_sentiment ?? 0) < -0.1 ? "text-vermilion-3" : (activeLangData.avg_sentiment ?? 0) > 0.1 ? "text-positive" : "text-text-3"}`}>
            Sentiment: {activeLangData.avg_sentiment != null ? (activeLangData.avg_sentiment > 0 ? "+" : "") + activeLangData.avg_sentiment.toFixed(2) : "\u2014"}
          </span>
          {activeLangData.latest && (
            <span className="text-[12px] text-text-4 ml-auto">
              Latest: {new Date(activeLangData.latest).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      )}

      {/* Two-column: Mentions + Publications */}
      <div className="grid grid-cols-[1fr_300px] gap-8">
        {/* Mentions */}
        <div>
          <SectionEyebrow className="mb-4">
            {activeLangData?.name ?? "Regional"} coverage {"\u00B7"} {mentions.length} recent
          </SectionEyebrow>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-surface-2 animate-pulse" />
              ))}
            </div>
          ) : mentions.length > 0 ? (
            <div className="space-y-1">
              {mentions.map((m) => {
                const time = m.published_at
                  ? new Date(m.published_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                  : "";
                return (
                  <div key={m.id} className="py-3 border-b border-surface-edge">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-mono text-text-4 uppercase tracking-[0.1em]">
                        {m.source_publication}
                      </span>
                      <span className="text-[11px] font-mono text-text-4 uppercase tracking-[0.1em]">
                        {m.language.toUpperCase()}
                      </span>
                      {m.sentiment != null && (
                        <span className={`text-[11px] font-mono font-medium ${m.sentiment < -0.2 ? "text-vermilion-3" : m.sentiment > 0.2 ? "text-positive" : "text-text-4"}`}>
                          {m.sentiment > 0 ? "+" : ""}{m.sentiment.toFixed(1)}
                        </span>
                      )}
                      <span className="text-[11px] text-text-4 ml-auto">{time}</span>
                    </div>

                    {/* Title as native headline */}
                    {m.source_url ? (
                      <a
                        href={m.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[16px] text-text font-medium leading-[1.35] hover:text-vermilion-3 transition-colors block"
                        lang={m.language}
                      >
                        {m.title} {"\u2197"}
                      </a>
                    ) : (
                      <p className="text-[16px] text-text font-medium leading-[1.35]" lang={m.language}>
                        {m.title}
                      </p>
                    )}

                    {/* Claude insight if available */}
                    {m.insight && (
                      <div className="mt-2 border-l-2 border-surface-edge pl-3">
                        <span className="text-[11px] font-mono text-text-4 mr-1">Insyt</span>
                        <span className="text-[13px] text-text-3 italic">{m.insight}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[14px] text-text-3 italic">No mentions for this language.</p>
          )}
        </div>

        {/* Publications sidebar */}
        <div>
          <SectionEyebrow className="mb-4">
            Sources {"\u00B7"} {activeLangData?.name ?? ""}
          </SectionEyebrow>
          {activePubs ? (
            <div className="space-y-1">
              {activePubs.publications.map((pub) => (
                <div key={pub.name} className="flex items-center justify-between py-2 border-b border-surface-edge">
                  <span className="text-[14px] text-text">{pub.name}</span>
                  <span className="text-[12px] font-mono text-text-3">{pub.mentions}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-text-4 italic">Select a language.</p>
          )}

          {/* All languages comparison */}
          <div className="mt-8 border-t border-surface-edge pt-4">
            <SectionEyebrow className="mb-3">All languages</SectionEyebrow>
            {languages.map((l) => {
              const maxMentions = Math.max(...languages.map((x) => x.mentions));
              const pct = (l.mentions / maxMentions) * 100;
              return (
                <div key={l.code} className="flex items-center gap-2 py-1.5">
                  <span className="text-[12px] text-text-3 w-[24px]">{l.code.toUpperCase()}</span>
                  <div className="flex-1 h-3 bg-surface-3">
                    <div
                      className={`h-full ${l.code === activeLang ? "bg-vermilion-3" : "bg-text-4"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-text-4 w-[30px] text-right">{l.mentions}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
