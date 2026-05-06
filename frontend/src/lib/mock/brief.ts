export interface BriefingStory {
  id: string;
  eyebrow: string;
  title: string;
  deck: string;
  body: string;
  severity: number;
  delta?: string;
  meta?: string;
  narrativeId?: string;
  sources: { id: string; name: string; tier: string }[];
}

export interface BriefingLine {
  id: string;
  eyebrow: string;
  title: string;
  severity: number;
}

export interface AgendaItemData {
  id: string;
  title: string;
  owner?: string;
  due?: string;
}

export interface MockBrief {
  generatedAt: string;
  signalsProcessed: number;
  lede: string;
  hero: BriefingStory;
  columns: BriefingStory[];
  whatElse: BriefingLine[];
  agenda: AgendaItemData[];
  stats: {
    lead: number;
    watch: number;
    noted: number;
    draftsPending: number;
  };
}

export const mockBrief: MockBrief = {
  generatedAt: "2026-04-25T06:30:00+05:30",
  signalsProcessed: 4212,
  lede: "A regional Malayalam segment is moving the day\u2019s discussion. Three competitors have responded to hallmarking. You have not. One stock-relevant filing posted overnight on BSE.",
  hero: {
    id: "story-1",
    eyebrow: "Reputational \u00B7 Regional",
    title: "The hallmarking question reaches Kerala.",
    deck: "A 14-minute Malayalam YouTube segment, posted overnight, has become the day\u2019s largest source of negative discussion \u2014 without yet appearing in English press.",
    body: "The segment, by independent journalist Reshma Pillai, examines BIS hallmarking compliance among regional jewellery chains and names Kalyan twice in a 90-second passage. By 05:00 IST the upload had crossed 412,000 views and 1,840 comments, the majority of them adversarial in sentiment. The story has not yet been picked up by Manorama Online, Mathrubhumi, or other English-language outlets, but the propagation pattern is consistent with a 12\u201318 hour crossover window.",
    severity: 3,
    delta: "+318% vs 7d",
    meta: "2,184 mentions \u00B7 47 sources \u00B7 Sentiment \u22120.62",
    sources: [
      { id: "s1", name: "Pillai, R.", tier: "C" },
      { id: "s2", name: "BIS Circular 2024-HM-87", tier: "A" },
    ],
  },
  columns: [
    {
      id: "story-2",
      eyebrow: "Competitor \u00B7 Tanishq",
      title: "Tanishq Akshaya Tritiya campaign goes regional-first.",
      deck: "A notable shift in strategy: Tanishq\u2019s pre-Akshaya campaign launched in Malayalam and Tamil three days before the English creative.",
      body: "The campaign focuses on heritage gold designs and explicitly references BIS hallmarking compliance in its regional copy \u2014 a positioning move that reads as opportunistic given the current hallmarking narrative.",
      severity: 2,
      meta: "684 mentions \u00B7 Sentiment +0.34",
      sources: [
        { id: "s3", name: "Economic Times", tier: "A" },
      ],
    },
    {
      id: "story-3",
      eyebrow: "Financial \u00B7 BSE Filing",
      title: "Quarterly board meeting notice filed overnight.",
      deck: "Standard Q4 FY26 board meeting notice. No unusual items in the agenda.",
      body: "Board meeting scheduled for 14 May 2026 to consider and approve audited financial results for Q4 and FY26. Routine filing, but watch for early analyst commentary given the current narrative environment.",
      severity: 1,
      meta: "BSE \u00B7 Filed 24 Apr 23:47 IST",
      sources: [
        { id: "s4", name: "BSE India", tier: "A" },
      ],
    },
    {
      id: "story-4",
      eyebrow: "Brand \u00B7 Digital",
      title: "Candere online conversion rate crosses 3.2% for the first time.",
      deck: "The digital sub-brand is quietly outperforming its quarterly targets ahead of the Akshaya Tritiya push.",
      body: "Candere\u2019s conversion rate improvement appears driven by a combination of regional-language landing pages and a WhatsApp-first checkout flow rolled out in March.",
      severity: 1,
      meta: "Internal + trade press \u00B7 Sentiment +0.41",
      sources: [
        { id: "s5", name: "Business Today", tier: "A" },
      ],
    },
  ],
  whatElse: [
    {
      id: "wl-1",
      eyebrow: "Gold price",
      title: "Gold steady at \u20B972,840/10g; international at $2,338/oz. No significant movement expected before US Fed minutes.",
      severity: 1,
    },
    {
      id: "wl-2",
      eyebrow: "Competitor \u00B7 Malabar",
      title: "Malabar Gold opens 4th store in Hyderabad; trade press coverage positive but thin.",
      severity: 1,
    },
    {
      id: "wl-3",
      eyebrow: "Regulatory",
      title: "SEBI circular on related-party disclosure thresholds: no immediate action required, monitor for Q4 filing implications.",
      severity: 1,
    },
    {
      id: "wl-4",
      eyebrow: "Social \u00B7 X/Twitter",
      title: "Ambassador Katrina Kaif\u2019s Kalyan Akshaya Tritiya post: 2.1M impressions, 94% positive sentiment, no adversarial engagement.",
      severity: 1,
    },
  ],
  agenda: [
    {
      id: "a-1",
      title: "Review and approve the regional press response draft for the hallmarking story.",
      owner: "Comms team",
      due: "By 10:00 IST",
    },
    {
      id: "a-2",
      title: "Brief the CEO on the Tanishq Akshaya Tritiya regional-first pivot and competitive implications.",
      owner: "Strategy",
      due: "By 12:00 IST",
    },
    {
      id: "a-3",
      title: "Watch for English-press crossover of the Pillai hallmarking segment. Alert threshold set to Severity 4.",
      owner: "Insyt auto-watch",
      due: "Monitoring",
    },
  ],
  stats: {
    lead: 1,
    watch: 4,
    noted: 3,
    draftsPending: 1,
  },
};

export const watchingEntities = [
  { id: "e1", name: "Kalyan Jewellers Ltd.", primary: true },
  { id: "e2", name: "T.S. Kalyanaraman" },
  { id: "e3", name: "Ramesh Kalyanaraman" },
  { id: "e4", name: "Brand: Candere" },
  { id: "e5", name: "Tanishq", tag: "comp" },
  { id: "e6", name: "Malabar Gold", tag: "comp" },
  { id: "e7", name: "Joyalukkas", tag: "comp" },
];
