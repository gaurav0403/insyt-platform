"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/insyt/page-header";
import { SectionEyebrow } from "@/components/insyt/section-eyebrow";
import { fetchAPI, type PatternIntelligence } from "@/lib/api";

const RatingChart = dynamic(() => import("@/components/insyt/rating-chart"), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-surface-2 animate-pulse" />,
});

interface StoreData {
  store_name: string;
  city: string;
  state: string;
  brand: string;
  review_count: number;
  avg_rating: number | null;
  avg_sentiment: number | null;
  low_ratings: number;
  high_ratings: number;
  actionable: number;
}

interface StoreSummary {
  total_reviews: number;
  total_stores: number;
  total_cities: number;
  avg_rating: number | null;
  low_ratings: number;
  five_star: number;
  avg_sentiment: number | null;
  by_city: { city: string; state: string; reviews: number; avg_rating: number | null; complaints: number }[];
}

interface StoreReview {
  id: string;
  title: string | null;
  content: string | null;
  author: string | null;
  published_at: string | null;
  source_url: string | null;
  rating: number | null;
  city: string | null;
  state: string | null;
  sentiment: number | null;
  severity: number | null;
  why_it_matters: string | null;
}

/* ── Visual Components ── */

function RatingBar({ rating, maxWidth = 100 }: { rating: number | null; maxWidth?: number }) {
  const r = rating ?? 0;
  const pct = (r / 5) * 100;
  const color = r >= 4 ? "bg-positive" : r >= 3 ? "bg-caution" : "bg-vermilion-3";
  return (
    <div className="flex items-center gap-2">
      <div className="w-[80px] h-2 bg-surface-3 relative">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`font-mono text-[14px] font-medium ${r < 3.5 ? "text-vermilion-3" : r >= 4 ? "text-positive" : "text-text-2"}`}>
        {r.toFixed(1)}
      </span>
    </div>
  );
}

function SentimentDot({ value }: { value: number | null }) {
  const v = value ?? 0;
  const size = Math.max(8, Math.min(24, Math.abs(v) * 24 + 8));
  const color = v < -0.2 ? "bg-vermilion-3" : v > 0.2 ? "bg-positive" : "bg-text-3";
  return <span className={`inline-block rounded-full ${color}`} style={{ width: size, height: size }} />;
}

function CityHeatCard({
  city,
  reviews,
  rating,
  complaints,
  active,
  onClick,
}: {
  city: string;
  reviews: number;
  rating: number | null;
  complaints: number;
  active: boolean;
  onClick: () => void;
}) {
  const r = rating ?? 0;
  const bg = r >= 4.5 ? "bg-positive/15" : r >= 4 ? "bg-positive/8" : r >= 3.5 ? "bg-surface-2" : r >= 3 ? "bg-caution/10" : "bg-vermilion/10";
  return (
    <button
      onClick={onClick}
      className={`p-3 border text-left transition-all ${
        active ? "border-vermilion-3" : "border-surface-edge hover:border-text-4"
      } ${bg}`}
    >
      <div className="t-label text-text-3 mb-1">{city}</div>
      <div className="flex items-center gap-2">
        <span className={`font-serif text-[20px] font-medium ${r < 3.5 ? "text-vermilion-3" : r >= 4 ? "text-positive" : "text-text"}`}>
          {r.toFixed(1)}
        </span>
        <span className="text-text-4 text-[10px]">★</span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="t-label text-text-4">{reviews} reviews</span>
        {complaints > 0 && (
          <span className="t-label text-vermilion-3">{complaints}</span>
        )}
      </div>
    </button>
  );
}

function StoreRow({
  store,
  active,
  onClick,
}: {
  store: StoreData;
  active: boolean;
  onClick: () => void;
}) {
  const shortName = store.store_name.replace("Kalyan Jewellers - ", "");
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(store.store_name + " " + store.city)}`;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left py-3 px-3 border-b border-surface-edge ${
        active ? "bg-surface-2 border-l-2 border-l-vermilion-3" : "hover:bg-surface-2"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="t-small text-text font-medium truncate">{shortName}</div>
          <div className="t-label text-text-4 mt-0.5">{store.city}, {store.state}</div>
        </div>
        <RatingBar rating={store.avg_rating} />
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="t-label text-text-4">{store.review_count} reviews</span>
        <SentimentDot value={store.avg_sentiment} />
        {store.low_ratings > 0 && (
          <span className="t-label text-vermilion-3">{store.low_ratings} low</span>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="t-label text-text-4 hover:text-vermilion-3 ml-auto"
          onClick={(e) => e.stopPropagation()}
        >
          Maps {"\u2197"}
        </a>
      </div>
    </button>
  );
}

function ReviewCard({ review }: { review: StoreReview }) {
  const stars = review.rating ?? 0;
  const time = review.published_at
    ? new Date(review.published_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
    : "";
  const text = review.content?.split("\n\n").slice(1).join("\n") || review.content || "";
  const starColor = stars <= 2 ? "text-vermilion-3" : stars >= 4 ? "text-positive" : "text-caution";

  // Strip the #review-hash to get the maps search URL
  const mapsUrl = review.source_url?.split("#")[0] || null;

  return (
    <div className={`py-3 border-b border-surface-edge ${stars <= 2 ? "border-l-2 border-l-vermilion-3 pl-3" : ""}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {/* Visual stars */}
        <div className="flex gap-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`block w-3 h-3 ${i < stars ? (stars <= 2 ? "bg-vermilion-3" : stars >= 4 ? "bg-positive" : "bg-caution") : "bg-surface-3"}`}
            />
          ))}
        </div>
        <span className="t-label text-text-4">{review.author}</span>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="t-label text-text-4 hover:text-vermilion-3"
          >
            Maps {"\u2197"}
          </a>
        )}
        <span className="t-label text-text-4 ml-auto">{time}</span>
      </div>
      <p className="t-small text-text-2 leading-relaxed">{text.slice(0, 250)}</p>
      {review.why_it_matters && (
        <div className={`mt-2 py-1.5 px-2 border-l-2 ${
          stars <= 2
            ? "border-vermilion-3 bg-vermilion/5"
            : "border-surface-edge bg-surface-2"
        }`}>
          <span className="t-label text-text-4 mr-1">Insyt</span>
          <span className={`text-[12px] ${stars <= 2 ? "text-vermilion-3 font-medium" : "text-text-3 italic"}`}>
            {review.why_it_matters}
          </span>
        </div>
      )}
      {review.severity != null && review.severity >= 4 && (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="t-label text-vermilion-3">Urgency {review.severity}/5</span>
          <span className="t-label text-text-4">Requires response</span>
        </div>
      )}
    </div>
  );
}

export default function GroundIntelligencePage() {
  const [summary, setSummary] = useState<StoreSummary | null>(null);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [patternBrief, setPatternBrief] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const [sumData, storeData, patData] = await Promise.all([
          fetchAPI<StoreSummary>("/api/stores/summary"),
          fetchAPI<{ stores: StoreData[] }>("/api/stores/?sort=signals&limit=20"),
          fetch(`${base}/api/patterns/`, { cache: "no-store" })
            .then((r) => (r.ok ? (r.json() as Promise<PatternIntelligence>) : null))
            .catch(() => null),
        ]);
        if (patData?.brief) setPatternBrief(patData.brief);
        setSummary(sumData);
        setStores(storeData.stores);
        if (storeData.stores.length > 0) {
          setSelected(storeData.stores[0].store_name);
        }
      } catch (e) {
        console.error("Failed to load stores", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetchAPI<{ reviews: StoreReview[] }>(`/api/stores/${encodeURIComponent(selected)}/reviews?limit=15`)
      .then((data) => setReviews(data.reviews))
      .catch(console.error);
  }, [selected]);

  const selectedStore = stores.find((s) => s.store_name === selected);
  const filteredStores = selectedCity
    ? stores.filter((s) => s.city === selectedCity)
    : stores;

  // Compute rating distribution from reviews
  const ratingDist = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    if (r.rating && r.rating >= 1 && r.rating <= 5) ratingDist[r.rating - 1]++;
  });

  const mapsUrl = selectedStore
    ? `https://www.google.com/maps/search/${encodeURIComponent(selectedStore.store_name + " " + selectedStore.city)}`
    : "#";

  return (
    <div>
      <PageHeader
        title="Ground"
        highlight="intelligence"
        deck={(() => {
          if (!summary) return "Loading store data...";
          const critical = stores.filter((s) => s.low_ratings >= 3);
          const healthy = stores.filter((s) => s.avg_rating !== null && s.avg_rating >= 4.5);
          const worstCity = summary.by_city.sort((a, b) => (a.avg_rating ?? 5) - (b.avg_rating ?? 5))[0];
          const bestCity = summary.by_city.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))[0];
          return `${summary.total_reviews} reviews across ${summary.total_cities} cities in 90 days. ${critical.length} stores in critical condition, ${healthy.length} performing well. ${worstCity?.city ?? ""} (${worstCity?.avg_rating?.toFixed(1) ?? "?"}★) needs attention; ${bestCity?.city ?? ""} (${bestCity?.avg_rating?.toFixed(1) ?? "?"}★) leads.`;
        })()}
      />

      {/* Pattern brief */}
      {patternBrief && (
        <div className="bg-surface-2 border border-surface-edge p-5 mb-8">
          <SectionEyebrow className="mb-2">Pattern analysis</SectionEyebrow>
          <p className="font-serif text-[15px] text-text-2 leading-[1.6] max-w-[800px]">
            {patternBrief}
          </p>
        </div>
      )}

      {/* City heatmap grid */}
      {summary && (
        <div className="mb-8">
          <SectionEyebrow className="mb-3">
            City heatmap {"\u00B7"} rating by location {"\u00B7"} click to filter
          </SectionEyebrow>
          <div className="grid grid-cols-5 gap-2">
            {summary.by_city.map((c) => (
              <CityHeatCard
                key={c.city}
                city={c.city}
                reviews={c.reviews}
                rating={c.avg_rating}
                complaints={c.complaints}
                active={selectedCity === c.city}
                onClick={() => setSelectedCity(selectedCity === c.city ? null : c.city)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Overview stats */}
      {summary && (
        <div className="flex items-center gap-8 py-3 border-y border-surface-edge mb-8">
          <span className="t-label text-text-3">
            {summary.total_stores} stores {"\u00B7"} {summary.total_cities} cities
          </span>
          <span className="t-label text-text-2">
            {summary.total_reviews} reviews (90d)
          </span>
          <span className={`t-label ${(summary.avg_rating ?? 5) < 4 ? "text-vermilion-3" : "text-positive"}`}>
            Avg {summary.avg_rating?.toFixed(1)}★
          </span>
          {summary.low_ratings > 0 && (
            <span className="t-label text-vermilion-3">
              {summary.low_ratings} low-rated reviews
            </span>
          )}
          <span className="t-label text-text-4 ml-auto">
            Source: Google Maps Reviews via SearchAPI
          </span>
        </div>
      )}

      {/* Three-column layout */}
      <div className="grid grid-cols-[260px_1fr_320px] gap-8">
        {/* LEFT: Store list */}
        <div>
          <SectionEyebrow className="mb-3">
            {selectedCity ? `${selectedCity} stores` : "All stores"} {"\u00B7"} {filteredStores.length}
          </SectionEyebrow>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-surface-2 animate-pulse" />
              ))}
            </div>
          ) : (
            filteredStores.map((store) => (
              <StoreRow
                key={store.store_name}
                store={store}
                active={store.store_name === selected}
                onClick={() => setSelected(store.store_name)}
              />
            ))
          )}
        </div>

        {/* CENTER: Reviews */}
        <div>
          {selectedStore && (
            <>
              <div className="flex items-start justify-between border-t border-surface-edge pt-6 mb-6">
                <div>
                  <h2 className="t-title text-text">
                    {selectedStore.store_name.replace("Kalyan Jewellers - ", "")}
                    <span className="text-vermilion-3">.</span>
                  </h2>
                  <p className="t-lede italic text-text-2 mt-1">
                    {selectedStore.city}, {selectedStore.state}
                  </p>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="t-label text-text-3 hover:text-vermilion-3 border border-surface-edge px-3 py-1.5 shrink-0"
                >
                  Open in Maps {"\u2197"}
                </a>
              </div>

              {/* Rating distribution visual */}
              <div className="mb-6 p-4 bg-surface-2 border border-surface-edge">
                <SectionEyebrow className="mb-3">Rating distribution</SectionEyebrow>
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingDist[star - 1];
                    const maxCount = Math.max(...ratingDist, 1);
                    const pct = (count / maxCount) * 100;
                    const color = star >= 4 ? "bg-positive" : star === 3 ? "bg-caution" : "bg-vermilion-3";
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-text-3 w-4">{star}★</span>
                        <div className="flex-1 h-4 bg-surface-3 relative">
                          <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-[11px] text-text-3 w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <SectionEyebrow className="mb-3">
                Reviews {"\u00B7"} {reviews.length} recent
              </SectionEyebrow>
              {reviews.length > 0 ? (
                reviews.map((r) => <ReviewCard key={r.id} review={r} />)
              ) : (
                <p className="t-caption">Loading reviews...</p>
              )}
            </>
          )}
        </div>

        {/* RIGHT: Store metrics */}
        <div>
          {selectedStore && (
            <>
              <SectionEyebrow className="mb-3">
                Store health
              </SectionEyebrow>

              {/* Big rating */}
              <div className="border border-surface-edge p-5 mb-4 text-center">
                <div className={`font-serif text-[48px] font-medium ${(selectedStore.avg_rating ?? 5) < 3.5 ? "text-vermilion-3" : (selectedStore.avg_rating ?? 5) >= 4 ? "text-positive" : "text-caution"}`}>
                  {selectedStore.avg_rating?.toFixed(1) ?? "\u2014"}
                </div>
                <div className="flex justify-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`block w-4 h-4 ${
                        i < Math.round(selectedStore.avg_rating ?? 0)
                          ? (selectedStore.avg_rating ?? 5) < 3.5 ? "bg-vermilion-3" : "bg-positive"
                          : "bg-surface-3"
                      }`}
                    />
                  ))}
                </div>
                <div className="t-label text-text-4 mt-2">
                  {selectedStore.review_count} reviews
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-surface-edge">
                  <span className="t-label text-text-3">Sentiment</span>
                  <span className={`font-mono text-[14px] font-medium ${(selectedStore.avg_sentiment ?? 0) < -0.1 ? "text-vermilion-3" : "text-positive"}`}>
                    {selectedStore.avg_sentiment != null
                      ? (selectedStore.avg_sentiment > 0 ? "+" : "") + selectedStore.avg_sentiment.toFixed(2)
                      : "\u2014"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-edge">
                  <span className="t-label text-text-3">High rated (4-5★)</span>
                  <span className="font-mono text-[14px] font-medium text-positive">{selectedStore.high_ratings}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-edge">
                  <span className="t-label text-text-3">Low rated (1-2★)</span>
                  <span className="font-mono text-[14px] font-medium text-vermilion-3">{selectedStore.low_ratings}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-edge">
                  <span className="t-label text-text-3">Actionable</span>
                  <span className="font-mono text-[14px] font-medium text-vermilion-3">{selectedStore.actionable}</span>
                </div>
              </div>

              {/* City comparison */}
              {summary && (
                <div className="mt-6 border-t border-surface-edge pt-4">
                  <SectionEyebrow className="mb-3">All cities</SectionEyebrow>
                  {summary.by_city.map((c) => (
                    <div
                      key={c.city}
                      className={`flex items-center justify-between py-2 ${
                        c.city === selectedStore.city ? "bg-surface-2 -mx-1 px-1" : ""
                      }`}
                    >
                      <span className="t-small text-text">{c.city}</span>
                      <div className="flex items-center gap-2">
                        <RatingBar rating={c.avg_rating} />
                        {c.complaints > 0 && (
                          <span className="w-2 h-2 bg-vermilion-3 rounded-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
