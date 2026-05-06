export interface LanguageEntry {
  code: string;
  label: string;
  sourceCount: number;
}

export interface LocalizedPanel {
  lang: string;
  source: string;
  headlineNative: string;
  headlineTranslated: string;
  summaryEn: string;
  publishedAt: string;
  sourceType: string;
}

export interface PenetrationRow {
  lang: string;
  sourceCount: number;
  avgGravity: number;
  propagation: number;
  status: "active" | "emerging" | "absent";
}

export interface EditorNote {
  quote: string;
  editor: string;
  region: string;
}

export const languages: LanguageEntry[] = [
  { code: "EN", label: "English", sourceCount: 218 },
  { code: "ML", label: "Malayalam", sourceCount: 96 },
  { code: "TA", label: "Tamil", sourceCount: 112 },
  { code: "HI", label: "Hindi", sourceCount: 128 },
  { code: "BN", label: "Bangla", sourceCount: 64 },
  { code: "MR", label: "Marathi", sourceCount: 48 },
  { code: "TE", label: "Telugu", sourceCount: 72 },
  { code: "KN", label: "Kannada", sourceCount: 56 },
  { code: "GU", label: "Gujarati", sourceCount: 44 },
];

export const localizedPanels: LocalizedPanel[] = [
  {
    lang: "ml",
    source: "Reshma Pillai \u00B7 YouTube",
    headlineNative: "\u0D39\u0D3E\u0D7E\u0D2E\u0D3E\u0D30\u0D4D\u200D\u0D15\u0D4D\u0D15\u0D4D, \u0D39\u0D3E\u0D2B\u0D4D\u0D2E\u0D3E\u0D30\u0D4D\u200D\u0D15\u0D4D\u0D15\u0D4D, \u0D28\u0D4B \u0D2E\u0D3E\u0D30\u0D4D\u200D\u0D15\u0D4D\u0D15\u0D4D \u2014 \u0D15\u0D47\u0D30\u0D33\u0D24\u0D4D\u0D24\u0D3F\u0D32\u0D46 \u0D1C\u0D4D\u0D35\u0D32\u0D4D\u0D32\u0D31\u0D3F\u0D15\u0D33\u0D4D\u200D \u0D06\u0D30\u0D46 \u0D35\u0D3F\u0D36\u0D4D\u0D35\u0D38\u0D3F\u0D15\u0D4D\u0D15\u0D3E\u0D02?",
    headlineTranslated: "\"Hallmark, halfmark, no mark \u2014 whom can Kerala\u2019s jewellers be trusted to be?\"",
    summaryEn: "In these fourteen minutes, I share what I found visiting the major jewellery chains in Kochi, Thrissur, and Kozhikode.",
    publishedAt: "24 Apr \u00B7 18:42",
    sourceType: "ML \u00B7 Malayalam \u00B7 24 Apr",
  },
  {
    lang: "ta",
    source: "Daily Thanthi",
    headlineNative: "\u0BB9\u0BBE\u0BB2\u0BCD\u0BAE\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BBF\u0B99\u0BCD \u0B9A\u0BB0\u0BCD\u0B9A\u0BCD\u0B9A\u0BC8: \u0BA4\u0BAE\u0BBF\u0BB4\u0BCD\u0BA8\u0BBE\u0B9F\u0BCD\u0B9F\u0BBF\u0BB2\u0BCD \u0BA8\u0B95\u0BC8 \u0B95\u0B9F\u0BC8\u0B95\u0BB3\u0BCD",
    headlineTranslated: "\"Hallmarking debate: jewellery shops in Tamil Nadu under scrutiny\"",
    summaryEn: "Following the Kerala YouTube segment, Tamil Nadu\u2019s jewellery trade associations respond to consumer queries about hallmarking compliance.",
    publishedAt: "25 Apr \u00B7 06:12",
    sourceType: "TA \u00B7 Tamil \u00B7 25 Apr",
  },
];

export const penetrationData: PenetrationRow[] = [
  { lang: "Malayalam", sourceCount: 28, avgGravity: 8.2, propagation: 0.92, status: "active" },
  { lang: "English", sourceCount: 14, avgGravity: 7.8, propagation: 0.68, status: "active" },
  { lang: "Tamil", sourceCount: 5, avgGravity: 6.4, propagation: 0.34, status: "emerging" },
  { lang: "Hindi", sourceCount: 0, avgGravity: 0, propagation: 0, status: "absent" },
  { lang: "Telugu", sourceCount: 0, avgGravity: 0, propagation: 0, status: "absent" },
  { lang: "Kannada", sourceCount: 0, avgGravity: 0, propagation: 0, status: "absent" },
];

export const editorNotes: EditorNote[] = [
  {
    quote: "The phrase \"\u0D35\u0D3F\u0D36\u0D4D\u0D35\u0D3E\u0D38\u0D02, \u0D35\u0D3E\u0D17\u0D4D\u0D26\u0D3E\u0D28\u0D2E\u0D32\u0D4D\u0D32\" (\u201Ctrust is not a promise\u201D) is colloquially weighty in Malayalam \u2014 closer in register to a moral claim than the English captures. Worth defending against in a regional response.",
    editor: "V. Menon",
    region: "ML Editor",
  },
];

export const regionalStats = {
  sourcesRead: 74,
  vernacular: 28,
  notInEnglish: true,
  requireEditor: 3,
  sentiment: -0.62,
};
