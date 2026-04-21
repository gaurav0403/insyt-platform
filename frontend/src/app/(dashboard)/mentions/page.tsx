"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAPI, type Mention } from "@/lib/api";

const PAGE_SIZE = 25;

export default function MentionsPage() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("date");
  const [pubFilter, setPubFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [publications, setPublications] = useState<string[]>([]);

  const loadMentions = useCallback(async () => {
    setLoading(true);
    try {
      let path = `/api/mentions/?sort=${sort}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`;
      if (pubFilter && pubFilter !== "all") {
        path += `&publication=${encodeURIComponent(pubFilter)}`;
      }
      const data = await fetchAPI<{ mentions: Mention[]; count: number; total: number }>(path);
      setMentions(data.mentions);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sort, page, pubFilter]);

  // Load publications list for filter
  useEffect(() => {
    fetchAPI<{ total: number; by_source: Record<string, number>; by_publication: Record<string, number> }>(
      "/api/mentions/stats"
    ).then((stats) => {
      setTotal(stats.total);
      if (stats.by_publication) {
        setPublications(Object.keys(stats.by_publication));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadMentions();
  }, [loadMentions]);

  const filtered = search
    ? mentions.filter(
        (m) =>
          (m.title || "").toLowerCase().includes(search.toLowerCase()) ||
          (m.raw_content || "").toLowerCase().includes(search.toLowerCase()) ||
          (m.source_publication || "").toLowerCase().includes(search.toLowerCase())
      )
    : mentions;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">
          Mention feed
        </h1>
        <p className="text-base text-slate mt-1">
          {total.toLocaleString()} mentions across all sources.
        </p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search mentions..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setSearch(searchInput);
          }}
          className="w-64 h-9 text-sm"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSearch(searchInput)}
        >
          Search
        </Button>

        <Select value={sort} onValueChange={(v) => { if (v) { setSort(v); setPage(0); } }}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Newest first</SelectItem>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="publication">Publication</SelectItem>
          </SelectContent>
        </Select>

        <Select value={pubFilter} onValueChange={(v) => { if (v) { setPubFilter(v); setPage(0); } }}>
          <SelectTrigger className="w-48 h-9 text-sm">
            <SelectValue placeholder="All publications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All publications</SelectItem>
            {publications.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {search && (
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSearchInput(""); }}>
            Clear search
          </Button>
        )}
      </div>

      {/* Mentions list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-stone">No mentions found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <Card key={m.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-4">
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
                      <h3 className="text-sm font-medium text-ink">
                        {m.title || "Untitled"}
                      </h3>
                    )}
                    {m.raw_content && (
                      <p className="text-xs text-slate mt-1 line-clamp-2 leading-relaxed">
                        {m.raw_content}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-label">
                        {m.source_publication || m.source_type}
                      </Badge>
                      <span className="text-meta text-stone">
                        {m.published_at
                          ? new Date(m.published_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                      {m.relevance_tier && (
                        <Badge
                          variant="outline"
                          className={
                            m.relevance_tier === "strong"
                              ? "text-label border-ochre/40 text-ochre"
                              : "text-label"
                          }
                        >
                          {m.relevance_tier}
                        </Badge>
                      )}
                      {m.source_url && (
                        <a
                          href={m.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-meta text-stone hover:text-ochre transition-colors"
                        >
                          View source ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-meta text-stone">
            Page {page + 1} of {totalPages} ({total.toLocaleString()} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
