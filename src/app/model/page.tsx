"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
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
import { Activity, Binary, Brain, Target } from "lucide-react";

export default function ModelPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["model"],
    queryFn: () => api.model(),
  });

  const m = data?.metrics;

  const coeffData = (data?.feature_coefficients ?? [])
    .map((f) => ({ ...f, abs: Math.abs(f.coefficient) }))
    .sort((a, b) => b.abs - a.abs);

  const curveData = (data?.threshold_curve ?? [])
    .filter((_, i, arr) => i % 2 === 0 || i === arr.length - 1)
    .map((p) => ({ ...p, threshold: Number(p.threshold.toFixed(2)) }));

  const activeThreshold = m?.threshold ?? null;

  return (
    <>
      <PageHeader
        title="Model"
        description="Logistic regression scorer — training metrics, feature weights, and threshold calibration."
      />
      <div className="p-6 space-y-6">
        {error && (
          <Card className="border-destructive/40">
            <CardContent className="p-4 text-sm text-destructive">
              {(error as Error).message.includes("404")
                ? "No trained model found. Run cartsy-dedupe train-model first."
                : (error as Error).message}
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard tone="primary" label="Precision" value={m?.test_precision !== undefined ? formatPct(m.test_precision, 1) : "—"} hint={`target ${formatPct(m?.target_precision ?? null, 0)}`} icon={<Target className="h-5 w-5" />} />
              <StatCard tone="primary" label="Recall" value={m?.test_recall !== undefined ? formatPct(m.test_recall, 1) : "—"} icon={<Activity className="h-5 w-5" />} />
              <StatCard tone="primary" label="F1" value={m?.test_f1 !== undefined ? formatPct(m.test_f1, 1) : "—"} hint={`AP ${formatPct(m?.test_average_precision ?? null, 2)}`} icon={<Brain className="h-5 w-5" />} />
              <StatCard tone="primary" label="Threshold" value={activeThreshold !== null ? activeThreshold.toFixed(2) : "—"} hint={`${formatNumber(m?.train_pairs ?? null)} train pairs`} icon={<Binary className="h-5 w-5" />} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-sm space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Test pairs</div>
                  <div className="text-2xl font-semibold tabular-nums">{formatNumber(m?.test_pairs ?? null)}</div>
                  <div className="text-xs text-muted-foreground">{formatNumber(m?.positive_pairs ?? null)} positive · {formatNumber(m?.negative_pairs !== undefined && m?.positive_pairs !== undefined ? m.negative_pairs : null)} negative</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-sm space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">False positives</div>
                  <div className="text-2xl font-semibold tabular-nums">{formatNumber(data.false_positive_count)}</div>
                  <div className="text-xs text-muted-foreground">at current threshold</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-sm space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">False negatives</div>
                  <div className="text-2xl font-semibold tabular-nums">{formatNumber(data.false_negative_count)}</div>
                  <div className="text-xs text-muted-foreground">at current threshold</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-sm space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Features</div>
                  <div className="text-2xl font-semibold tabular-nums">{m?.feature_columns?.length ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {m?.use_openai_embeddings ? "OpenAI embeddings" : "no embeddings"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Feature coefficients</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{ coefficient: { label: "Coefficient", color: "var(--primary)" } } satisfies ChartConfig}
                    className="w-full"
                    style={{ height: `${Math.max(260, coeffData.length * 24)}px` }}
                  >
                    <BarChart data={coeffData} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis dataKey="feature" type="category" tickLine={false} axisLine={false} fontSize={10} width={190} interval={0} />
                      <ReferenceLine x={0} stroke="var(--border)" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="coefficient" radius={3}>
                        {coeffData.map((entry, i) => (
                          <Cell key={i} fill={entry.coefficient >= 0 ? "var(--primary)" : "var(--destructive)"} fillOpacity={0.75} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                  <p className="text-xs text-muted-foreground mt-2">Positive = increases merge probability. Negative = decreases it.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Threshold curve</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      precision: { label: "Precision", color: "var(--primary)" },
                      recall: { label: "Recall", color: "var(--chart-2)" },
                      f1: { label: "F1", color: "var(--chart-3)" },
                    } satisfies ChartConfig}
                    className="h-[320px] w-full"
                  >
                    <LineChart data={curveData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="threshold" tickLine={false} axisLine={false} fontSize={11} label={{ value: "threshold", position: "insideBottom", offset: -2, fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                      {activeThreshold !== null && <ReferenceLine x={activeThreshold} stroke="var(--muted-foreground)" strokeDasharray="4 2" label={{ value: `t=${activeThreshold}`, position: "insideTopRight", fontSize: 10 }} />}
                      <ChartTooltip content={<ChartTooltipContent />} formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`} />
                      <Line type="monotone" dataKey="precision" stroke="var(--color-precision)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="recall" stroke="var(--color-recall)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="f1" stroke="var(--color-f1)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />Precision</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-2)] inline-block" />Recall</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-3)] inline-block" />F1</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {data.top_risky_clusters.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Top risky predicted clusters</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(data.top_risky_clusters[0]).map((h) => (
                          <TableHead key={h}>{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.top_risky_clusters.map((row, i) => (
                        <TableRow key={i}>
                          {Object.values(row).map((v, j) => (
                            <TableCell key={j} className="text-xs font-mono">{v}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-base">Feature contract ({m?.feature_columns?.length ?? 0} features)</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {(m?.feature_columns ?? []).map((f) => (
                    <Badge key={f} variant="secondary" className="font-mono text-xs">{f}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </>
  );
}
