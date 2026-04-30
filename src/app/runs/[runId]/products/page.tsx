"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api, formatCents, formatNumber } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { DecisionBadge, RetailerBadge } from "@/components/decision-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const PAGE_SIZE = 50;
const DECISIONS = ["all", "merge", "no_merge", "singleton"] as const;
const RETAILERS = ["all", "amazon_br", "amazon_us", "natura", "beleza_na_web", "boticario"];

export default function ProductsPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);

  const [q, setQ] = useState("");
  const [retailer, setRetailer] = useState("all");
  const [decision, setDecision] = useState<(typeof DECISIONS)[number]>("all");
  const [minConfidence, setMinConfidence] = useState(0);
  const [offset, setOffset] = useState(0);
  const router = useRouter();

  const { data, isFetching } = useQuery({
    queryKey: ["products", runId, q, retailer, decision, minConfidence, offset],
    queryFn: () =>
      api.products(runId, {
        q: q || undefined,
        retailer: retailer === "all" ? undefined : retailer,
        decision: decision === "all" ? undefined : decision,
        min_confidence: minConfidence > 0 ? minConfidence : undefined,
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
      <PageHeader
        title="Products"
        description="Search, filter, and inspect every offer in the assignments table."
      />
      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <Label>Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="name, brand, sku, source_id, dedupe_id…"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setOffset(0); }}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Retailer</Label>
              <Select value={retailer} onValueChange={(v) => { setRetailer(v ?? "all"); setOffset(0); }}>
                <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RETAILERS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Decision</Label>
              <Select value={decision} onValueChange={(v) => { setDecision(v as typeof decision); setOffset(0); }}>
                <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DECISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Min confidence: <span className="tabular-nums">{minConfidence.toFixed(2)}</span></Label>
              <Slider
                className="mt-3"
                min={0}
                max={1}
                step={0.01}
                value={[minConfidence]}
                onValueChange={(v) => { setMinConfidence(Array.isArray(v) ? v[0] : (v as number)); setOffset(0); }}
              />
            </div>
            <div className="md:col-span-1 text-right text-xs text-muted-foreground">
              {formatNumber(total)} match
            </div>
          </CardContent>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Source</TableHead>
                <TableHead className="w-36">Group</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Retailer</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Conf.</TableHead>
                <TableHead>Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching && !data ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                ))
              ) : (
                data?.products.map((p) => (
                  <TableRow
                    key={p.source_id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => router.push(`/runs/${runId}/products/${encodeURIComponent(p.source_id)}`)}
                  >
                    <TableCell className="font-mono text-xs">{p.source_id}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Link href={`/runs/${runId}/groups/${p.dedupe_id}`} className="font-mono text-xs hover:underline">
                        {p.dedupe_id.slice(0, 14)}…
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[420px]"><div className="line-clamp-1">{p.name_raw}</div></TableCell>
                    <TableCell className="text-sm">{p.brand_raw || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell><RetailerBadge retailer={p.retailer} /></TableCell>
                    <TableCell className="text-right tabular-nums">{formatCents(p.price_cents)}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.cluster_confidence ? Number(p.cluster_confidence).toFixed(2) : "—"}</TableCell>
                    <TableCell><DecisionBadge decision={p.decision} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between p-3 border-t text-sm">
            <div className="text-muted-foreground">Page {page} of {pages}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button variant="outline" size="sm" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

    </>
  );
}
