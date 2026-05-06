import type { SentimentPoint } from "@/components/insyt/sentiment-sparkline";

/* ── Taxonomy ── */

export interface TaxonomyNode {
  label: string;
  count: number;
  children?: TaxonomyNode[];
  active: boolean;
}

export const taxonomyTree: TaxonomyNode[] = [
  { label: "National English press", count: 218, active: true },
  { label: "Business & trade", count: 186, active: true },
  {
    label: "Vernacular print",
    count: 488,
    active: true,
    children: [
      { label: "Malayalam", count: 96, active: true },
      { label: "Tamil", count: 112, active: true },
      { label: "Hindi", count: 128, active: true },
      { label: "+9 languages", count: 152, active: true },
    ],
  },
  { label: "Vernacular broadcast", count: 312, active: true },
  { label: "Independent / YouTube", count: 624, active: true },
  {
    label: "Social real-time",
    count: 812,
    active: true,
    children: [
      { label: "X / Twitter", count: 284, active: true },
      { label: "Instagram", count: 196, active: true },
      { label: "Reddit", count: 142, active: true },
      { label: "WhatsApp groups", count: 112, active: true },
      { label: "Telegram trade", count: 78, active: true },
    ],
  },
  { label: "Local reviews", count: 1148, active: true },
  { label: "Regulatory & gov", count: 96, active: true },
  { label: "Walk-in surveys", count: 218, active: true },
];

/* ── Source rows ── */

export interface SourceData {
  id: string;
  name: string;
  where: string;
  tier: "A" | "B" | "C" | "D";
  medium: string;
  lang: string;
  gravity: number;
  reach: string;
  readRating: 1 | 2 | 3;
  frequency: string;
  sentiment30d: SentimentPoint[];
  isEditoriallyFlagged: boolean;
}

function randSparkline(bias: "pos" | "neg" | "neu"): SentimentPoint[] {
  return Array.from({ length: 14 }, (_, i) => {
    const isTail = i > 10;
    const s = isTail
      ? bias
      : (["pos", "neu", "neg"] as const)[Math.floor(Math.random() * 3)];
    return { value: Math.floor(Math.random() * 70 + 20), sentiment: s };
  });
}

export const sources: SourceData[] = [
  // ── Tier A: institutionally trusted ──
  {
    id: "src-001",
    name: "Manorama News",
    where: "Print + broadcast \u00B7 Kottayam",
    tier: "A",
    medium: "Print",
    lang: "ML",
    gravity: 9.4,
    reach: "4.8M / day",
    readRating: 3,
    frequency: "Daily",
    sentiment30d: randSparkline("neu"),
    isEditoriallyFlagged: true,
  },
  {
    id: "src-002",
    name: "Mathrubhumi",
    where: "Print \u00B7 Kozhikode",
    tier: "A",
    medium: "Print",
    lang: "ML",
    gravity: 9.2,
    reach: "3.6M / day",
    readRating: 3,
    frequency: "Daily",
    sentiment30d: randSparkline("neu"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-003",
    name: "Daily Thanthi",
    where: "Print \u00B7 Chennai",
    tier: "A",
    medium: "Print",
    lang: "TA",
    gravity: 8.1,
    reach: "2.1M / day",
    readRating: 3,
    frequency: "Daily",
    sentiment30d: randSparkline("neu"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-004",
    name: "Economic Times",
    where: "Digital + print \u00B7 National",
    tier: "A",
    medium: "Digital",
    lang: "EN",
    gravity: 8.8,
    reach: "6.2M / day",
    readRating: 3,
    frequency: "Continuous",
    sentiment30d: randSparkline("pos"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-005",
    name: "The Hindu",
    where: "Print + digital \u00B7 Chennai",
    tier: "A",
    medium: "Print",
    lang: "EN",
    gravity: 8.6,
    reach: "3.8M / day",
    readRating: 3,
    frequency: "Daily",
    sentiment30d: randSparkline("neu"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-006",
    name: "Business Line",
    where: "Print + digital \u00B7 National",
    tier: "A",
    medium: "Print",
    lang: "EN",
    gravity: 8.5,
    reach: "1.4M / day",
    readRating: 3,
    frequency: "Daily",
    sentiment30d: randSparkline("pos"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-007",
    name: "NDTV Profit",
    where: "Broadcast + digital \u00B7 National",
    tier: "A",
    medium: "Digital",
    lang: "EN",
    gravity: 8.3,
    reach: "2.9M / day",
    readRating: 3,
    frequency: "Continuous",
    sentiment30d: randSparkline("pos"),
    isEditoriallyFlagged: false,
  },

  // ── Tier B: influential, specialist or regional ──
  {
    id: "src-008",
    name: "Asianet News",
    where: "Broadcast \u00B7 Thiruvananthapuram",
    tier: "B",
    medium: "Digital",
    lang: "ML",
    gravity: 7.8,
    reach: "2.4M / day",
    readRating: 2,
    frequency: "Continuous",
    sentiment30d: randSparkline("neu"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-009",
    name: "Dinamalar",
    where: "Print \u00B7 Chennai",
    tier: "B",
    medium: "Print",
    lang: "TA",
    gravity: 7.4,
    reach: "1.8M / day",
    readRating: 2,
    frequency: "Daily",
    sentiment30d: randSparkline("neu"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-010",
    name: "Dainik Bhaskar",
    where: "Print \u00B7 Bhopal",
    tier: "B",
    medium: "Print",
    lang: "HI",
    gravity: 7.6,
    reach: "4.2M / day",
    readRating: 2,
    frequency: "Daily",
    sentiment30d: randSparkline("pos"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-011",
    name: "Livemint",
    where: "Digital \u00B7 National",
    tier: "B",
    medium: "Digital",
    lang: "EN",
    gravity: 7.9,
    reach: "2.8M / day",
    readRating: 2,
    frequency: "Continuous",
    sentiment30d: randSparkline("pos"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-012",
    name: "Jewellery World Magazine",
    where: "Trade \u00B7 Mumbai",
    tier: "B",
    medium: "Print",
    lang: "EN",
    gravity: 7.1,
    reach: "82K / issue",
    readRating: 2,
    frequency: "Monthly",
    sentiment30d: randSparkline("pos"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-013",
    name: "Kairali TV",
    where: "Broadcast \u00B7 Kochi",
    tier: "B",
    medium: "Digital",
    lang: "ML",
    gravity: 7.0,
    reach: "1.2M / day",
    readRating: 2,
    frequency: "Continuous",
    sentiment30d: randSparkline("neg"),
    isEditoriallyFlagged: false,
  },

  // ── Tier C: vocal but narrower reach ──
  {
    id: "src-014",
    name: "Reshma Pillai",
    where: "YouTube \u00B7 Kochi",
    tier: "C",
    medium: "YouTube",
    lang: "ML",
    gravity: 7.2,
    reach: "412K / video",
    readRating: 2,
    frequency: "2\u20133x / week",
    sentiment30d: randSparkline("neg"),
    isEditoriallyFlagged: true,
  },
  {
    id: "src-015",
    name: "Gold Rate India (X)",
    where: "X / Twitter \u00B7 National",
    tier: "C",
    medium: "X",
    lang: "EN",
    gravity: 6.4,
    reach: "184K followers",
    readRating: 1,
    frequency: "8\u201312x / day",
    sentiment30d: randSparkline("neu"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-016",
    name: "Kerala Jewellery Forum",
    where: "Reddit \u00B7 r/KeralaJewellery",
    tier: "C",
    medium: "X",
    lang: "EN",
    gravity: 5.8,
    reach: "38K members",
    readRating: 1,
    frequency: "15\u201320 posts / day",
    sentiment30d: randSparkline("neg"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-017",
    name: "Priya Menon",
    where: "YouTube \u00B7 Thrissur",
    tier: "C",
    medium: "YouTube",
    lang: "ML",
    gravity: 6.1,
    reach: "188K / video",
    readRating: 1,
    frequency: "Weekly",
    sentiment30d: randSparkline("pos"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-018",
    name: "Retail Jeweller India",
    where: "Digital \u00B7 Mumbai",
    tier: "C",
    medium: "Digital",
    lang: "EN",
    gravity: 6.6,
    reach: "94K / month",
    readRating: 2,
    frequency: "Weekly",
    sentiment30d: randSparkline("pos"),
    isEditoriallyFlagged: false,
  },

  // ── Tier D: low-gravity, watch only ──
  {
    id: "src-019",
    name: "Thrissur Gold WhatsApp",
    where: "WhatsApp \u00B7 Thrissur trade",
    tier: "D",
    medium: "X",
    lang: "ML",
    gravity: 4.2,
    reach: "~2.4K members",
    readRating: 1,
    frequency: "Continuous",
    sentiment30d: randSparkline("neg"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-020",
    name: "Swarna Veedhi Telegram",
    where: "Telegram \u00B7 All India trade",
    tier: "D",
    medium: "X",
    lang: "HI",
    gravity: 3.8,
    reach: "~1.1K members",
    readRating: 1,
    frequency: "6\u20138x / day",
    sentiment30d: randSparkline("neu"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-021",
    name: "Google Reviews \u00B7 Kalyan Kochi",
    where: "Google Maps \u00B7 Kochi",
    tier: "D",
    medium: "Digital",
    lang: "EN",
    gravity: 3.4,
    reach: "~120 / month",
    readRating: 1,
    frequency: "Continuous",
    sentiment30d: randSparkline("neg"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-022",
    name: "JustDial Reviews \u00B7 Kalyan",
    where: "JustDial \u00B7 Multi-city",
    tier: "D",
    medium: "Digital",
    lang: "EN",
    gravity: 3.1,
    reach: "~80 / month",
    readRating: 1,
    frequency: "Continuous",
    sentiment30d: randSparkline("neu"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-023",
    name: "BIS Circulars",
    where: "Government \u00B7 New Delhi",
    tier: "D",
    medium: "Print",
    lang: "EN",
    gravity: 4.8,
    reach: "N/A",
    readRating: 3,
    frequency: "Irregular",
    sentiment30d: randSparkline("neu"),
    isEditoriallyFlagged: false,
  },
  {
    id: "src-024",
    name: "MCA Filings \u00B7 KJL",
    where: "Government \u00B7 New Delhi",
    tier: "D",
    medium: "Digital",
    lang: "EN",
    gravity: 4.5,
    reach: "N/A",
    readRating: 3,
    frequency: "Quarterly",
    sentiment30d: randSparkline("neu"),
    isEditoriallyFlagged: false,
  },
];

/* ── Source profile (focus pane) ── */

export interface SourceProfile {
  id: string;
  name: string;
  tier: "A" | "B" | "C" | "D";
  medium: string;
  lang: string;
  established: string;
  basedIn: string;
  subscribers: string;
  medianViews: string;
  cadence: string;
  gravity: number;
  historicalAccuracy: number;
  audienceTrust: string;
  sentimentToBrand: string;
  editorNote: { body: string; by: string };
  recentAppearances: {
    title: string;
    date: string;
    sentiment: "pos" | "neu" | "neg";
  }[];
}

export const sourceProfiles: Record<string, SourceProfile> = {
  "src-001": {
    id: "src-001",
    name: "Manorama News",
    tier: "A",
    medium: "Print + broadcast + digital",
    lang: "Malayalam",
    established: "1888",
    basedIn: "Kottayam, Kerala",
    subscribers: "4.8M daily readers, 2.1M digital",
    medianViews: "820K / article (digital)",
    cadence: "Daily print, continuous digital",
    gravity: 9.4,
    historicalAccuracy: 0.94,
    audienceTrust: "Institutional \u2014 highest-trust Malayalam outlet across SEC A\u2013C",
    sentimentToBrand: "Neutral-to-watchful. Historically fair coverage, but the newsroom has run two investigative series on jewellery-sector compliance in the past 18 months.",
    editorNote: {
      body: "Manorama remains the single most consequential source in the Kerala media ecosystem. When Manorama covers a story, it crosses into broadcast within 4 hours and into English national press within 12. Any hallmarking-adjacent story that appears here should be treated as Severity 3 regardless of initial framing.",
      by: "Insyt editorial desk \u00B7 15 Apr 2026",
    },
    recentAppearances: [
      {
        title: "Kerala gold retailers face renewed BIS scrutiny ahead of Akshaya Tritiya",
        date: "22 Apr 2026",
        sentiment: "neg",
      },
      {
        title: "Kalyan Jewellers Thrissur showroom expansion draws mixed local response",
        date: "18 Apr 2026",
        sentiment: "neu",
      },
      {
        title: "Gold prices steady as wedding season demand holds firm in southern markets",
        date: "14 Apr 2026",
        sentiment: "pos",
      },
      {
        title: "Consumer forum complaint against unnamed Kochi jeweller gains traction",
        date: "9 Apr 2026",
        sentiment: "neg",
      },
    ],
  },
  "src-014": {
    id: "src-014",
    name: "Reshma Pillai",
    tier: "C",
    medium: "YouTube (independent)",
    lang: "Malayalam",
    established: "2021",
    basedIn: "Kochi, Kerala",
    subscribers: "1.24M YouTube subscribers",
    medianViews: "412K / video",
    cadence: "2\u20133 videos per week, irregular posting schedule",
    gravity: 7.2,
    historicalAccuracy: 0.71,
    audienceTrust: "High engagement, adversarial framing \u2014 audience skews younger (18\u201334), urban Kerala",
    sentimentToBrand: "Consistently critical. Four of her last six Kalyan-mentioning videos carried negative framing. She positions as a consumer-rights advocate.",
    editorNote: {
      body: "Pillai is the single highest-risk independent voice in the Kerala media landscape for Kalyan. Her hallmarking segment on 24 April crossed 412K views in under 6 hours and is the origin point of the current narrative spike. Her content has a documented pattern of crossing into print (Manorama, Mathrubhumi) within 12\u201318 hours. Do not engage directly \u2014 this amplifies. Monitor for print crossover and prepare holding statements.",
      by: "Insyt editorial desk \u00B7 25 Apr 2026",
    },
    recentAppearances: [
      {
        title: "Is your gold really hallmarked? What Kerala jewellers don\u2019t tell you",
        date: "24 Apr 2026",
        sentiment: "neg",
      },
      {
        title: "Wedding gold shopping guide \u2014 what to check before you buy",
        date: "19 Apr 2026",
        sentiment: "neu",
      },
      {
        title: "Why I stopped trusting big jewellery brands (and what I do now)",
        date: "12 Apr 2026",
        sentiment: "neg",
      },
      {
        title: "Akshaya Tritiya 2026 \u2014 best deals or best traps?",
        date: "6 Apr 2026",
        sentiment: "neg",
      },
      {
        title: "Gold price manipulation? A consumer\u2019s perspective",
        date: "28 Mar 2026",
        sentiment: "neg",
      },
    ],
  },
};

/* ── Saved views ── */

export interface SavedView {
  id: string;
  name: string;
  count: number;
}

export const savedViews: SavedView[] = [
  { id: "sv-1", name: "The hallmarking watch", count: 47 },
  { id: "sv-2", name: "Kerala regional", count: 312 },
  { id: "sv-3", name: "Competitor comms", count: 86 },
];

/* ── Tier metadata ── */

export const tierMeta: Record<string, { label: string; description: string }> = {
  A: {
    label: "Tier A",
    description: "institutionally trusted, regional and national",
  },
  B: {
    label: "Tier B",
    description: "influential, specialist or strong regional",
  },
  C: {
    label: "Tier C",
    description: "vocal, narrower reach, high engagement",
  },
  D: {
    label: "Tier D",
    description: "low-gravity, watch-only, niche signals",
  },
};
