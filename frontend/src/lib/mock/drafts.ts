export interface DraftData {
  id: string;
  storyTitle: string;
  storyDetail: string;
  voiceProfile: {
    name: string;
    sampleCount: number;
    traits: string;
  };
  comparableArcs: { name: string; status: string }[];
  sourcesCited: { name: string; ref: string; detail: string }[];
  actionType: string;
  eyebrow: string;
  title: string;
  deck: string;
  body: string[];
  audience: string;
  channel: string;
  language: string;
  toneSliders: { label: string; value: number }[];
  distributionTargets: { outlet: string; lang: string; when: string; selected: boolean }[];
}

export const mockDraft: DraftData = {
  id: "draft-1",
  storyTitle: "The hallmarking question reaches Kerala.",
  storyDetail: "Pillai segment, +318% mentions vs 7d, sentiment \u22120.62",
  voiceProfile: {
    name: "Kalyan Jewellers \u00B7 CEO comms",
    sampleCount: 24,
    traits: "Style absorbed from your published material. Sentence length, lexicon, signature phrases.",
  },
  comparableArcs: [
    { name: "Tanishq \u00B7 Mar 2023", status: "replayed" },
    { name: "Titan \u00B7 Jul 2024", status: "replayed" },
    { name: "Senco \u00B7 Feb 2025", status: "noted" },
  ],
  sourcesCited: [
    { name: "Pillai, R.", ref: "[1]", detail: "\u201CHallmark, halfmark, no mark\u201D \u00B7 YouTube \u00B7 24 Apr" },
    { name: "BIS Circular 2024-HM-87", ref: "[2]", detail: "14 Feb 2024 \u00B7 Bureau of Indian Standards" },
    { name: "Mathrubhumi feature column", ref: "[3]", detail: "09 Apr \u00B7 Kochi edition" },
  ],
  actionType: "Statement",
  eyebrow: "Statement \u00B7 25 Apr 2026 \u00B7 For attribution to T.S. Kalyanaraman",
  title: "On the practice of hallmarking \u2014 at Kalyan, since 2007.",
  deck: "A statement framed as continuity of practice, not response to controversy. Set for Kerala outlets ahead of the English-press cycle.",
  body: [
    "For nineteen years, every karat of gold sold under our name in Kerala has passed through a four-stage hallmarking audit, the last of which is conducted at our Thrissur facility \u2014 twelve kilometres from the showroom this story names.",
    "We welcome the conversation Ms. Pillai has begun. We invite her, and any reader of this paper who has questions, to visit the Thrissur audit floor \u2014 unannounced, with their own scales, on any working day. We have been opening this floor to journalists since 2014.",
    "Hallmarking is not a controversy. It is a practice. It is what separates our trade from a market. The BIS circular of February 2024 formalised what regional chains in Kerala \u2014 ours among the first \u2014 had been doing for a decade.",
  ],
  audience: "Regional",
  channel: "Press",
  language: "Malayalam",
  toneSliders: [
    { label: "Conciliatory \u2194 Firm", value: 0.34 },
    { label: "Defensive \u2194 Confident", value: 0.78 },
    { label: "Formal \u2194 Personal", value: 0.52 },
  ],
  distributionTargets: [
    { outlet: "Mathrubhumi", lang: "ML", when: "10:00 IST", selected: true },
    { outlet: "Manorama Online", lang: "ML", when: "10:00 IST", selected: true },
    { outlet: "The Hindu", lang: "EN", when: "12:00 IST", selected: false },
    { outlet: "Economic Times", lang: "EN", when: "12:00 IST", selected: false },
  ],
};

export const draftTypes = [
  { id: "ml-press", label: "Malayalam \u00B7 Press", active: true },
  { id: "en-national", label: "English \u00B7 National", active: false },
  { id: "internal", label: "Internal Brief", active: false },
  { id: "social-ceo", label: "Social \u00B7 CEO", active: false },
  { id: "more", label: "+ 2 more", active: false },
];
