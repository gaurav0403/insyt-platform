import type { SentimentPoint } from "@/components/insyt/sentiment-sparkline";

function randSparkline(bias: "pos" | "neg" | "neu"): SentimentPoint[] {
  return Array.from({ length: 10 }, (_, i) => {
    const s = i > 7 ? bias : (["pos", "neu", "neg"] as const)[Math.floor(Math.random() * 3)];
    return { value: Math.floor(Math.random() * 70 + 15), sentiment: s };
  });
}

export interface PersonCardData {
  id: string;
  name: string;
  role: string;
  organization: string;
  sentiment7d: SentimentPoint[];
  sentimentScore: number;
  mentionCount: number;
  severity: number;
  tag?: string;
}

export interface TopicData {
  name: string;
  detail: string;
  sentiment: number;
  sources?: string;
}

export interface AttentionRowData {
  channel: string;
  reach: number;
  mentionCount: number;
  sentimentDirection: "pos" | "neu" | "neg";
}

export interface PersonDetailData extends PersonCardData {
  bio: string;
  monitoringScope: string;
  sourceMix: string;
  sourceMixDetail: string;
  audienceTrust: string;
  audienceTrustDetail: string;
  topics: TopicData[];
  attention: AttentionRowData[];
}

export const people: PersonCardData[] = [
  { id: "p1", name: "T.S. Kalyanaraman", role: "Chairman", organization: "Kalyan", sentimentScore: 0.56, mentionCount: 312, severity: 1, sentiment7d: randSparkline("pos") },
  { id: "p2", name: "Ramesh Kalyanaraman", role: "Exec. Director", organization: "Kalyan", sentimentScore: 0.34, mentionCount: 142, severity: 1, sentiment7d: randSparkline("pos") },
  { id: "p3", name: "Rajesh Kalyanaraman", role: "Exec. Director", organization: "Kalyan", sentimentScore: 0.12, mentionCount: 88, severity: 1, sentiment7d: randSparkline("neu") },
  { id: "p4", name: "Katrina Kaif", role: "Brand Ambassador", organization: "Kalyan", sentimentScore: 0.62, mentionCount: 2180, severity: 1, tag: "Brand \u00B7 Ambassador", sentiment7d: randSparkline("pos") },
  { id: "p5", name: "Amitabh Bachchan", role: "Brand Ambassador", organization: "Kalyan", sentimentScore: 0.74, mentionCount: 3412, severity: 1, tag: "Brand \u00B7 Ambassador", sentiment7d: randSparkline("pos") },
  { id: "p6", name: "M.G. George Muthoot", role: "Chairman", organization: "Muthoot", sentimentScore: 0.28, mentionCount: 96, severity: 1, tag: "Comp \u00B7 Muthoot", sentiment7d: randSparkline("pos") },
  { id: "p7", name: "Ahammed M.P.", role: "Chairman", organization: "Malabar", sentimentScore: -0.18, mentionCount: 122, severity: 2, tag: "Comp \u00B7 Malabar", sentiment7d: randSparkline("neg") },
];

export const personDetail: PersonDetailData = {
  ...people[0],
  bio: "Chairman, Kalyan Jewellers \u00B7 b. 1948 \u00B7 resident, Thrissur",
  monitoringScope: "Primary",
  sourceMix: "Print 64%",
  sourceMixDetail: "Business 31% \u00B7 trade 22% \u00B7 regional 11%.",
  audienceTrust: "High",
  audienceTrustDetail: "Net positive across 14 quarters.",
  topics: [
    { name: "Stewardship", detail: "the family-business arc", sentiment: 0.74, sources: "15 articles cite the founding story" },
    { name: "Hallmarking practice", detail: "audit floor in Thrissur", sentiment: 0.56, sources: "BusinessLine, Manorama, Mint" },
    { name: "Akshaya Tritiya outlook", detail: "", sentiment: 0.48, sources: "Mentioned in 9 pre-event pieces" },
    { name: "Tier-2 expansion", detail: "", sentiment: 0.18, sources: "Trade press, neutral framing" },
    { name: "Succession & family governance", detail: "", sentiment: -0.04, sources: "Watching closely" },
    { name: "Pillai segment", detail: "adjacency, not direct", sentiment: -0.34, sources: "Not yet a personal-reputation issue" },
  ],
  attention: [
    { channel: "English press", reach: 4200000, mentionCount: 96, sentimentDirection: "pos" },
    { channel: "Malayalam press", reach: 2100000, mentionCount: 84, sentimentDirection: "pos" },
    { channel: "Trade publications", reach: 680000, mentionCount: 62, sentimentDirection: "neu" },
    { channel: "X / Twitter", reach: 1800000, mentionCount: 48, sentimentDirection: "neu" },
    { channel: "YouTube", reach: 920000, mentionCount: 22, sentimentDirection: "neg" },
  ],
};
