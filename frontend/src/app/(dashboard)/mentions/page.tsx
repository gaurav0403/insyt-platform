"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAPI, type Mention } from "@/lib/api";

export default function MentionsPage() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ mentions: Mention[] }>("/api/mentions/?limit=50")
      .then((data) => setMentions(data.mentions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">
          Mention feed
        </h1>
        <p className="text-base text-slate mt-2">
          All ingested mentions across sources, newest first.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {mentions.map((m) => (
            <Card key={m.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-ink">
                      {m.title || "Untitled"}
                    </h3>
                    {m.raw_content && (
                      <p className="text-sm text-slate mt-1 line-clamp-2 leading-relaxed">
                        {m.raw_content}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-label">
                        {m.source_publication || m.source_type}
                      </Badge>
                      <span className="text-meta text-stone">
                        {m.published_at
                          ? new Date(m.published_at).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                      {m.language && (
                        <Badge variant="outline" className="text-label">
                          {m.language.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
