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
          <span className="flex items-center gap-2">
            <Link href={`/runs/${runId}/groups`}>
              <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            </Link>
            <span className="font-mono text-base">{dedupeId}</span>
          </span>
        }
        description={group?.canonical_name}
      />
      <div className="p-6 space-y-6">
        {groupQuery.error && <Card className="border-destructive/40"><CardContent className="p-4 text-sm text-destructive">{(groupQuery.error as Error).message}</CardContent></Card>}

        {group && (
          <div className="grid md:grid-cols-4 gap-3">
            <Card><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">Offers</div><div className="text-2xl font-semibold">{group.num_offers}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">Confidence</div><div className="text-2xl font-semibold tabular-nums">{Number(group.cluster_confidence).toFixed(2)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">Retailers</div><div className="flex flex-wrap gap-1 mt-1">{group.retailers.map((r) => <RetailerBadge key={r} retailer={r} />)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">Price range</div><div className="text-lg font-medium">{group.price_min_cents !== undefined && group.price_max_cents !== undefined ? group.price_min_cents === group.price_max_cents ? formatCents(group.price_min_cents) : `${formatCents(group.price_min_cents)} – ${formatCents(group.price_max_cents)}` : "—"}</div></CardContent></Card>
          </div>
        )}

        <Tabs defaultValue="offers">
          <TabsList>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="explain">Explain pair</TabsTrigger>
          </TabsList>

          <TabsContent value="offers">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
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
                    <TableRow key={o.source_id}>
                      <TableCell className="font-mono text-xs">{o.source_id}</TableCell>
                      <TableCell className="max-w-[420px]"><div className="line-clamp-1">{o.name}</div></TableCell>
                      <TableCell>{o.brand}</TableCell>
                      <TableCell><RetailerBadge retailer={o.retailer} /></TableCell>
                      <TableCell className="font-mono text-xs">{o.sku || "—"}</TableCell>
                      <TableCell>{o.dimension || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCents(o.price_cents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-3 text-xs text-muted-foreground border-t">{formatNumber(group?.offers.length ?? 0)} offers</div>
            </Card>
          </TabsContent>

          <TabsContent value="explain">
            <ExplainPair runId={runId} sourceIds={group?.source_ids ?? []} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
