"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, formatCents, formatNumber } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { RetailerBadge } from "@/components/decision-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ExplainPair } from "@/components/explain-pair";
import Link from "next/link";

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ runId: string; dedupeId: string }>;
}) {
  const { runId, dedupeId } = use(params);

  const groupQuery = useQuery({
    queryKey: ["group", runId, dedupeId],
    queryFn: () => api.group(runId, dedupeId),
  });

  const group = groupQuery.data;

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-1.5">
            <Link href={`/runs/${runId}/groups`}>
              <Button variant="ghost" size="icon" className="h-7 w-7 -ml-1"><ChevronLeft className="h-4 w-4" /></Button>
            </Link>
            <span className="font-mono text-base sm:text-lg font-semibold">{dedupeId}</span>
          </span>
        }
        description={group?.canonical_name}
      />
      <div className="px-6 py-6 space-y-6">
        {groupQuery.error && <Card className="border-destructive/40 bg-destructive/5"><CardContent className="p-4 text-sm text-destructive">{(groupQuery.error as Error).message}</CardContent></Card>}

        {group && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5 space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Offers</div>
                <div className="text-2xl font-semibold tabular-nums tracking-tight">{group.num_offers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Confidence</div>
                <div className="text-2xl font-semibold tabular-nums tracking-tight">{Number(group.cluster_confidence).toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Retailers</div>
                <div className="flex flex-wrap gap-1">{group.retailers.map((r) => <RetailerBadge key={r} retailer={r} />)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Price range</div>
                <div className="text-base font-semibold tabular-nums tracking-tight">{group.price_min_cents !== undefined && group.price_max_cents !== undefined ? group.price_min_cents === group.price_max_cents ? formatCents(group.price_min_cents) : `${formatCents(group.price_min_cents)} – ${formatCents(group.price_max_cents)}` : "—"}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="offers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="explain">Explain pair</TabsTrigger>
          </TabsList>

          <TabsContent value="offers" className="mt-0">
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Source</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Retailer</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group?.offers.map((o) => (
                    <TableRow key={o.source_id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">{o.source_id}</TableCell>
                      <TableCell className="max-w-[420px]"><div className="line-clamp-1">{o.name}</div></TableCell>
                      <TableCell>{o.brand || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell><RetailerBadge retailer={o.retailer} /></TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{o.sku || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{o.dimension || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCents(o.price_cents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-4 py-3 text-xs text-muted-foreground border-t tabular-nums">{formatNumber(group?.offers.length ?? 0)} offers</div>
            </Card>
          </TabsContent>

          <TabsContent value="explain" className="mt-0">
            <ExplainPair runId={runId} sourceIds={group?.source_ids ?? []} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
