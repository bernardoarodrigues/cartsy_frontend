"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function parseFeatureScores(raw: string | undefined): { feature: string; value: number }[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [feature, value] = s.split(":");
      return { feature, value: Number(value) };
    })
    .filter((x) => Number.isFinite(x.value));
}

export function ExplainPair({ runId, sourceIds }: { runId: string; sourceIds: string[] }) {
  const presets = sourceIds.length >= 2;
  const [a, setA] = useState(presets ? sourceIds[0] : "");
  const [b, setB] = useState(presets ? sourceIds[1] : "");
  const [submitted, setSubmitted] = useState<{ a: string; b: string } | null>(
    presets ? { a: sourceIds[0], b: sourceIds[1] } : null,
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["explain", runId, submitted?.a, submitted?.b],
    queryFn: () => api.explain(runId, submitted!.a, submitted!.b),
    enabled: !!submitted,
  });

  const features = data?.pair ? parseFeatureScores((data.pair as Record<string, string>).feature_scores) : [];

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <Label>Source A</Label>
            {presets ? (
              <Select value={a} onValueChange={(v) => setA(v ?? "")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{sourceIds.map((id) => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <Input className="mt-1 font-mono" value={a} onChange={(e) => setA(e.target.value)} />
            )}
          </div>
          <div>
            <Label>Source B</Label>
            {presets ? (
              <Select value={b} onValueChange={(v) => setB(v ?? "")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{sourceIds.map((id) => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <Input className="mt-1 font-mono" value={b} onChange={(e) => setB(e.target.value)} />
            )}
          </div>
          <Button disabled={!a || !b || a === b} onClick={() => setSubmitted({ a, b })}>Explain</Button>
        </div>

        {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

        {isLoading && <Skeleton className="h-32 w-full" />}

        {data && (
          <div className="space-y-4 pt-2">
            <div className="grid md:grid-cols-2 gap-3">
              <ProductMini title="Product A" data={data.product_a} />
              <ProductMini title="Product B" data={data.product_b} />
            </div>

            {!data.found ? (
              <Card className="bg-muted/40"><CardContent className="p-4 text-sm">{data.message}</CardContent></Card>
            ) : data.pair ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Decision</span>
                    <Badge variant={(data.pair as Record<string, string>).decision === "merge" ? "default" : "outline"}>
                      {(data.pair as Record<string, string>).decision}
                    </Badge>
                    <span className="text-sm text-muted-foreground">·</span>
                    <span className="text-sm tabular-nums">score {Number((data.pair as Record<string, number>).score).toFixed(3)}</span>
                  </div>
                  {features.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Feature scores</div>
                      {features.map((f) => (
                        <div key={f.feature} className="flex items-center gap-2 text-xs">
                          <span className="w-32 font-mono text-muted-foreground">{f.feature}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${Math.min(100, f.value * 100)}%` }} />
                          </div>
                          <span className="w-10 text-right tabular-nums">{f.value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Explanation</div>
                    <div className="text-xs font-mono whitespace-pre-wrap">{(data.pair as Record<string, string>).explanation}</div>
                  </div>
                  {(data.pair as Record<string, string>).blocking_keys && (
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Blocking keys</div>
                      <div className="text-xs font-mono">{(data.pair as Record<string, string>).blocking_keys}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProductMini({ title, data }: { title: string; data: Record<string, string> }) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-3 text-sm space-y-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
        <div className="font-medium line-clamp-2">{data.name_raw || data.source_id}</div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs">{data.retailer}</Badge>
          {data.brand_raw && <Badge variant="secondary" className="text-xs">{data.brand_raw}</Badge>}
        </div>
        <div className="text-xs font-mono text-muted-foreground">id: {data.source_id}</div>
      </CardContent>
    </Card>
  );
}
