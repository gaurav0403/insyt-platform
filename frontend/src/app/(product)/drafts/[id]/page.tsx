"use client";

import { PageHeader } from "@/components/insyt/page-header";
import { SectionEyebrow } from "@/components/insyt/section-eyebrow";
import { Wordmark } from "@/components/insyt/wordmark";
import { mockDraft, draftTypes } from "@/lib/mock/drafts";

function ToneSlider({ label, value }: { label: string; value: number }) {
  const parts = label.split(" \u2194 ");
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="t-label text-text-3">{label}</span>
        <span className="font-mono text-[13px] text-text-2">
          {value.toFixed(2)}
        </span>
      </div>
      <div className="relative h-2 bg-surface-3">
        <div
          className="absolute top-0 left-0 h-full bg-vermilion-3"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function ActionDraftingPage() {
  const d = mockDraft;

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <PageHeader
          title="The drafting"
          highlight="engine"
        />
        <div className="t-label text-text-3 mt-4">
          Stories {"\u00B7"} Hallmarking {"\u00B7"} Kerala {"\u00B7"}{" "}
          <span className="text-vermilion-3">
            | Regional press response {"\u00B7"} V3 {"\u00B7"} In review
          </span>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-[240px_1fr_320px] gap-8">
        {/* LEFT: Context */}
        <div className="space-y-6">
          <div>
            <SectionEyebrow>Grounded in</SectionEyebrow>
            <div className="mt-3 border-t border-surface-edge pt-3">
              <div className="t-label text-text-3">Story</div>
              <p className="t-small text-text mt-1">{d.storyTitle}</p>
              <p className="t-caption mt-1">{d.storyDetail}</p>
            </div>
          </div>

          <div className="border-t border-surface-edge pt-4">
            <div className="t-label text-text-3">Voice profile</div>
            <p className="t-small text-text font-medium mt-1">
              {d.voiceProfile.name} — <span className="italic">past {d.voiceProfile.sampleCount} statements</span>
            </p>
            <p className="t-caption mt-1">{d.voiceProfile.traits}</p>
          </div>

          <div className="border-t border-surface-edge pt-4">
            <div className="t-label text-text-3">Comparable arcs</div>
            {d.comparableArcs.map((arc) => (
              <div key={arc.name} className="mt-2">
                <span className="t-small text-text">{arc.name}</span>{" "}
                <span className="t-caption">({arc.status})</span>
              </div>
            ))}
          </div>

          <div className="border-t border-surface-edge pt-4">
            <div className="t-label text-text-3">
              Sources cited {"\u00B7"} {d.sourcesCited.length}
            </div>
            {d.sourcesCited.map((src) => (
              <div key={src.name} className="mt-2">
                <span className="t-small text-text">{src.name}</span>{" "}
                <span className="t-label text-vermilion-3">{src.ref}</span>
                <p className="t-caption">{src.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: Document */}
        <div className="bg-paper text-ink p-8">
          {/* Document header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="font-serif text-[18px] font-medium text-ink">
                Insyt
              </span>
              <span className="text-vermilion" aria-hidden="true">.</span>
              <span className="t-label text-ink-3 ml-2">draft</span>
            </div>
            <span className="t-label text-ink-3">{d.eyebrow.split(" \u00B7 ").slice(1).join(" \u00B7 ")}</span>
          </div>

          {/* Draft type tabs */}
          <div className="flex gap-0 mb-6 border border-paper-edge">
            {draftTypes.map((dt) => (
              <div
                key={dt.id}
                className={`flex-1 px-3 py-2.5 t-label ${
                  dt.active
                    ? "bg-ink text-paper"
                    : "text-ink-3 border-l border-paper-edge first:border-l-0"
                }`}
              >
                {dt.label}
              </div>
            ))}
          </div>

          {/* Attribution */}
          <div className="t-label text-vermilion mb-6">{d.eyebrow}</div>

          {/* Title */}
          <h2 className="font-serif text-[32px] font-medium text-ink leading-[1.1] mb-4">
            On the{" "}
            <em className="italic">practice</em> of hallmarking — at Kalyan,
            since 2007.
          </h2>

          {/* Deck */}
          <p className="font-serif text-[17px] italic text-ink-2 leading-[1.45] mb-6 max-w-[600px]">
            {d.deck}
          </p>

          {/* Body */}
          <div className="space-y-4">
            {d.body.map((para, i) => (
              <p
                key={i}
                className="font-serif text-[16px] text-ink leading-[1.55]"
              >
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* RIGHT: Refine panel */}
        <div className="space-y-6">
          <SectionEyebrow>Refine</SectionEyebrow>

          {/* Audience */}
          <div>
            <div className="t-label text-text-3 mb-2">Audience</div>
            <div className="flex gap-2">
              {["Regional", "National", "Trade"].map((a) => (
                <button
                  key={a}
                  className={`px-3 py-1.5 t-label border ${
                    a === d.audience
                      ? "border-text text-text"
                      : "border-surface-edge text-text-3 hover:text-text"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Channel */}
          <div>
            <div className="t-label text-text-3 mb-2">Channel</div>
            <div className="flex gap-2">
              {["Press", "Social", "Internal", "Reg."].map((c) => (
                <button
                  key={c}
                  className={`px-3 py-1.5 t-label border ${
                    c === d.channel
                      ? "border-text text-text"
                      : "border-surface-edge text-text-3 hover:text-text"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <div className="t-label text-text-3 mb-2">Language</div>
            <div className="flex gap-2">
              {["Malayalam", "English", "Tamil", "Hindi"].map((l) => (
                <button
                  key={l}
                  className={`px-3 py-1.5 t-label border ${
                    l === d.language
                      ? "border-text text-text"
                      : "border-surface-edge text-text-3 hover:text-text"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <p className="t-caption mt-2">
              Translation by an Insyt-certified Malayalam editor; reviewed before publication.
            </p>
          </div>

          {/* Tone */}
          <div>
            <div className="t-label text-text-3 mb-2">Tone</div>
            {d.toneSliders.map((s) => (
              <ToneSlider key={s.label} label={s.label} value={s.value} />
            ))}
          </div>

          {/* Length */}
          <div>
            <div className="t-label text-text-3 mb-2">Length</div>
            <div className="flex gap-2">
              {["Short \u00B7 80w", "Med \u00B7 240w", "Long \u00B7 480w"].map((l, i) => (
                <button
                  key={l}
                  className={`px-3 py-1.5 t-label border ${
                    i === 1
                      ? "border-text text-text"
                      : "border-surface-edge text-text-3 hover:text-text"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
