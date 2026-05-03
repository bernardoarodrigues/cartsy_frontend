"use client";

import { use, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { api, formatNumber } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

const DatasetGraph = dynamic(() => import("@/components/dataset-graph").then((m) => m.DatasetGraph), {
  ssr: false,
  loading: () => <Skeleton className="h-[720px] w-full" />,
});

export default function GraphPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);

  const [minGroupSize, setMinGroupSize] = useState(2);
  const [maxGroups, setMaxGroups] = useState(300);
  const [includeSingletons, setIncludeSingletons] = useState(false);
  const [maxSingletons, setMaxSingletons] = useState(500);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dataset-graph", runId, minGroupSize, maxGroups, includeSingletons, maxSingletons],
    queryFn: () =>
      api.datasetGraph(runId, {
        min_group_size: minGroupSize,
        max_groups: maxGroups,
        include_singletons: includeSingletons,
        max_singletons: includeSingletons ? maxSingletons : 0,
      }),
  });

  return (
    <>
      <PageHeader
        title="Dataset Graph"
        description="Each node is a product. Connected clusters are dedupe groups; isolated nodes are unique products."
      />
      <div className="px-6 py-6 space-y-4">
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3 items-end">
            <div className="md:col-span-3 space-y-2 pb-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">Min group size</Label>
                <span className="text-xs tabular-nums font-medium">{minGroupSize}</span>
              </div>
              <Slider min={2} max={25} step={1} value={[minGroupSize]} onValueChange={(v) => setMinGroupSize(Array.isArray(v) ? v[0] : (v as number))} />
            </div>
            <div className="md:col-span-3 space-y-2 pb-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">Max groups</Label>
                <span className="text-xs tabular-nums font-medium">{maxGroups}</span>
              </div>
              <Slider min={50} max={2000} step={50} value={[maxGroups]} onValueChange={(v) => setMaxGroups(Array.isArray(v) ? v[0] : (v as number))} />
            </div>
            <div className="md:col-span-3 flex items-center gap-2.5 pb-2">
              <Switch id="singletons" checked={includeSingletons} onCheckedChange={setIncludeSingletons} />
              <Label htmlFor="singletons" className="text-sm font-medium cursor-pointer">Include singletons</Label>
            </div>
            <div className="md:col-span-3 space-y-2 pb-1.5">
              <div className="flex items-center justify-between">
                <Label className={`text-xs font-medium ${includeSingletons ? "text-muted-foreground" : "text-muted-foreground/50"}`}>Max singletons</Label>
                <span className={`text-xs tabular-nums font-medium ${includeSingletons ? "" : "text-muted-foreground/50"}`}>{maxSingletons}</span>
              </div>
              <Slider disabled={!includeSingletons} min={100} max={5000} step={100} value={[maxSingletons]} onValueChange={(v) => setMaxSingletons(Array.isArray(v) ? v[0] : (v as number))} />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/40 bg-destructive/5"><CardContent className="p-4 text-sm text-destructive">{(error as Error).message}</CardContent></Card>
        )}

        {data && (
          <div className="flex items-center gap-x-6 gap-y-2 text-xs text-muted-foreground flex-wrap px-1">
            <span><span className="text-foreground font-semibold tabular-nums">{formatNumber(data.stats.node_count)}</span> nodes</span>
            <span><span className="text-foreground font-semibold tabular-nums">{formatNumber(data.stats.groups_returned)}</span> groups{data.stats.groups_truncated && " (truncated)"}</span>
            {includeSingletons && <span><span className="text-foreground font-semibold tabular-nums">{formatNumber(data.stats.singletons_returned)}</span> / <span className="tabular-nums">{formatNumber(data.stats.singletons_total)}</span> singletons</span>}
            <span className="ml-auto flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-primary" /> grouped</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-muted border" /> singleton</span>
            </span>
          </div>
        )}

        {isLoading ? (
          <Skeleton className="h-[720px] w-full" />
        ) : data ? (
          data.nodes.length === 0 ? (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No nodes match the current filters.</CardContent></Card>
          ) : (
            <DatasetGraph data={data} runId={runId} />
          )
        ) : null}
      </div>
    </>
  );
}
