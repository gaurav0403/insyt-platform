"use client";

import { useState } from "react";
import { PageHeader } from "@/components/insyt/page-header";
import { SectionEyebrow } from "@/components/insyt/section-eyebrow";
import { SeverityBar } from "@/components/insyt/severity-bar";
import { SentimentSparkline } from "@/components/insyt/sentiment-sparkline";
import { people, personDetail } from "@/lib/mock/people";
import type { PersonCardData } from "@/lib/mock/people";

function PersonStrip({
  people: items,
  selected,
  onSelect,
}: {
  people: PersonCardData[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 mb-8">
      {items.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`shrink-0 w-[200px] text-left p-4 border transition-colors ${
            selected === p.id
              ? "border-vermilion-3 bg-surface-2"
              : "border-surface-edge hover:bg-surface-2"
          }`}
        >
          <div className="t-small text-text font-medium">{p.name}</div>
          <div className="t-label text-text-3 mt-0.5">
            {p.tag ?? `${p.role} \u00B7 ${p.organization}`}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`t-label ${
                p.sentimentScore >= 0.1
                  ? "text-positive"
                  : p.sentimentScore <= -0.1
                    ? "text-vermilion-3"
                    : "text-text-3"
              }`}
            >
              {p.sentimentScore > 0 ? "+" : ""}
              {p.sentimentScore.toFixed(2)}
            </span>
            <span className="t-label text-text-3">{p.mentionCount}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function formatReach(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

export default function PeopleMonitoringPage() {
  const [selected, setSelected] = useState(people[0].id);
  const detail = personDetail; // In production, fetch by selected ID

  return (
    <div>
      <PageHeader
        title="People"
        highlight="monitoring"
        deck="Individuals as distinct reputational entities — executives, public figures, brand ambassadors. Each with their own signal landscape, their own arc, their own audience."
      />

      {/* Person strip */}
      <PersonStrip
        people={people}
        selected={selected}
        onSelect={setSelected}
      />

      {/* Detail view */}
      <div className="grid grid-cols-[1fr_400px] gap-8">
        {/* Left: Profile + metrics */}
        <div>
          <SectionEyebrow className="mb-4 text-vermilion-3">
            Profile {"\u00B7"} 90 days {"\u00B7"} Primary
          </SectionEyebrow>

          <h2 className="t-headline text-text mb-2">
            T.S.{" "}
            <em className="italic">Kalyanaraman</em>
          </h2>
          <p className="t-lede italic text-text-2 mb-8">{detail.bio}</p>

          {/* Metrics row */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div>
              <div className="t-label text-text-3">Sentiment {"\u00B7"} 90d</div>
              <div className="font-serif text-[28px] font-medium text-positive mt-1">
                +{detail.sentimentScore.toFixed(2)}
              </div>
              <p className="t-caption">
                Steady, supportive — across English, Malayalam, Tamil.
              </p>
            </div>
            <div>
              <div className="t-label text-text-3">Mentions {"\u00B7"} 90d</div>
              <div className="font-serif text-[28px] font-medium text-text mt-1">
                {detail.mentionCount}
              </div>
              <p className="t-caption">Average 3.5 / day.</p>
            </div>
            <div>
              <div className="t-label text-text-3">Source mix</div>
              <div className="font-serif text-[28px] font-medium text-text mt-1">
                {detail.sourceMix}
              </div>
              <p className="t-caption">{detail.sourceMixDetail}</p>
            </div>
            <div>
              <div className="t-label text-text-3">Audience trust</div>
              <div className="font-serif text-[28px] font-medium text-text mt-1">
                {detail.audienceTrust}
              </div>
              <p className="t-caption">{detail.audienceTrustDetail}</p>
            </div>
          </div>

          {/* Reputation arc placeholder */}
          <div className="border-t border-surface-edge pt-6">
            <SectionEyebrow className="mb-4">
              Reputation arc {"\u00B7"} 12 months
            </SectionEyebrow>
            <div className="h-[160px] bg-surface-2 border border-surface-edge flex items-center justify-center">
              <span className="t-caption">
                Reputation arc chart — to be wired to live data
              </span>
            </div>
          </div>
        </div>

        {/* Right: Topics + Attention */}
        <div className="space-y-8">
          <div>
            <SectionEyebrow className="mb-4">
              Topics — what is he being talked about for?
            </SectionEyebrow>
            {detail.topics.map((topic) => (
              <div
                key={topic.name}
                className="flex items-start justify-between py-3 border-b border-surface-edge"
              >
                <div className="flex-1">
                  <span className="t-small text-text font-medium">
                    {topic.name}
                  </span>
                  {topic.detail && (
                    <span className="t-small text-text-2">
                      {" \u00B7 "}
                      {topic.detail}
                    </span>
                  )}
                  {topic.sources && (
                    <p className="t-caption mt-0.5">{topic.sources}</p>
                  )}
                </div>
                <span
                  className={`font-mono text-[14px] font-medium ${
                    topic.sentiment >= 0.1
                      ? "text-positive"
                      : topic.sentiment <= -0.1
                        ? "text-vermilion-3"
                        : "text-text-3"
                  }`}
                >
                  {topic.sentiment > 0 ? "+" : ""}
                  {topic.sentiment.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div>
            <SectionEyebrow className="mb-4">
              Audience attention {"\u00B7"} by channel
            </SectionEyebrow>
            {detail.attention.map((row) => (
              <div
                key={row.channel}
                className="grid grid-cols-[1fr_80px_60px_40px] gap-3 py-2.5 border-b border-surface-edge items-center"
              >
                <span className="t-small text-text">{row.channel}</span>
                <span className="t-label text-text-3 text-right">
                  {formatReach(row.reach)}
                </span>
                <span className="t-label text-text-2 text-right">
                  {row.mentionCount}
                </span>
                <span
                  className={`w-2 h-2 justify-self-end ${
                    row.sentimentDirection === "pos"
                      ? "bg-positive"
                      : row.sentimentDirection === "neg"
                        ? "bg-vermilion-3"
                        : "bg-bone-3"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
