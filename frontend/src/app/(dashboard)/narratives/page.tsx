"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAPI, type Narrative } from "@/lib/api";

function statusColor(status: string | null) {
  switch (status) {
    case "active": return "bg-ochre/10 text-ochre border-ochre/30";
    case "declining": return "bg-stone/10 text-stone border-stone/30";
    case "resolved": return "bg-parchment text-slate border-border";
    default: return "bg-parchment text-slate border-border";
  }
}

function sentimentIndicator(trajectory: number[] | null) {
  if (!trajectory || trajectory.length === 0) return null;
  const avg = trajectory.reduce((a, b) => a + b, 0) / trajectory.length;
  if (avg > 0.2) return <span className="text-green-700">Positive</span>;
  if (avg < -0.2) return <span className="text-ochre">Negative</span>;
  return <span className="text-stone">Mixed</span>;
}

export default function NarrativesPage() {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ narratives: Narrative[] }>("/api/narratives/")
      .then((data) => setNarratives(data.narratives))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-parchment min-h-full">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">
          The Kalyan narrative, Q1 FY26
        </h1>
        <p className="text-base text-slate mt-2">
          {narratives.length > 0
            ? `${narratives.length} active narrative threads across the last 90 days.`
            : "Narrative clustering in progress."}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : narratives.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-stone">
              No narratives generated yet. Run the analysis pipeline to cluster mentions into narrative threads.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {narratives.map((n) => (
            <Card key={n.id} className="bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="font-display text-xl text-ink">
                    {n.title || "Untitled narrative"}
                  </CardTitle>
                  <Badge className={statusColor(n.status)}>
                    {n.status || "unknown"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate leading-relaxed">
                  {n.description || "No description available."}
                </p>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <span className="text-meta text-stone">
                    {n.mention_count} mentions
                  </span>
                  {n.velocity_score != null && (
                    <span className="text-meta text-stone">
                      Velocity: {n.velocity_score.toFixed(1)}/day
                    </span>
                  )}
                  {n.first_seen_at && n.last_seen_at && (
                    <span className="text-meta text-stone">
                      {new Date(n.first_seen_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      {" → "}
                      {new Date(n.last_seen_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
