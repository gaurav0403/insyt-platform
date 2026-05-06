export interface SentimentPoint {
  value: number; // 0-100
  sentiment: "pos" | "neu" | "neg";
}

interface SentimentSparklineProps {
  data: SentimentPoint[];
  height?: number;
}

const sentimentColor: Record<string, string> = {
  pos: "bg-positive",
  neu: "bg-bone-3",
  neg: "bg-vermilion-3",
};

export function SentimentSparkline({
  data,
  height = 24,
}: SentimentSparklineProps) {
  return (
    <div
      className="inline-flex items-end gap-px"
      style={{ height }}
      role="img"
      aria-label={`Sentiment trend, ending ${data[data.length - 1]?.sentiment ?? "neutral"}`}
    >
      {data.map((point, i) => (
        <span
          key={i}
          className={`block w-1 ${sentimentColor[point.sentiment]}`}
          style={{ height: `${Math.max(point.value, 5)}%` }}
        />
      ))}
    </div>
  );
}
