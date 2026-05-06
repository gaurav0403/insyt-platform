// ─── Crisis Reconstruction mock data ───
// Tanishq hallmarking case study — March 2023 replay

export interface CaseEvent {
  hour: number;
  label: string;
  kind: "signal" | "detection" | "draft" | "external";
}

export interface SignalItem {
  id: string;
  source: string;
  tier: string;
  summary: string;
  time: string;
  language: string;
}

export interface CaseSnapshot {
  signals: {
    rawCount: number;
    retained: number;
    material: number;
    items: SignalItem[];
  };
  detection: {
    severity: number;
    confidence: number;
    interpretation: string;
    stage: "monitoring" | "escalation" | "critical";
  };
  draft: {
    draftedAt: string | null;
    audience: string | null;
    title: string | null;
    deck: string | null;
    body: string[];
    reviewStatus: "none" | "pending" | "reviewed" | "approved";
  };
}

export interface CaseData {
  id: string;
  title: string;
  deck: string;
  range: { start: string; end: string };
  events: CaseEvent[];
  verdict: string;
}

export const caseData: CaseData = {
  id: "case-14",
  title: "The Tanishq hallmarking moment, replayed day by day.",
  deck: "In March 2023, a single regional-press article moved from a Kerala daily to the national front pages over 38 hours. Tanishq\u2019s response came at hour 41. We replay the four days, signal by signal, and ask: what would Insyt have detected, when, and what would it have drafted?",
  range: {
    start: "2023-03-14T00:00:00+05:30",
    end: "2023-03-18T00:00:00+05:30",
  },
  events: [
    { hour: 4, label: "Mathrubhumi publishes", kind: "signal" },
    { hour: 12, label: "INSYT 1st ALERT", kind: "detection" },
    { hour: 26, label: "Mint picks up", kind: "signal" },
    { hour: 38, label: "NOW playhead", kind: "external" },
    { hour: 41, label: "Actual response (hr 41)", kind: "external" },
    { hour: 62, label: "Follow-up coverage", kind: "signal" },
  ],
  verdict:
    "If Tanishq had been on Insyt \u2014 the story would have moved twenty-nine hours earlier, in the language that mattered.",
};

export const caseSnapshots: Record<number, CaseSnapshot> = {
  0: {
    signals: {
      rawCount: 0,
      retained: 0,
      material: 0,
      items: [],
    },
    detection: {
      severity: 1,
      confidence: 0,
      interpretation:
        "No relevant signals detected. Standard background monitoring across 47 sources is active. No hallmarking-related discussion in any tracked channel.",
      stage: "monitoring",
    },
    draft: {
      draftedAt: null,
      audience: null,
      title: null,
      deck: null,
      body: [],
      reviewStatus: "none",
    },
  },

  12: {
    signals: {
      rawCount: 184,
      retained: 42,
      material: 6,
      items: [
        {
          id: "s-12-1",
          source: "Mathrubhumi",
          tier: "A",
          summary:
            "Front-page article questioning BIS hallmarking compliance among Kerala jewellers. Names Tanishq, Kalyan, and Joyalukkas. Sources two consumer complaints and a BIS inspection report.",
          time: "04:00 IST",
          language: "Malayalam",
        },
        {
          id: "s-12-2",
          source: "Kerala Kaumudi",
          tier: "B",
          summary:
            "Follow-up editorial citing the Mathrubhumi piece. Takes a stronger consumer-protection angle.",
          time: "07:30 IST",
          language: "Malayalam",
        },
        {
          id: "s-12-3",
          source: "YouTube \u00B7 Reshma Pillai",
          tier: "C",
          summary:
            "12-minute Malayalam segment discussing BIS hallmarking gaps. Already at 84,000 views and climbing rapidly.",
          time: "09:15 IST",
          language: "Malayalam",
        },
        {
          id: "s-12-4",
          source: "Reddit \u00B7 r/Kerala",
          tier: "D",
          summary:
            "Thread with 340 upvotes discussing the Mathrubhumi article. Sentiment heavily adversarial.",
          time: "10:00 IST",
          language: "English",
        },
        {
          id: "s-12-5",
          source: "Twitter/X",
          tier: "D",
          summary:
            "47 tweets referencing the article, mostly Malayalam-language. Three accounts with >100K followers have engaged.",
          time: "10:30 IST",
          language: "Malayalam",
        },
        {
          id: "s-12-6",
          source: "Manorama Online",
          tier: "A",
          summary:
            "Brief mention in morning news digest, links back to the Mathrubhumi investigation without adding new reporting.",
          time: "11:00 IST",
          language: "Malayalam",
        },
      ],
    },
    detection: {
      severity: 2,
      confidence: 0.64,
      interpretation:
        "Regional signal cluster detected. A credible Malayalam-language source has published an investigative piece touching BIS hallmarking and naming multiple jewellers including the monitored entity. Social amplification pattern is consistent with 12\u201318 hour crossover into English press. Recommend monitoring escalation.",
      stage: "monitoring",
    },
    draft: {
      draftedAt: "12:00 IST",
      audience: "Regional comms \u00B7 Malayalam",
      title: "Holding statement: BIS hallmarking compliance",
      deck: "For use by regional communications team if press inquiries arrive before formal response is prepared.",
      body: [
        "Tanishq maintains full compliance with BIS hallmarking standards across all product lines sold in India. Every piece of gold jewellery sold through Tanishq retail outlets and authorised online channels carries a valid BIS hallmark.",
        "We welcome regulatory scrutiny as an opportunity to demonstrate the rigour of our quality assurance processes. Tanishq has invested significantly in hallmarking infrastructure, including in-house assaying centres at our manufacturing facilities.",
        "We are reviewing the specific claims made in the Mathrubhumi report and will respond with a detailed factual clarification within 24 hours.",
      ],
      reviewStatus: "pending",
    },
  },

  24: {
    signals: {
      rawCount: 812,
      retained: 186,
      material: 24,
      items: [
        {
          id: "s-24-1",
          source: "Mathrubhumi",
          tier: "A",
          summary:
            "Follow-up piece with consumer interviews. Second day of front-page coverage. Adds two new consumer testimonials.",
          time: "04:00 IST \u00B7 Day 2",
          language: "Malayalam",
        },
        {
          id: "s-24-2",
          source: "Asianet News",
          tier: "A",
          summary:
            "Television segment covering the hallmarking story. 8-minute panel discussion with a BIS official.",
          time: "08:00 IST \u00B7 Day 2",
          language: "Malayalam",
        },
        {
          id: "s-24-3",
          source: "YouTube \u00B7 Reshma Pillai",
          tier: "C",
          summary:
            "Original segment now at 412,000 views. Second video posted, responding to jeweller silence. 184,000 views in 3 hours.",
          time: "10:00 IST \u00B7 Day 2",
          language: "Malayalam",
        },
        {
          id: "s-24-4",
          source: "Business Standard",
          tier: "A",
          summary:
            "First English-language wire pickup. Brief mention in market-watch column. Attributes story to Malayalam press.",
          time: "14:00 IST \u00B7 Day 2",
          language: "English",
        },
        {
          id: "s-24-5",
          source: "Twitter/X",
          tier: "D",
          summary:
            "English-language tweets now outnumber Malayalam. Trending locally in Kerala and Chennai.",
          time: "18:00 IST \u00B7 Day 2",
          language: "English",
        },
      ],
    },
    detection: {
      severity: 3,
      confidence: 0.82,
      interpretation:
        "Crossover confirmed. The story has moved from Malayalam-only to English-language business press. Social amplification has crossed the adversarial threshold. Television coverage in Kerala adds a broadcast vector. The propagation pattern now matches historical precedents for multi-day national coverage events. Escalation recommended.",
      stage: "escalation",
    },
    draft: {
      draftedAt: "14:30 IST \u00B7 Day 2",
      audience: "National press \u00B7 English",
      title: "Formal statement: Tanishq hallmarking compliance and consumer assurance",
      deck: "For proactive distribution to national business press desks and wire services.",
      body: [
        "Tanishq, a division of Titan Company Limited, reaffirms its complete and verifiable compliance with the Bureau of Indian Standards (BIS) hallmarking mandate, effective across every product line, retail outlet, and authorised sales channel.",
        "In the 12 months ending February 2023, 100% of gold jewellery manufactured at Tanishq facilities has been hallmarked through BIS-recognised assaying and hallmarking centres. This is verified through our end-to-end digital traceability system, which tracks every piece from manufacturing to point of sale.",
        "We have reviewed the specific claims referenced in recent regional press coverage and can confirm that the items cited were hallmarked in accordance with BIS standards at the time of sale. We are sharing detailed documentation with the Bureau directly.",
        "Tanishq invites any consumer with concerns about the hallmarking status of their purchase to visit any Tanishq store for a complimentary verification. We believe transparency is the foundation of trust in the jewellery industry.",
      ],
      reviewStatus: "reviewed",
    },
  },

  38: {
    signals: {
      rawCount: 2640,
      retained: 482,
      material: 68,
      items: [
        {
          id: "s-38-1",
          source: "Mint",
          tier: "A",
          summary:
            "Full investigative piece with industry-wide hallmarking data. Names Tanishq prominently. Picks up the Kerala story and expands scope nationally.",
          time: "02:00 IST \u00B7 Day 2 night",
          language: "English",
        },
        {
          id: "s-38-2",
          source: "Economic Times",
          tier: "A",
          summary:
            "Market analysis of Titan Company stock in context of hallmarking story. Mentions potential consumer sentiment impact.",
          time: "07:00 IST \u00B7 Day 3",
          language: "English",
        },
        {
          id: "s-38-3",
          source: "NDTV Profit",
          tier: "A",
          summary:
            "Television panel on jewellery industry standards. Tanishq spokesperson was invited but declined.",
          time: "10:00 IST \u00B7 Day 3",
          language: "English",
        },
        {
          id: "s-38-4",
          source: "Twitter/X",
          tier: "D",
          summary:
            "National trending. 1,200+ tweets per hour. Consumer advocacy accounts amplifying the story. Several verified journalists engaging.",
          time: "12:00 IST \u00B7 Day 3",
          language: "English",
        },
        {
          id: "s-38-5",
          source: "BSE Filing Watch",
          tier: "A",
          summary:
            "Titan Company stock down 2.1% in early trade. Analysts attributing part of the decline to the hallmarking narrative.",
          time: "10:30 IST \u00B7 Day 3",
          language: "English",
        },
      ],
    },
    detection: {
      severity: 4,
      confidence: 0.94,
      interpretation:
        "National front-page crisis. The story has completed its crossover from regional Malayalam press to national English-language business and broadcast media. Stock-price impact is now measurable. The silence from Tanishq has itself become part of the narrative. Every hour of further delay increases the reputational cost and reduces the effectiveness of any eventual response. Immediate executive-level response is critical.",
      stage: "critical",
    },
    draft: {
      draftedAt: "08:00 IST \u00B7 Day 3",
      audience: "Executive \u00B7 All media \u00B7 BSE disclosure",
      title: "CEO statement: Our commitment to hallmarking and consumer trust",
      deck: "For immediate release across all channels. Paired with BSE voluntary disclosure and social media distribution.",
      body: [
        "As the Managing Director of Titan Company\u2019s Jewellery Division, I want to address the questions raised this week about hallmarking compliance in the jewellery industry, and specifically about Tanishq.",
        "Let me be direct: every piece of gold jewellery sold by Tanishq is hallmarked. This is not a policy aspiration \u2014 it is a verifiable, auditable fact. We are today publishing our complete hallmarking audit data for the past 24 months on our corporate website.",
        "We should have said this two days ago, when the first reports appeared in the Kerala press. We did not, and I take responsibility for that delay. In the jewellery industry, trust is not a quarterly metric \u2014 it is the entire product. When questions arise about trust, the only appropriate response is immediate, complete transparency.",
        "I am personally inviting the Bureau of Indian Standards to conduct an unannounced audit of any Tanishq facility, at any time, and we will publish the results in full.",
        "To every Tanishq customer: if you have any doubt about the hallmarking status of jewellery you have purchased from us, please visit any store. We will verify it in your presence, at no cost, with no questions asked.",
      ],
      reviewStatus: "approved",
    },
  },

  48: {
    signals: {
      rawCount: 3420,
      retained: 624,
      material: 84,
      items: [
        {
          id: "s-48-1",
          source: "Times of India",
          tier: "A",
          summary:
            "Front-page coverage of Tanishq\u2019s actual response (issued at hour 41). Characterised as \u2018belated but comprehensive.\u2019",
          time: "06:00 IST \u00B7 Day 3",
          language: "English",
        },
        {
          id: "s-48-2",
          source: "Moneycontrol",
          tier: "A",
          summary:
            "Analysis piece: \u2018What the hallmarking episode tells us about jewellery brand crisis management.\u2019 Mostly neutral in tone.",
          time: "10:00 IST \u00B7 Day 3",
          language: "English",
        },
        {
          id: "s-48-3",
          source: "Twitter/X",
          tier: "D",
          summary:
            "Tweet volume declining from peak but still elevated. Sentiment shifting from adversarial to divided after the response.",
          time: "14:00 IST \u00B7 Day 3",
          language: "English",
        },
        {
          id: "s-48-4",
          source: "Mathrubhumi",
          tier: "A",
          summary:
            "Third article in the series. Acknowledges the Tanishq response but notes the 41-hour delay.",
          time: "04:00 IST \u00B7 Day 3",
          language: "Malayalam",
        },
      ],
    },
    detection: {
      severity: 4,
      confidence: 0.91,
      interpretation:
        "Post-response assessment. Tanishq\u2019s statement has partially arrested the narrative but the delay itself has become a secondary story. Media analysis is now focused on the crisis-management gap rather than the hallmarking substance. Stock has recovered 0.8% of the 2.1% decline. Continued monitoring recommended; severity remains elevated due to narrative momentum.",
      stage: "critical",
    },
    draft: {
      draftedAt: "16:00 IST \u00B7 Day 3",
      audience: "Internal \u00B7 Board briefing",
      title: "Board note: Hallmarking narrative \u2014 48-hour assessment",
      deck: "Confidential briefing for the Titan Company board on the reputational event and response effectiveness.",
      body: [
        "The hallmarking story has moved through three phases in 48 hours: regional investigation (hours 0\u201312), national crossover (hours 12\u201338), and post-response assessment (hours 38\u201348).",
        "Our response was issued at hour 41. Analysis of media and social sentiment suggests that a response at hour 12\u201315 would have contained the story at the regional level, avoiding the national crossover entirely.",
        "The cost of the 29-hour delay: an estimated 2,400 additional adversarial mentions, 2.1% stock decline (partially recovered), and a secondary narrative about crisis-management capability that will persist longer than the hallmarking substance.",
        "Recommendation: invest in a real-time signal-monitoring capability that can detect regional-language stories and draft holding responses within a 4-hour window.",
      ],
      reviewStatus: "approved",
    },
  },

  72: {
    signals: {
      rawCount: 4180,
      retained: 812,
      material: 102,
      items: [
        {
          id: "s-72-1",
          source: "Business Today",
          tier: "A",
          summary:
            "Long-form analysis: \u2018The 41-hour gap: lessons from Tanishq\u2019s hallmarking moment.\u2019 Positions the episode as an industry case study.",
          time: "08:00 IST \u00B7 Day 4",
          language: "English",
        },
        {
          id: "s-72-2",
          source: "CNBC-TV18",
          tier: "A",
          summary:
            "Analyst call with Titan Company management. CFO addresses the hallmarking question. Stock stabilising.",
          time: "14:00 IST \u00B7 Day 4",
          language: "English",
        },
        {
          id: "s-72-3",
          source: "YouTube \u00B7 Reshma Pillai",
          tier: "C",
          summary:
            "Third video acknowledging Tanishq\u2019s response. Tone shifts from adversarial to cautiously positive. Combined views across three videos: 1.4M.",
          time: "18:00 IST \u00B7 Day 4",
          language: "Malayalam",
        },
      ],
    },
    detection: {
      severity: 3,
      confidence: 0.86,
      interpretation:
        "Narrative deceleration. The story is transitioning from active crisis to retrospective analysis. New mentions are predominantly analytical rather than adversarial. The original regional sources are acknowledging the response. Stock impact has been largely absorbed. Severity downgraded from critical to escalation. Continued monitoring for 48 hours recommended.",
      stage: "escalation",
    },
    draft: {
      draftedAt: "09:00 IST \u00B7 Day 4",
      audience: "CMO \u00B7 Strategy memo",
      title: "Strategic memo: Turning the hallmarking moment into a trust asset",
      deck: "Proactive recommendations for converting the crisis into a long-term brand-trust initiative.",
      body: [
        "The hallmarking episode, while costly in the short term, has created an opening for Tanishq to establish industry leadership on transparency and consumer trust.",
        "Recommended actions: (1) publish quarterly hallmarking compliance reports, making Tanishq the first jeweller to do so voluntarily; (2) launch an in-store hallmark verification service as a permanent consumer offering; (3) partner with BIS on a consumer-education initiative around hallmarking standards.",
        "These actions convert a defensive moment into a differentiation strategy. If executed within 30 days, the hallmarking narrative becomes a Tanishq trust narrative.",
      ],
      reviewStatus: "reviewed",
    },
  },

  96: {
    signals: {
      rawCount: 4820,
      retained: 924,
      material: 118,
      items: [
        {
          id: "s-96-1",
          source: "LiveMint",
          tier: "A",
          summary:
            "Industry roundup: hallmarking compliance rates across major jewellers. Tanishq positioned favourably after disclosure.",
          time: "06:00 IST \u00B7 Day 5",
          language: "English",
        },
        {
          id: "s-96-2",
          source: "Mathrubhumi",
          tier: "A",
          summary:
            "Final article in the series. Balanced assessment. Credits Tanishq\u2019s response while noting the delay.",
          time: "04:00 IST \u00B7 Day 5",
          language: "Malayalam",
        },
      ],
    },
    detection: {
      severity: 2,
      confidence: 0.78,
      interpretation:
        "Story winding down. Active coverage has effectively ceased. Residual mentions are retrospective and analytical. No new adversarial vectors detected. Sentiment has returned to baseline. The episode will persist as a reference point in industry coverage for approximately 6\u201312 months. Downgraded to standard monitoring.",
      stage: "monitoring",
    },
    draft: {
      draftedAt: "10:00 IST \u00B7 Day 5",
      audience: "Comms team \u00B7 After-action",
      title: "After-action report: The hallmarking moment, four days later",
      deck: "Complete timeline, signal analysis, response assessment, and structural recommendations.",
      body: [
        "Over 96 hours, a single Malayalam-language newspaper article generated 4,820 raw signals, of which 924 were retained and 118 classified as material. The story crossed from regional to national in 26 hours and reached stock-price impact by hour 38.",
        "Tanishq\u2019s response at hour 41 was substantively strong but tactically late. The 29-hour gap between Insyt\u2019s simulated first alert (hour 12) and the actual response (hour 41) represents the cost of not having a real-time, language-agnostic monitoring capability.",
        "The structural takeaway is clear: in a media environment where regional-language stories can reach national English-language front pages in under 24 hours, the window for effective crisis response is measured in single-digit hours, not days.",
      ],
      reviewStatus: "approved",
    },
  },
};
