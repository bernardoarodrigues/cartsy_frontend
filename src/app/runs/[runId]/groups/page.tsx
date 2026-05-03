"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api, formatCents, formatNumber } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RetailerBadge } from "@/components/decision-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 50;

export default function GroupsPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);

  const [q, setQ] = useState("");
  const [minOffers, setMinOffers] = useState(2);
  const [minConfidence, setMinConfidence] = useState(0);
  const [sort, setSort] = useState<"num_offers" | "cluster_confidence" | "dedupe_id">("num_offers");
  const [offset, setOffset] = useState(0);

  const { data, isFetching } = useQuery({
    queryKey: ["groups", runId, q, minOffers, minConfidence, sort, offset],
    queryFn: () =>
      api.groups(runId, {
        q: q || undefined,
        min_offers: minOffers > 0 ? minOffers : undefined,
        min_confidence: minConfidence > 0 ? minConfidence : undefined,
        sort,
        order: "desc",
        limit: PAGE_SIZE,
        offset,
      }),
    placeholderData: keepPreviousData,
  });

  const total = data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Groups" description="Dedupe clusters with their offers and reasons." />
      <div className="px-6 py-6 space-y-4">
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3 items-end">
            <div className="md:col-span-4 space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Search</Label>
              <Input
                placeholder="canonical name, brand, dedupe_id…"
                value={q}
                onChange={(e) => { setQ(e.target.value); setOffset(0); }}
              />
            </div>
            <div className="md:col-span-3 space-y-2 pb-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">Min offers</Label>
                <span className="text-xs tabular-nums font-medium">{minOffers}</span>
              </div>
              <Slider min={1} max={25} step={1} value={[minOffers]} onValueChange={(v) => { setMinOffers(Array.isArray(v) ? v[0] : (v as number)); setOffset(0); }} />
            </div>
            <div className="md:col-span-3 space-y-2 pb-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">Min confidence</Label>
                <span className="text-xs tabular-nums font-medium">{minConfidence.toFixed(2)}</span>
              </div>
              <Slider min={0} max={1} step={0.01} value={[minConfidence]} onValueChange={(v) => { setMinConfidence(Array.isArray(v) ? v[0] : (v as number)); setOffset(0); }} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Sort by</Label>
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="num_offers">Num offers</SelectItem>
                  <SelectItem value="cluster_confidence">Confidence</SelectItem>
                  <SelectItem value="dedupe_id">Dedupe ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Canonical</TableHead>
                <TableHead className="text-right">Offers</TableHead>
                <TableHead className="text-right">Conf.</TableHead>
                <TableHead>Retailers</TableHead>
                <TableHead className="text-right">Price range</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching && !data
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-5" /></TableCell></TableRow>
                  ))
                : data?.groups.map((g) => (
                    <TableRow key={g.dedupe_id} className="hover:bg-muted/50">
                      <TableCell className="max-w-[480px]">
                        <Link href={`/runs/${runId}/groups/${g.dedupe_id}`} className="hover:underline block">
                          <div className="font-medium line-clamp-1">{g.canonical_name}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">{g.dedupe_id}</div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right"><Badge variant="secondary" className="font-normal tabular-nums">{g.num_offers}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{Number(g.cluster_confidence).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {(g.retailers ?? []).map((r) => <RetailerBadge key={r} retailer={r} />)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {g.price_min_cents !== undefined && g.price_max_cents !== undefined
                          ? g.price_min_cents === g.price_max_cents
                            ? formatCents(g.price_min_cents)
                            : `${formatCents(g.price_min_cents)} – ${formatCents(g.price_max_cents)}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs">
            <div className="text-muted-foreground tabular-nums">{formatNumber(total)} groups · page {page} of {pages}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}><ChevronLeft className="h-4 w-4" /> Prev</Button>
              <Button variant="outline" size="sm" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
