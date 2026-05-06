"use client";

import { useState } from "react";
import { PageHeader } from "@/components/insyt/page-header";
import { SectionEyebrow } from "@/components/insyt/section-eyebrow";
import { SentimentSparkline } from "@/components/insyt/sentiment-sparkline";
import { Rule } from "@/components/insyt/rule";
import {
  taxonomyTree,
  sources,
  sourceProfiles,
  savedViews,
  tierMeta,
  type TaxonomyNode,
  type SourceData,
  type SourceProfile,
} from "@/lib/mock/sources";

/* ── Taxonomy tree item ── */

function TaxonomyItem({
  node,
  depth = 0,
}: {
  node: TaxonomyNode;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded((prev) => !prev)}
        className={`w-full flex items-center justify-between py-1.5 text-left group ${
          depth > 0 ? "pl-4" : ""
        }`}
      >
        <span className="flex items-center gap-2">
          {hasChildren && (
            <span className="t-label text-text-4 w-3 text-center select-none">
              {expanded ? "\u2013" : "+"}
            </span>
          )}
          {!hasChildren && depth > 0 && (
            <span className="w-3" />
          )}
          <span className="t-small text-text-2 group-hover:text-text transition-colors">
            {node.label}
          </span>
        </span>
        <span className="font-mono text-[11px] text-text-4">
          {node.count}
        </span>
      </button>
      {hasChildren && expanded && (
        <div className="border-l border-surface-edge ml-1.5">
          {node.children!.map((child) => (
            <TaxonomyItem key={child.label} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Filter chip ── */

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`t-label px-3 py-1.5 transition-colors ${
        active
          ? "bg-text text-surface"
          : "text-text-3 hover:text-text"
      }`}
    >
      {label}
    </button>
  );
}

/* ── Read rating dots ── */

function ReadRating({ rating }: { rating: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Read rating ${rating} of 3`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`inline-block w-1.5 h-1.5 ${
            n <= rating ? "bg-bone-2" : "bg-surface-3"
          }`}
        />
      ))}
    </span>
  );
}

/* ── Source row ── */

function SourceRow({
  source,
  isSelected,
  onSelect,
}: {
  source: SourceData;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const flaggedClasses = source.isEditoriallyFlagged
    ? "bg-surface-2 border-l-2 border-l-vermilion-3"
    : "border-l-2 border-l-transparent";

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left grid grid-cols-[1.6fr_70px_90px_90px_70px_70px_1fr] items-center gap-3 px-3 py-2.5 transition-colors ${flaggedClasses} ${
        isSelected ? "bg-surface-3" : "hover:bg-surface-3/50"
      }`}
    >
      {/* Name + where */}
      <div className="min-w-0">
        <div className="t-small text-text font-medium truncate">
          {source.name}
        </div>
        <div className="t-label text-text-4 mt-0.5 truncate">{source.where}</div>
      </div>

      {/* Lang */}
      <span className="t-label text-text-3">{source.lang}</span>

      {/* Gravity */}
      <span
        className={`font-mono text-[14px] font-medium ${
          source.gravity >= 9
            ? "text-text"
            : source.gravity >= 7
              ? "text-text-2"
              : "text-text-3"
        }`}
      >
        {source.gravity.toFixed(1)}
      </span>

      {/* Reach */}
      <span className="font-mono text-[11px] text-text-3">{source.reach}</span>

      {/* Read rating */}
      <ReadRating rating={source.readRating} />

      {/* Frequency */}
      <span className="t-label text-text-4 truncate">{source.frequency}</span>

      {/* Sentiment sparkline */}
      <div>
        <SentimentSparkline data={source.sentiment30d} height={20} />
      </div>
    </button>
  );
}

/* ── Tier section ── */

function TierSection({
  tier,
  tierSources,
  selectedId,
  onSelect,
}: {
  tier: string;
  tierSources: SourceData[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const meta = tierMeta[tier];
  if (!meta || tierSources.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="t-label text-text-2">
          {meta.label}
        </span>
        <span className="t-label text-text-4">
          {"\u00B7"} {meta.description} {"\u00B7"} {tierSources.length} sources
        </span>
      </div>
      <Rule className="mb-2" />

      {/* Column headers */}
      <div className="grid grid-cols-[1.6fr_70px_90px_90px_70px_70px_1fr] gap-3 px-3 py-1.5 mb-1">
        <span className="t-label text-text-4">Source</span>
        <span className="t-label text-text-4">Lang</span>
        <span className="t-label text-text-4">Gravity</span>
        <span className="t-label text-text-4">Reach</span>
        <span className="t-label text-text-4">Read</span>
        <span className="t-label text-text-4">Freq</span>
        <span className="t-label text-text-4">Sentiment 30d</span>
      </div>

      <div className="space-y-0">
        {tierSources.map((source) => (
          <SourceRow
            key={source.id}
            source={source}
            isSelected={source.id === selectedId}
            onSelect={() => onSelect(source.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Focus pane stat row ── */

function FocusStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-surface-edge">
      <span className="t-label text-text-4">{label}</span>
      <span className="t-small text-text">{value}</span>
    </div>
  );
}

/* ── Focus pane ── */

function SourceFocusPane({ profile }: { profile: SourceProfile | undefined }) {
  if (!profile) {
    return (
      <div className="pt-6">
        <p className="t-small text-text-3 italic">
          Select a source with a full profile to view details.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="t-title text-text mb-2">{profile.name}</h3>
        <div className="flex items-center gap-2">
          <span className="t-label text-text-2">{profile.tier}</span>
          <span className="t-label text-text-4">{"\u00B7"}</span>
          <span className="t-label text-text-3">{profile.medium}</span>
          <span className="t-label text-text-4">{"\u00B7"}</span>
          <span className="t-label text-text-3">{profile.lang}</span>
        </div>
      </div>

      <Rule className="mb-4" />

      <div className="space-y-0">
        <FocusStat label="Gravity" value={`${profile.gravity.toFixed(1)} / 10`} />
        <FocusStat label="Established" value={profile.established} />
        <FocusStat label="Based in" value={profile.basedIn} />
        <FocusStat label="Subscribers" value={profile.subscribers} />
        <FocusStat label="Median views" value={profile.medianViews} />
        <FocusStat label="Cadence" value={profile.cadence} />
        <FocusStat
          label="Historical accuracy"
          value={`${Math.round(profile.historicalAccuracy * 100)}%`}
        />
      </div>

      <div className="mt-6">
        <SectionEyebrow className="mb-2">Audience trust</SectionEyebrow>
        <p className="t-small text-text-2">{profile.audienceTrust}</p>
      </div>

      <div className="mt-4">
        <SectionEyebrow className="mb-2">Sentiment to brand</SectionEyebrow>
        <p className="t-small text-text-2">{profile.sentimentToBrand}</p>
      </div>

      {/* Editor note */}
      <div className="mt-6 border-l-2 border-l-vermilion-3 pl-4 py-2">
        <SectionEyebrow className="mb-2">Editor note</SectionEyebrow>
        <p className="t-small text-text-2 italic leading-relaxed">
          {profile.editorNote.body}
        </p>
        <p className="t-label text-text-4 mt-2">{profile.editorNote.by}</p>
      </div>

      {/* Recent appearances */}
      <div className="mt-6">
        <SectionEyebrow className="mb-3">Recent appearances</SectionEyebrow>
        <div className="space-y-3">
          {profile.recentAppearances.map((appearance, i) => (
            <div key={i} className="border-b border-surface-edge pb-2.5">
              <p className="t-small text-text">{appearance.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="t-label text-text-4">{appearance.date}</span>
                <span
                  className={`t-label ${
                    appearance.sentiment === "neg"
                      ? "text-vermilion-3"
                      : appearance.sentiment === "pos"
                        ? "text-positive"
                        : "text-text-3"
                  }`}
                >
                  {appearance.sentiment === "neg"
                    ? "Negative"
                    : appearance.sentiment === "pos"
                      ? "Positive"
                      : "Neutral"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */

const TIER_FILTERS = ["ALL", "A", "B", "C", "D"] as const;
const MEDIUM_FILTERS = ["ALL", "PRINT", "DIGITAL", "YOUTUBE", "X"] as const;

export default function SourceLibraryPage() {
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [selectedMedium, setSelectedMedium] = useState<string>("ALL");
  const [selectedSource, setSelectedSource] = useState<string>(sources[0].id);

  const filtered = sources.filter((s) => {
    const tierMatch = selectedTier === "ALL" || s.tier === selectedTier;
    const mediumMatch =
      selectedMedium === "ALL" ||
      s.medium.toUpperCase() === selectedMedium ||
      (selectedMedium === "X" && s.medium === "X");
    return tierMatch && mediumMatch;
  });

  const tiers = selectedTier === "ALL" ? ["A", "B", "C", "D"] : [selectedTier];

  const profile = sourceProfiles[selectedSource];

  return (
    <div>
      <PageHeader
        title="The source"
        highlight="library"
        deck="4,212 sources, weighted by gravity. Gravity is Insyt's measure of how much a source moves the conversation when it speaks -- a composite of reach, trust, historical accuracy, and crossover velocity."
      />

      {/* Three-column layout */}
      <div className="grid grid-cols-[240px_1fr_360px] gap-8">
        {/* ── LEFT RAIL: Taxonomy + Saved views ── */}
        <div>
          <SectionEyebrow className="mb-3">
            Source taxonomy {"\u00B7"} 4,212
          </SectionEyebrow>
          <div className="space-y-0.5">
            {taxonomyTree.map((node) => (
              <TaxonomyItem key={node.label} node={node} />
            ))}
          </div>

          <Rule className="my-6" />

          <SectionEyebrow className="mb-3">Saved views</SectionEyebrow>
          <div className="space-y-1">
            {savedViews.map((view) => (
              <div
                key={view.id}
                className="flex items-center justify-between py-1.5 px-2 hover:bg-surface-3 transition-colors cursor-pointer"
              >
                <span className="t-small text-text-2">{view.name}</span>
                <span className="font-mono text-[11px] text-text-4">
                  {view.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER: Filters + Directory ── */}
        <div>
          {/* Filter bar */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-1">
              <span className="t-label text-text-4 mr-2">Tier</span>
              {TIER_FILTERS.map((t) => (
                <FilterChip
                  key={t}
                  label={t}
                  active={selectedTier === t}
                  onClick={() => setSelectedTier(t)}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="t-label text-text-4 mr-2">Medium</span>
              {MEDIUM_FILTERS.map((m) => (
                <FilterChip
                  key={m}
                  label={m}
                  active={selectedMedium === m}
                  onClick={() => setSelectedMedium(m)}
                />
              ))}
            </div>
          </div>

          <Rule className="mb-6" />

          {/* Source directory grouped by tier */}
          {tiers.map((tier) => {
            const tierSources = filtered.filter((s) => s.tier === tier);
            return (
              <TierSection
                key={tier}
                tier={tier}
                tierSources={tierSources}
                selectedId={selectedSource}
                onSelect={setSelectedSource}
              />
            );
          })}

          {filtered.length === 0 && (
            <p className="t-small text-text-3 italic py-8">
              No sources match the current filters.
            </p>
          )}
        </div>

        {/* ── RIGHT RAIL: Focus pane ── */}
        <div className="border-l border-surface-edge pl-6">
          <SectionEyebrow className="mb-4">Source profile</SectionEyebrow>
          <SourceFocusPane profile={profile} />
        </div>
      </div>
    </div>
  );
}
