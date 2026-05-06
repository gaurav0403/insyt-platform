import { SectionEyebrow } from "./section-eyebrow";
import { SeverityBar } from "./severity-bar";

interface BriefingCardProps {
  variant?: "hero" | "column" | "compact";
  eyebrow: string;
  title: string;
  deck?: string;
  body?: string;
  severity: number;
  meta?: string;
  delta?: string;
  storyNumber?: number;
  totalStories?: number;
}

export function BriefingCard({
  variant = "column",
  eyebrow,
  title,
  deck,
  body,
  severity,
  meta,
  delta,
  storyNumber,
  totalStories,
}: BriefingCardProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-4 py-3 border-b border-surface-edge">
        <SeverityBar value={severity} />
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <span className="t-small text-text flex-1">{title}</span>
        {meta && <span className="t-label text-text-3">{meta}</span>}
      </div>
    );
  }

  const isHero = variant === "hero";

  return (
    <article className="border-t border-surface-edge pt-6">
      <div className="flex items-center gap-3 mb-3">
        <SeverityBar value={severity} />
        <SectionEyebrow>
          Severity {severity} of 5 {" \u00B7 "} {eyebrow}
        </SectionEyebrow>
        {storyNumber && totalStories && (
          <span className="t-label text-text-4 ml-auto">
            Story no. {storyNumber} of {totalStories} today
          </span>
        )}
      </div>

      <h2
        className={`font-serif font-medium text-text leading-tight mb-3 ${
          isHero
            ? "text-[36px] tracking-[-0.015em]"
            : "text-[24px] tracking-[-0.01em]"
        }`}
      >
        {title}
      </h2>

      {deck && (
        <p
          className={`font-serif italic text-text-2 mb-3 ${
            isHero ? "text-[17px] leading-[1.5]" : "text-[15px] leading-[1.5]"
          }`}
        >
          {deck}
        </p>
      )}

      {body && (
        <p className="t-body text-text-2 max-w-[640px]">{body}</p>
      )}

      {(delta || meta) && (
        <div className="flex items-center gap-3 mt-4">
          {delta && (
            <span className="t-label text-vermilion-3">{delta}</span>
          )}
          {meta && <span className="t-label text-text-3">{meta}</span>}
        </div>
      )}
    </article>
  );
}
