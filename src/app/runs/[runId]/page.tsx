"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { api, formatNumber, formatPct } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, AlertTriangle, DollarSign, Layers, Sparkles, Timer } from "lucide-react";

// Keys that appear on every scored pair — too noisy for the decision reasons chart
const BOILERPLATE_REASON_KEYS = new Set([
  "relation", "ml_score", "ml_threshold", "rule_score",
  "exact", "fts", "trigram", "vector", "semantic", "llm_attrs",
]);

const confidenceColors: Record<string, string> = {
  "0.95-1.00": "var(--primary)",
  "0.90-0.95": "color-mix(in oklab, var(--primary) 75%, transparent)",
  "0.86-0.90": "color-mix(in oklab, var(--primary) 55%, transparent)",
  "0.70-0.86": "color-mix(in oklab, var(--primary) 35%, transparent)",
  "<0.70": "color-mix(in oklab, var(--primary) 20%, transparent)",
};

export default function RunOverviewPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const { data, isLoading, error } = useQuery({
    queryKey: ["summary", runId],
    queryFn: () => api.summary(runId),
  });

  const confidenceData = data?.confidence_distribution
    ? Object.entries(data.confidence_distribution).map(([bucket, count]) => ({ bucket, count, fill: confidenceColors[bucket] ?? "var(--chart-1)" }))
    : [];

  const thresholdData = data?.threshold_sensitivity
    ? Object.entries(data.threshold_sensitivity)
        .map(([t, v]) => ({ threshold: t, merges: v }))
        .sort((a, b) => Number(b.threshold) - Number(a.threshold))
    : [];

  const qualityData = data?.top_quality_flags
    ? Object.entries(data.top_quality_flags)
        .map(([flag, count]) => ({ flag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    : [];

  const reasonData = (() => {
    const merge = data?.decision_reason_counts?.merge ?? {};
    const noMerge = data?.decision_reason_counts?.no_merge ?? {};
    const keys = Array.from(new Set([...Object.keys(merge), ...Object.keys(noMerge)]))
      .filter((k) => !BOILERPLATE_REASON_KEYS.has(k));
    return keys
      .map((reason) => ({ reason, merge: merge[reason] ?? 0, no_merge: noMerge[reason] ?? 0 }))
      .sort((a, b) => b.merge + b.no_merge - (a.merge + a.no_merge))
      .slice(0, 14);
  })();

  const lowestConfidenceMerges = (data as Record<string, unknown> | undefined)?.lowest_confidence_accepted_merges as Array<{
    dedupe_id: string;
    canonical_name: string;
    num_offers: number;
    cluster_confidence: number;
    source_ids: string[];
    merge_reasons?: string[];
  }> | undefined;

  const blockingData = data?.blocking
    ? Object.entries(data.blocking)
        .filter(([, v]) => Number(v) > 0)
        .map(([k, v]) => ({ key: k, value: Number(v) }))
        .sort((a, b) => b.value - a.value)
    : [];

  const cost = data?.metrics?.openai?.total_estimated_cost_usd ?? null;

  return (
    <>
      <PageHeader
        title={<span className="font-mono">{runId}</span>}
        description="Run summary, metrics, and dedupe quality."
      />
      <div className="p-6 space-y-6">
        {error && <Card className="border-destructive/40"><CardContent className="p-4 text-sm text-destructive">{(error as Error).message}</CardContent></Card>}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard tone="primary" label="Input records" value={formatNumber(data.input_records)} icon={<Layers className="h-5 w-5" />} />
              <StatCard tone="primary" label="Unique products" value={formatNumber(data.final_unique_products)} hint={`${formatPct(data.reduction_ratio)} reduction`} icon={<Sparkles className="h-5 w-5" />} />
              <StatCard tone="primary" label="Duplicates grouped" value={formatNumber(data.duplicate_records_grouped)} hint={`${formatNumber(data.merged_pairs)} merged pairs`} icon={<Activity className="h-5 w-5" />} />
              <StatCard tone="primary" label="Elapsed" value={data.elapsed_seconds ? `${(data.elapsed_seconds / 60).toFixed(1)}m` : "—"} hint={cost !== null ? `OpenAI: $${cost.toFixed(4)}` : undefined} icon={<Timer className="h-5 w-5" />} />
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Pipeline funnel</CardTitle></CardHeader>
              <CardContent>
                <FunnelStrip
                  steps={[
                    { label: "Input", value: data.input_records ?? 0 },
                    { label: "Normalized", value: data.normalized_records ?? 0 },
                    { label: "Pairs scored", value: data.candidate_pairs_scored ?? 0 },
                    { label: "Pairs kept", value: data.candidate_pairs_kept ?? 0 },
                    { label: "Merged", value: data.merged_pairs ?? 0 },
                    { label: "Near-miss", value: data.near_miss_pairs ?? 0 },
                  ]}
                />
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Confidence distribution</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{ count: { label: "Pairs", color: "var(--primary)" } } satisfies ChartConfig}
                    className="h-[260px] w-full"
                  >
                    <BarChart data={confidenceData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="bucket" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={4}>
                        {confidenceData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Threshold sensitivity</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{ merges: { label: "Merges", color: "var(--primary)" } } satisfies ChartConfig}
                    className="h-[260px] w-full"
                  >
                    <LineChart data={thresholdData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="threshold" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="merges" stroke="var(--color-merges)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Top quality flags</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{ count: { label: "Records", color: "var(--primary)" } } satisfies ChartConfig}
                    className="h-[260px] w-full"
                  >
                    <BarChart data={qualityData} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis dataKey="flag" type="category" tickLine={false} axisLine={false} fontSize={11} width={170} interval={0} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Decision reasons</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      merge: { label: "Merge", color: "var(--primary)" },
                      no_merge: { label: "No merge", color: "var(--muted-foreground)" },
                    } satisfies ChartConfig}
                    className="h-[320px] w-full"
                  >
                    <BarChart data={reasonData} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis dataKey="reason" type="category" tickLine={false} axisLine={false} fontSize={11} width={210} interval={0} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="merge" stackId="a" fill="var(--color-merge)" />
                      <Bar dataKey="no_merge" stackId="a" fill="var(--color-no_merge)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Blocking</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      {blockingData.map((row) => (
                        <TableRow key={row.key}>
                          <TableCell className="font-mono text-xs">{row.key}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatNumber(row.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Largest groups</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Canonical name</TableHead>
                        <TableHead className="text-right">Offers</TableHead>
                        <TableHead className="text-right">Conf.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data.largest_groups ?? []).slice(0, 8).map((g) => (
                        <TableRow key={g.dedupe_id}>
                          <TableCell>
                            <Link href={`/runs/${runId}/groups/${g.dedupe_id}`} className="hover:underline">
                              <div className="text-sm font-medium line-clamp-1">{g.canonical_name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{g.dedupe_id}</div>
                            </Link>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <Badge variant="secondary">{g.num_offers}</Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{g.cluster_confidence.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {lowestConfidenceMerges && lowestConfidenceMerges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Lowest-confidence accepted merges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Canonical name</TableHead>
                        <TableHead className="text-right">Offers</TableHead>
                        <TableHead className="text-right">Conf.</TableHead>
                        <TableHead>Merge reasons</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowestConfidenceMerges.map((g) => (
                        <TableRow key={g.dedupe_id}>
                          <TableCell>
                            <Link href={`/runs/${runId}/groups/${g.dedupe_id}`} className="hover:underline">
                              <div className="text-sm font-medium line-clamp-1">{g.canonical_name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{g.dedupe_id}</div>
                            </Link>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <Badge variant="secondary">{g.num_offers}</Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{g.cluster_confidence.toFixed(3)}</span>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground max-w-[240px]">
                            <div className="line-clamp-2">{(g.merge_reasons ?? []).join("; ")}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}

function FunnelStrip({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  const colors = ["bg-primary", "bg-primary/80", "bg-primary/60", "bg-primary/45", "bg-primary/30", "bg-primary/20"];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {steps.map((s, i) => {
        const pct = (s.value / max) * 100;
        return (
          <div key={s.label} className="rounded-lg border p-4 bg-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{s.label}</div>
            <div className="mt-1.5 text-2xl font-semibold tabular-nums">{formatNumber(s.value)}</div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
