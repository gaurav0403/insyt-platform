"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAPI } from "@/lib/api";

interface NarrativeItem {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  mention_count: number;
  velocity_score: number | null;
  sentiment_trajectory: number[] | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
}

interface EntityGroup {
  id: string;
  name: string;
  type: string;
  narratives: NarrativeItem[];
}

interface DrilldownMention {
  id: string;
  title: string | null;
  source_url: string | null;
  source_publication: string | null;
  published_at: string | null;
  raw_content: string | null;
  sentiment_score: number | null;
  themes: string[] | null;
}

interface NarrativeDetail {
  narrative: NarrativeItem & { entity_name: string | null; entity_type: string | null };
  mentions: DrilldownMention[];
}

function statusColor(status: string | null) {
  switch (status) {
    case "active": return "bg-ochre/10 text-ochre border-ochre/30";
    case "declining": return "bg-stone/10 text-stone border-stone/30";
    default: return "bg-parchment text-slate border-border";
  }
}

function sentimentDot(score: number | null) {
  if (score == null) return null;
  if (score > 0.2) return <span className="inline-block w-2 h-2 rounded-full bg-green-600" />;
  if (score < -0.2) return <span className="inline-block w-2 h-2 rounded-full bg-ochre" />;
  return <span className="inline-block w-2 h-2 rounded-full bg-stone" />;
}

export default function NarrativesPage() {
  const [entityGroups, setEntityGroups] = useState<EntityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNarrative, setSelectedNarrative] = useState<NarrativeDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  useEffect(() => {
    fetchAPI<{ entities: EntityGroup[] }>("/api/narratives/by-entity")
      .then((data) => setEntityGroups(data.entities))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function openDrilldown(narrativeId: string) {
    setDrilldownLoading(true);
    setSheetOpen(true);
    try {
      const data = await fetchAPI<NarrativeDetail>(`/api/narratives/${narrativeId}`);
      setSelectedNarrative(data);
    } catch {
      // silent
    } finally {
      setDrilldownLoading(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-parchment min-h-full">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">
          Narrative landscape
        </h1>
        <p className="text-base text-slate mt-2">
          {entityGroups.length > 0
            ? `${entityGroups.reduce((sum, e) => sum + e.narratives.length, 0)} narrative threads across ${entityGroups.length} entities.`
            : "Loading narrative clusters..."}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : entityGroups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-stone">No narratives generated yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={entityGroups[0]?.id}>
          <TabsList className="flex-wrap h-auto gap-1 bg-white/50">
            {entityGroups.map((entity) => (
              <TabsTrigger key={entity.id} value={entity.id} className="text-sm">
                {entity.name.length > 20 ? entity.name.slice(0, 18) + "..." : entity.name}
                <Badge variant="secondary" className="ml-1.5 text-label">
                  {entity.narratives.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {entityGroups.map((entity) => (
            <TabsContent key={entity.id} value={entity.id} className="mt-4">
              <div className="grid gap-3 md:grid-cols-2">
                {entity.narratives.map((n) => (
                  <Card
                    key={n.id}
                    className="bg-white cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openDrilldown(n.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="font-display text-base text-ink leading-snug">
                          {n.title || "Untitled"}
                        </CardTitle>
                        <Badge className={`shrink-0 ${statusColor(n.status)}`}>
                          {n.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate line-clamp-2 leading-relaxed">
                        {n.description}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-meta text-stone">
                          {n.mention_count} mentions
                        </span>
                        {n.velocity_score != null && n.velocity_score > 0 && (
                          <span className="text-meta text-stone">
                            {n.velocity_score.toFixed(1)}/day
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
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Drill-down sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {drilldownLoading ? (
            <div className="space-y-4 pt-8">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 mt-4" />
              ))}
            </div>
          ) : selectedNarrative ? (
            <div className="pt-4">
              <SheetHeader>
                <SheetTitle className="font-display text-2xl text-ink leading-snug">
                  {selectedNarrative.narrative.title}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-slate leading-relaxed">
                  {selectedNarrative.narrative.description}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className={statusColor(selectedNarrative.narrative.status)}>
                    {selectedNarrative.narrative.status}
                  </Badge>
                  <span className="text-meta text-stone">
                    {selectedNarrative.narrative.entity_name}
                  </span>
                  <span className="text-meta text-stone">
                    {selectedNarrative.narrative.mention_count} mentions
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <h3 className="text-label text-stone mb-3">
                  Linked mentions ({selectedNarrative.mentions.length})
                </h3>
                <div className="space-y-3">
                  {selectedNarrative.mentions.map((m) => (
                    <div key={m.id} className="border-b border-border pb-3 last:border-0">
                      <div className="flex items-start gap-2">
                        {sentimentDot(m.sentiment_score)}
                        <div className="flex-1 min-w-0">
                          {m.source_url ? (
                            <a
                              href={m.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-ink hover:text-ochre transition-colors"
                            >
                              {m.title || "Untitled"}
                            </a>
                          ) : (
                            <p className="text-sm font-medium text-ink">
                              {m.title || "Untitled"}
                            </p>
                          )}
                          {m.raw_content && (
                            <p className="text-xs text-slate mt-0.5 line-clamp-2">
                              {m.raw_content}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-meta text-stone">
                              {m.source_publication}
                            </span>
                            <span className="text-meta text-stone">
                              {m.published_at
                                ? new Date(m.published_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                                : ""}
                            </span>
                            {m.sentiment_score != null && (
                              <span className="text-meta text-stone">
                                {m.sentiment_score > 0 ? "+" : ""}{m.sentiment_score.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
