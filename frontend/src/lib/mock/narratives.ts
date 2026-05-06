import type { SentimentPoint } from "@/components/insyt/sentiment-sparkline";

export interface ThemeCardData {
  id: string;
  name: string;
  mentionCount: number;
  sentiment: number;
  direction: "rising" | "steady" | "declining";
  severity: number;
  sparkline: SentimentPoint[];
}

export interface ShareRowData {
  entity: string;
  isYou: boolean;
  pct: number;
  sentiment: number;
}

export interface SourceGravityData {
  id: string;
  name: string;
  where: string;
  gravity: number;
  sparkline: SentimentPoint[];
  lastSeen: string;
  editorNote?: string;
}

export interface VolumeBucket {
  date: string;
  yours: number;
  competitors: number;
  neutral: number;
}

function randSparkline(bias: "pos" | "neg" | "neu"): SentimentPoint[] {
  return Array.from({ length: 10 }, (_, i) => {
    const isTail = i > 7;
    const s = isTail
      ? bias
      : (["pos", "neu", "neg"] as const)[Math.floor(Math.random() * 3)];
    return { value: Math.floor(Math.random() * 70 + 15), sentiment: s };
  });
}

export const themes: ThemeCardData[] = [
  {
    id: "t1",
    name: "Hallmarking compliance",
    mentionCount: 2184,
    sentiment: -0.62,
    direction: "rising",
    severity: 3,
    sparkline: randSparkline("neg"),
  },
  {
    id: "t2",
    name: "Akshaya Tritiya readiness",
    mentionCount: 1402,
    sentiment: 0.34,
    direction: "rising",
    severity: 1,
    sparkline: randSparkline("pos"),
  },
  {
    id: "t3",
    name: "Gold-price commentary",
    mentionCount: 1184,
    sentiment: -0.04,
    direction: "steady",
    severity: 1,
    sparkline: randSparkline("neu"),
  },
  {
    id: "t4",
    name: "Showroom experience \u00B7 Tier-2",
    mentionCount: 812,
    sentiment: -0.28,
    direction: "rising",
    severity: 2,
    sparkline: randSparkline("neg"),
  },
  {
    id: "t5",
    name: "Candere \u00B7 digital sub-brand",
    mentionCount: 624,
    sentiment: 0.18,
    direction: "steady",
    severity: 1,
    sparkline: randSparkline("pos"),
  },
  {
    id: "t6",
    name: "Wedding-season demand",
    mentionCount: 488,
    sentiment: 0.22,
    direction: "steady",
    severity: 1,
    sparkline: randSparkline("pos"),
  },
];

export const shareData: ShareRowData[] = [
  { entity: "Kalyan Jewellers", isYou: true, pct: 28.4, sentiment: -0.18 },
  { entity: "Tanishq", isYou: false, pct: 31.2, sentiment: 0.12 },
  { entity: "Malabar Gold", isYou: false, pct: 18.6, sentiment: 0.08 },
  { entity: "Joyalukkas", isYou: false, pct: 12.1, sentiment: 0.04 },
  { entity: "Others", isYou: false, pct: 9.7, sentiment: 0.0 },
];

export const topSources: SourceGravityData[] = [
  { id: "sg1", name: "Reshma Pillai", where: "YouTube \u00B7 Kochi", gravity: 9.1, sparkline: randSparkline("neg"), lastSeen: "2 hours ago", editorNote: "Independent. History of stories crossing into print." },
  { id: "sg2", name: "Manorama News", where: "Print + broadcast \u00B7 Kottayam", gravity: 9.4, sparkline: randSparkline("neu"), lastSeen: "4 hours ago" },
  { id: "sg3", name: "Mathrubhumi", where: "Print \u00B7 Kozhikode", gravity: 9.2, sparkline: randSparkline("neu"), lastSeen: "6 hours ago" },
  { id: "sg4", name: "Economic Times", where: "Digital \u00B7 National", gravity: 8.8, sparkline: randSparkline("pos"), lastSeen: "1 hour ago" },
  { id: "sg5", name: "Business Line", where: "Print \u00B7 National", gravity: 8.5, sparkline: randSparkline("pos"), lastSeen: "3 hours ago" },
  { id: "sg6", name: "Daily Thanthi", where: "Print \u00B7 Chennai", gravity: 8.1, sparkline: randSparkline("neu"), lastSeen: "8 hours ago" },
];

// 90-day volume data for area chart
export const volumeSeries: VolumeBucket[] = Array.from({ length: 90 }, (_, i) => {
  const date = new Date(2026, 0, 26 + i);
  const base = 80 + Math.random() * 40;
  const spike = i > 75 ? (i - 75) * 15 : 0;
  return {
    date: date.toISOString().slice(0, 10),
    yours: Math.floor(base * 0.28 + spike * 0.4),
    competitors: Math.floor(base * 0.52 + spike * 0.1),
    neutral: Math.floor(base * 0.2),
  };
});

export const narrativeStats = {
  totalMentions: 14802,
  sentiment: -0.62,
  sentimentPrev: -0.04,
  shareOfVoice: 28.4,
  sourceGravity: 7.4,
};
