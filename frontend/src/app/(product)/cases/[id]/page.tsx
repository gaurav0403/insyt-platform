"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { SectionEyebrow } from "@/components/insyt/section-eyebrow";
import { SeverityBar } from "@/components/insyt/severity-bar";
import { caseData, caseSnapshots } from "@/lib/mock/crisis";
import type { CaseEvent, CaseSnapshot } from "@/lib/mock/crisis";

/* ─── Helpers ─── */

const TOTAL_HOURS = 96;
const SNAPSHOT_HOURS = [0, 12, 24, 38, 48, 72, 96];

function nearestSnapshot(hour: number): CaseSnapshot {
  let best = 0;
  for (const h of SNAPSHOT_HOURS) {
    if (h <= hour) best = h;
  }
  return caseSnapshots[best];
}

function hourToDate(hour: number): string {
  const base = new Date("2023-03-14T00:00:00+05:30");
  const target = new Date(base.getTime() + hour * 3600 * 1000);
  const day = target.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const time = target.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
  return `${day}, ${time} IST`;
}

const EVENT_KIND_COLOR: Record<CaseEvent["kind"], string> = {
  signal: "bg-bone-3",
  detection: "bg-vermilion-3",
  draft: "bg-bone-2",
  external: "bg-bone-2",
};

const STAGE_LABEL: Record<string, string> = {
  monitoring: "Monitoring",
  escalation: "Escalation",
  critical: "Critical",
};

const STAGE_COLOR: Record<string, string> = {
  monitoring: "text-text-3",
  escalation: "text-caution",
  critical: "text-vermilion-3",
};

/* ─── Tick marks ─── */

function TimelineTicks() {
  const ticks = [
    { hour: 0, label: "00:00 \u00B7 DAY 1" },
    { hour: 12, label: "12:00" },
    { hour: 24, label: "00:00 \u00B7 DAY 2" },
    { hour: 36, label: "12:00" },
    { hour: 48, label: "00:00 \u00B7 DAY 3" },
    { hour: 60, label: "12:00" },
    { hour: 72, label: "00:00 \u00B7 DAY 4" },
    { hour: 84, label: "12:00" },
    { hour: 96, label: "00:00 \u00B7 DAY 5" },
  ];
  return (
    <div className="relative h-4 w-full">
      {ticks.map((t) => (
        <div
          key={t.hour}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${(t.hour / TOTAL_HOURS) * 100}%` }}
        >
          <span className="block w-px h-2 bg-bone-4" />
          <span className="t-label text-text-4 text-[9px] mt-0.5 whitespace-nowrap">
            {t.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Event pins ─── */

function EventPins({ events }: { events: CaseEvent[] }) {
  return (
    <>
      {events.map((ev) => (
        <div
          key={ev.label}
          className="absolute top-0 flex flex-col items-center -translate-x-1/2"
          style={{ left: `${(ev.hour / TOTAL_HOURS) * 100}%` }}
        >
          <span
            className={`block w-2 h-2 ${EVENT_KIND_COLOR[ev.kind]}`}
          />
          <span className="t-label text-[8px] text-text-3 mt-1 whitespace-nowrap max-w-[80px] truncate">
            {ev.label}
          </span>
        </div>
      ))}
    </>
  );
}

/* ─── Signal card ─── */

function SignalCard({ item }: { item: { id: string; source: string; tier: string; summary: string; time: string; language: string } }) {
  return (
    <div className="border-b border-surface-edge py-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="t-label text-vermilion-3">{item.tier}</span>
        <span className="t-label text-text-3">{item.source}</span>
        <span className="t-label text-text-4 ml-auto">{item.language}</span>
      </div>
      <p className="t-small text-text-2">{item.summary}</p>
      <span className="t-label text-text-4 mt-1 block">{item.time}</span>
    </div>
  );
}

/* ─── Page ─── */

export default function CrisisReconstructionPage() {
  const [currentHour, setCurrentHour] = useState(38);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const snap = nearestSnapshot(currentHour);

  const handlePrev = useCallback(() => {
    setCurrentHour((h) => Math.max(0, h - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentHour((h) => Math.min(TOTAL_HOURS, h + 1));
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentHour((h) => {
          if (h >= TOTAL_HOURS) {
            setIsPlaying(false);
            return TOTAL_HOURS;
          }
          return h + 1;
        });
      }, 250);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  return (
    <div>
      {/* ── Custom header ── */}
      <header className="mb-12">
        <SectionEyebrow className="text-vermilion-3 mb-4">
          Crisis reconstruction {"\u00B7"} Case study no. 14
        </SectionEyebrow>

        <h1 className="t-headline text-text">
          The Tanishq <em className="italic">hallmarking</em> moment,
          replayed day by day
          <span className="text-vermilion-3">.</span>
        </h1>

        <p className="t-lede italic text-text-2 max-w-[860px] mt-4">
          {caseData.deck}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-8 mt-6 py-4 border-t border-b border-surface-edge">
          <span className="t-label text-text-3">
            Case {"\u00B7"} Tanishq hallmarking
          </span>
          <span className="t-label text-text-3">
            Window {"\u00B7"} 96 hours
          </span>
          <span className="t-label text-text-3">
            Signals replayed {"\u00B7"} 4,820
          </span>
          <span className="t-label text-vermilion-3">
            INSYT&apos;S FIRST ALERT {"\u00B7"} 26 HOURS BEFORE THE
            ACTUAL RESPONSE
          </span>
        </div>
      </header>

      {/* ── Scrubber ── */}
      <section className="mb-10">
        {/* Controls bar */}
        <div className="flex items-center justify-between mb-4">
          <span className="t-label text-text-3">
            REPLAY TIMELINE {"\u00B7"} 96 HOURS
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="w-8 h-8 flex items-center justify-center border border-surface-edge text-text-2 hover:text-text hover:border-text-3 transition-colors"
                aria-label="Previous hour"
              >
                {"\u2190"}
              </button>
              <button
                onClick={togglePlay}
                className="w-8 h-8 flex items-center justify-center border border-surface-edge text-text-2 hover:text-text hover:border-text-3 transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "\u2016" : "\u25B6"}
              </button>
              <button
                onClick={handleNext}
                className="w-8 h-8 flex items-center justify-center border border-surface-edge text-text-2 hover:text-text hover:border-text-3 transition-colors"
                aria-label="Next hour"
              >
                {"\u2192"}
              </button>
            </div>
            <span className="t-label text-text-3">x4</span>
            <span className="t-label text-text">
              Hour {currentHour} of {TOTAL_HOURS}
            </span>
          </div>
        </div>

        {/* Timeline bar */}
        <div className="relative bg-surface-2 border border-surface-edge h-16">
          {/* Tick marks */}
          <div className="absolute bottom-0 left-0 right-0 px-2">
            <TimelineTicks />
          </div>

          {/* Event pins */}
          <div className="absolute top-2 left-0 right-0 px-2">
            <div className="relative h-8">
              <EventPins events={caseData.events} />
            </div>
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-vermilion-3 z-10 pointer-events-none"
            style={{
              left: `${(currentHour / TOTAL_HOURS) * 100}%`,
            }}
          />

          {/* Invisible range input for drag */}
          <input
            type="range"
            min={0}
            max={TOTAL_HOURS}
            step={1}
            value={currentHour}
            onChange={(e) => setCurrentHour(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            aria-label="Timeline scrubber"
          />
        </div>
      </section>

      {/* ── Current hour info ── */}
      <div className="flex items-center gap-6 mb-8">
        <span className="t-subtitle text-text">
          Hour {currentHour} {"\u00B7"} {hourToDate(currentHour)}
        </span>
        <span
          className={`t-label ${STAGE_COLOR[snap.detection.stage] ?? "text-text-3"}`}
        >
          {STAGE_LABEL[snap.detection.stage] ?? snap.detection.stage}
        </span>
        <span className="t-label text-text-3">
          Severity {snap.detection.severity} / 5
        </span>
      </div>

      {/* ── Three panes ── */}
      <div className="grid grid-cols-3 gap-8 mb-16">
        {/* Pane 1: What was happening */}
        <div className="bg-surface-2 border border-surface-edge p-6">
          <SectionEyebrow className="mb-4">
            What was happening
          </SectionEyebrow>

          <div className="flex items-center gap-6 mb-4">
            <div>
              <div className="t-label text-text-4">Raw</div>
              <div className="font-serif text-[28px] font-medium text-text">
                {snap.signals.rawCount.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="t-label text-text-4">Retained</div>
              <div className="font-serif text-[28px] font-medium text-text-2">
                {snap.signals.retained.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="t-label text-text-4">Material</div>
              <div className="font-serif text-[28px] font-medium text-vermilion-3">
                {snap.signals.material}
              </div>
            </div>
          </div>

          <div className="border-t border-surface-edge pt-3">
            {snap.signals.items.length === 0 ? (
              <p className="t-small text-text-3 italic">
                No signals in this window.
              </p>
            ) : (
              snap.signals.items.map((item) => (
                <SignalCard key={item.id} item={item} />
              ))
            )}
          </div>
        </div>

        {/* Pane 2: What Insyt detected */}
        <div className="bg-surface-2 border border-surface-edge p-6">
          <SectionEyebrow className="mb-4">
            What Insyt detected
          </SectionEyebrow>

          <div className="space-y-5">
            <div>
              <div className="t-label text-text-4 mb-2">Severity</div>
              <div className="flex items-center gap-3">
                <SeverityBar value={snap.detection.severity} />
                <span className="t-label text-text-2">
                  {snap.detection.severity} / 5
                </span>
              </div>
            </div>

            <div>
              <div className="t-label text-text-4 mb-2">Confidence</div>
              <div className="font-serif text-[28px] font-medium text-text">
                {Math.round(snap.detection.confidence * 100)}%
              </div>
            </div>

            <div>
              <div className="t-label text-text-4 mb-2">Stage</div>
              <span
                className={`t-label ${STAGE_COLOR[snap.detection.stage] ?? "text-text-3"}`}
              >
                {STAGE_LABEL[snap.detection.stage] ?? snap.detection.stage}
              </span>
            </div>

            <div className="border-t border-surface-edge pt-4">
              <div className="t-label text-text-4 mb-2">
                Interpretation
              </div>
              <p className="t-body text-text-2">
                {snap.detection.interpretation}
              </p>
            </div>
          </div>
        </div>

        {/* Pane 3: What Insyt would have drafted */}
        <div className="bg-surface-2 border border-surface-edge p-6">
          <SectionEyebrow className="mb-4">
            What Insyt would have drafted
          </SectionEyebrow>

          {snap.draft.reviewStatus === "none" ? (
            <p className="t-small text-text-3 italic">
              No draft at this stage. Signals have not yet crossed the
              drafting threshold.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {snap.draft.draftedAt && (
                  <span className="t-label text-text-4">
                    {snap.draft.draftedAt}
                  </span>
                )}
                <span
                  className={`t-label ${
                    snap.draft.reviewStatus === "approved"
                      ? "text-positive"
                      : snap.draft.reviewStatus === "reviewed"
                        ? "text-caution"
                        : "text-text-3"
                  }`}
                >
                  {snap.draft.reviewStatus}
                </span>
              </div>

              {snap.draft.audience && (
                <div className="t-label text-text-3">
                  {snap.draft.audience}
                </div>
              )}

              {snap.draft.title && (
                <h3 className="t-subtitle text-text">
                  {snap.draft.title}
                </h3>
              )}

              {snap.draft.deck && (
                <p className="t-small italic text-text-2">
                  {snap.draft.deck}
                </p>
              )}

              <div className="border-t border-surface-edge pt-3 space-y-3">
                {snap.draft.body.map((paragraph, i) => (
                  <p key={i} className="t-small text-text-2">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Verdict bar ── */}
      <footer className="border-t-2 border-text/10 pt-8 pb-4">
        <SectionEyebrow className="mb-4">
          {"\u00A7"} The verdict
        </SectionEyebrow>
        <p className="t-title italic text-text max-w-[960px]">
          {caseData.verdict}
        </p>
      </footer>
    </div>
  );
}
