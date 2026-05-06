export interface CityData {
  id: string;
  name: string;
  state: string;
  stateCode: string;
  lat: number;
  lon: number;
  volume24h: number;
  sentiment: number;
  dominantTheme: string;
  severityDots: number;
}

export interface GroundSignal {
  text: string;
  source: string;
  location: string;
  time: string;
}

export const cities: CityData[] = [
  { id: "c1", name: "Thrissur \u00B7 Round North", state: "Kerala", stateCode: "KL", lat: 10.52, lon: 76.21, volume24h: 312, sentiment: -0.58, dominantTheme: "Hallmarking", severityDots: 3 },
  { id: "c2", name: "Coimbatore \u00B7 RS Puram", state: "Tamil Nadu", stateCode: "TN", lat: 11.0, lon: 76.96, volume24h: 184, sentiment: -0.34, dominantTheme: "Hallmarking", severityDots: 2 },
  { id: "c3", name: "Kochi \u00B7 MG Road", state: "Kerala", stateCode: "KL", lat: 9.97, lon: 76.28, volume24h: 156, sentiment: -0.28, dominantTheme: "Hallmarking", severityDots: 2 },
  { id: "c4", name: "Kozhikode \u00B7 Mittai Theruvu", state: "Kerala", stateCode: "KL", lat: 11.25, lon: 75.77, volume24h: 112, sentiment: -0.08, dominantTheme: "Hallmarking", severityDots: 1 },
  { id: "c5", name: "Chennai \u00B7 T. Nagar", state: "Tamil Nadu", stateCode: "TN", lat: 13.04, lon: 80.23, volume24h: 248, sentiment: 0.32, dominantTheme: "Akshaya Tritiya", severityDots: 0 },
  { id: "c6", name: "Bengaluru \u00B7 Jayanagar", state: "Karnataka", stateCode: "KA", lat: 12.93, lon: 77.58, volume24h: 86, sentiment: 0.18, dominantTheme: "Expansion", severityDots: 0 },
  { id: "c7", name: "Hyderabad \u00B7 Banjara Hills", state: "Telangana", stateCode: "TS", lat: 17.41, lon: 78.44, volume24h: 96, sentiment: 0.38, dominantTheme: "New store", severityDots: 0 },
  { id: "c8", name: "Mumbai \u00B7 Lokhandwala", state: "Maharashtra", stateCode: "MH", lat: 19.14, lon: 72.83, volume24h: 72, sentiment: 0.52, dominantTheme: "Brand positive", severityDots: 0 },
];

export const selectedCityDetail = {
  cityId: "c1",
  signalVolume: 312,
  signalDelta: "+218%",
  sentiment7d: -0.58,
  sentimentNote: "Was +0.12 fourteen days ago. Crossed zero on 21 Apr.",
  sourceMix: "62% local reviews",
  sourceMixDetail: "22% vernacular social \u00B7 11% press \u00B7 5% walk-in",
  distanceToStory: "12 km",
  distanceNote: "From the Thrissur audit floor referenced in the regional draft.",
  historicalBaseline: "+0.34 average",
  historicalNote: "A decade-long supportive baseline. This week\u2019s reading is two standard deviations below.",
  walkInScheduled: true,
  heroQuote: {
    text: "\u201CI asked the manager to show me the hallmark on my chain. He said it was \u2018inside the clasp\u2019. When I asked to see it, he called the supervisor. Twenty minutes later, no one had shown me anything.\u201D",
    source: "Google Review",
    location: "Kalyan Jewellers, Round North, Thrissur",
    time: "24 Apr \u00B7 14:22 IST",
  } as GroundSignal,
};
