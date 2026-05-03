"use client";

import { use, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api, formatNumber } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DecisionBadge, RetailerBadge } from "@/components/decision-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 50;

export default function PairsPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);

  return (
    <>
      <PageHeader title="Pairs" description="Candidate pairs and near-miss decisions." />
      <div className="px-6 py-6">
        <Tabs defaultValue="candidates">
          <TabsList>
            <TabsTrigger value="candidates">Candidate pairs</TabsTrigger>
            <TabsTrigger value="near">Near-miss</TabsTrigger>
          </TabsList>
          <TabsContent value="candidates"><CandidatePairs runId={runId} /></TabsContent>
          <TabsContent value="near"><NearMisses runId={runId} /></TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function CandidatePairs({ runId }: { runId: string }) {
  const [decision, setDecision] = useState<string>("all");
  const [minScore, setMinScore] = useState(0);
  const [sourceId, setSourceId] = useState("");
  const [offset, setOffset] = useState(0);

  const { data, isFetching } = useQuery({
    queryKey: ["pairs", runId, decision, minScore, sourceId, offset],
    queryFn: () =>
      api.pairs(runId, {
        decision: decision === "all" ? undefined : decision,
        min_score: minScore > 0 ? minScore : undefined,
        source_id: sourceId || undefined,
        limit: PAGE_SIZE,
        offset,
      }),
    placeholderData: keepPreviousData,
  });

  const total = data?.total ?? 0;

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3 items-end">
          <div className="md:col-span-3 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Decision</Label>
            <Select value={decision} onValueChange={(v) => { setDecision(v ?? "all"); setOffset(0); }}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="merge">merge</SelectItem>
                <SelectItem value="no_merge">no_merge</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Source ID</Label>
            <Input className="font-mono" value={sourceId} onChange={(e) => { setSourceId(e.target.value); setOffset(0); }} placeholder="e.g. 64114" />
          </div>
          <div className="md:col-span-4 space-y-2 pb-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Min score</Label>
              <span className="text-xs tabular-nums font-medium">{minScore.toFixed(2)}</span>
            </div>
            <Slider min={0} max={1} step={0.01} value={[minScore]} onValueChange={(v) => { setMinScore(Array.isArray(v) ? v[0] : (v as number)); setOffset(0); }} />
          </div>
          <div className="md:col-span-2 text-right text-xs text-muted-foreground tabular-nums pb-2.5">{formatNumber(total)} pairs</div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>A</TableHead>
              <TableHead>B</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead>Decision</TableHead>
              <TableHead>Explanation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && !data ? null : data?.pairs.map((p, i) => (
              <TableRow key={`${p.product_a_id}-${p.product_b_id}-${i}`} className="hover:bg-muted/50">
                <TableCell className="font-mono text-xs">{p.product_a_id}</TableCell>
                <TableCell className="font-mono text-xs">{p.product_b_id}</TableCell>
                <TableCell className="text-right tabular-nums">{Number(p.score).toFixed(3)}</TableCell>
                <TableCell><DecisionBadge decision={p.decision} /></TableCell>
                <TableCell className="max-w-[600px] text-xs font-mono text-muted-foreground"><div className="line-clamp-2">{p.explanation}</div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 border-t text-xs">
          <div className="text-muted-foreground tabular-nums">Page {Math.floor(offset / PAGE_SIZE) + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}><ChevronLeft className="h-4 w-4" /> Prev</Button>
            <Button variant="outline" size="sm" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function NearMisses({ runId }: { runId: string }) {
  const [q, setQ] = useState("");
  const [minScore, setMinScore] = useState(0.7);
  const [offset, setOffset] = useState(0);

  const { data } = useQuery({
    queryKey: ["near-miss", runId, q, minScore, offset],
    queryFn: () => api.nearMisses(runId, { q: q || undefined, min_score: minScore, limit: PAGE_SIZE, offset }),
    placeholderData: keepPreviousData,
  });

  const total = data?.total ?? 0;

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3 items-end">
          <div className="md:col-span-5 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Search</Label>
            <Input value={q} onChange={(e) => { setQ(e.target.value); setOffset(0); }} placeholder="name, brand, retailer…" />
          </div>
          <div className="md:col-span-5 space-y-2 pb-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Min score</Label>
              <span className="text-xs tabular-nums font-medium">{minScore.toFixed(2)}</span>
            </div>
            <Slider min={0} max={1} step={0.01} value={[minScore]} onValueChange={(v) => { setMinScore(Array.isArray(v) ? v[0] : (v as number)); setOffset(0); }} />
          </div>
          <div className="md:col-span-2 text-right text-xs text-muted-foreground tabular-nums pb-2.5">{formatNumber(total)} pairs</div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="divide-y">
          {data?.pairs.map((p, i) => (
            <div key={`${p.product_a_id}-${p.product_b_id}-${i}`} className="p-4 grid md:grid-cols-2 gap-4">
              <NearMissSide id={p.product_a_id} name={p.name_a} brand={p.brand_a} retailer={p.retailer_a} price={p.price_a} dim={p.dimension_a} />
              <NearMissSide id={p.product_b_id} name={p.name_b} brand={p.brand_b} retailer={p.retailer_b} price={p.price_b} dim={p.dimension_b} />
              <div className="md:col-span-2 flex items-center gap-2 pt-1">
                <Badge variant="outline" className="font-normal tabular-nums">score {Number(p.score).toFixed(3)}</Badge>
                <span className="text-xs font-mono text-muted-foreground line-clamp-1">{p.explanation}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t text-xs">
          <div className="text-muted-foreground tabular-nums">Page {Math.floor(offset / PAGE_SIZE) + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}><ChevronLeft className="h-4 w-4" /> Prev</Button>
            <Button variant="outline" size="sm" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function NearMissSide({ id, name, brand, retailer, price, dim }: { id: string; name: string; brand: string; retailer: string; price: string; dim: string }) {
  return (
    <div className="text-sm space-y-1">
      <div className="font-medium line-clamp-2">{name}</div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        <RetailerBadge retailer={retailer} />
        {brand && <Badge variant="secondary">{brand}</Badge>}
        {dim && <Badge variant="outline">{dim}</Badge>}
      </div>
      <div className="text-xs text-muted-foreground">id <span className="font-mono">{id}</span> · price {price ? (Number(price) / 100).toFixed(2) : "—"}</div>
    </div>
  );
}
