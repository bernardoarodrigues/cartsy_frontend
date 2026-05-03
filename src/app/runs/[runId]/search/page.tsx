"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, formatCents } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function SearchPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);

  return (
    <>
      <PageHeader title="Search" description="Find products and artifacts in the run." />
      <div className="px-6 py-6">
        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
          </TabsList>
          <TabsContent value="products"><ProductSearch runId={runId} /></TabsContent>
          <TabsContent value="artifacts"><ArtifactSearch runId={runId} /></TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function ProductSearch({ runId }: { runId: string }) {
  const [q, setQ] = useState("");
  const [backend, setBackend] = useState<"auto" | "postgres" | "artifacts">("auto");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["search", runId, submitted, backend],
    queryFn: () => api.search(runId, { q: submitted!, backend, limit: 25 }),
    enabled: !!submitted,
  });

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3 items-end">
          <div className="md:col-span-7 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Query</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setSubmitted(q)} placeholder="Search products…" />
            </div>
          </div>
          <div className="md:col-span-3 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Backend</Label>
            <Select value={backend} onValueChange={(v) => setBackend(v as typeof backend)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">auto</SelectItem>
                <SelectItem value="postgres">postgres</SelectItem>
                <SelectItem value="artifacts">artifacts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="md:col-span-2" disabled={!q} onClick={() => setSubmitted(q)}>Search</Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{(error as Error).message}</CardContent>
        </Card>
      )}
      {isLoading && <Skeleton className="h-40 w-full" />}

      {data && (
        <Card className="overflow-hidden p-0">
          <div className="divide-y">
            {data.results.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No results.</p>
            ) : data.results.map((r) => (
              <div key={r.source_id} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                <div className="w-12 text-right tabular-nums text-sm font-semibold text-primary">{(r.score * 100).toFixed(0)}%</div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-medium line-clamp-1">{r.name}</div>
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">{r.retailer}</Badge>
                    {r.brand && <Badge variant="secondary" className="font-normal">{r.brand}</Badge>}
                    <span className="font-mono">id {r.source_id}</span>
                    <span>·</span>
                    <Link href={`/runs/${runId}/groups/${r.dedupe_id}`} className="hover:underline font-mono hover:text-foreground">{r.dedupe_id}</Link>
                  </div>
                  {r.retrieval_evidence && r.retrieval_evidence.length > 0 && (
                    <div className="text-xs text-muted-foreground font-mono">{r.retrieval_evidence.join(" · ")}</div>
                  )}
                </div>
                <div className="text-right text-sm tabular-nums shrink-0">{formatCents(r.price_cents)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ArtifactSearch({ runId }: { runId: string }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["artifact-search", runId, submitted, type],
    queryFn: () => api.artifactSearch(runId, { q: submitted!, type: type === "all" ? undefined : type, limit: 25 }),
    enabled: !!submitted,
  });

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3 items-end">
          <div className="md:col-span-7 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Query</Label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setSubmitted(q)} placeholder="Search artifacts…" />
          </div>
          <div className="md:col-span-3 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v ?? "all")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="group">group</SelectItem>
                <SelectItem value="offer">offer</SelectItem>
                <SelectItem value="pair">pair</SelectItem>
                <SelectItem value="near_miss">near_miss</SelectItem>
                <SelectItem value="summary">summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="md:col-span-2" disabled={!q} onClick={() => setSubmitted(q)}>Search</Button>
        </CardContent>
      </Card>
      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{(error as Error).message}</CardContent>
        </Card>
      )}
      {isLoading && <Skeleton className="h-40 w-full" />}
      {data && (
        <Card className="overflow-hidden p-0">
          <div className="divide-y">
            {data.results.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No results.</p>
            ) : data.results.map((r, i) => (
              <pre key={i} className="p-4 text-xs whitespace-pre-wrap font-mono overflow-x-auto">{JSON.stringify(r, null, 2)}</pre>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
