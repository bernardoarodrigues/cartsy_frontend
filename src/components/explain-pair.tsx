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

const ML_FEATURE_NAMES = new Set([
  "same_retailer", "brand_exact", "brand_fuzzy", "title_token_set", "title_partial",
  "category_exact", "model_token_jaccard", "salient_token_jaccard", "size_match",
  "size_conflict", "pack_match", "pack_conflict", "price_ratio_diff", "price_both_present",
  "identifier_any", "exact_ean", "exact_gtin", "exact_upc", "exact_asin",
  "exact_sku_same_retailer", "exact_sku_cross_retailer", "lexical_sim", "trigram_sim",
  "semantic_sim", "retrieval_layer_count", "variant_conflict",
]);

type FeatureEntry = { feature: string; value: number };

function parseFeatureScores(raw: string | undefined): FeatureEntry[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const colonAt = s.indexOf(":");
      if (colonAt < 0) return null;
      const feature = s.slice(0, colonAt);
      const value = Number(s.slice(colonAt + 1));
      return Number.isFinite(value) ? { feature, value } : null;
    })
    .filter((x): x is FeatureEntry => x !== null);
}

function FeatureBar({ label, value, max = 1, negative = false }: { label: string; value: number; max?: number; negative?: boolean }) {
  const pct = Math.min(100, Math.abs(value) / (max || 1) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-44 font-mono text-muted-foreground truncate" title={label}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${negative && value < 0 ? "bg-destructive/70" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-right tabular-nums">{value.toFixed(3)}</span>
    </div>
  );
}

function FeatureSection({ title, features, showNegative = false }: { title: string; features: FeatureEntry[]; showNegative?: boolean }) {
  if (features.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
      {features.map((f) => (
        <FeatureBar key={f.feature} label={f.feature} value={f.value} negative={showNegative} />
      ))}
    </div>
  );
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

  const allFeatures = data?.pair ? parseFeatureScores((data.pair as Record<string, string>).feature_scores) : [];

  const primaryFeatures = allFeatures.filter((f) =>
    ["ml_score", "rule_score", "hard_contradiction", "ml_threshold"].includes(f.feature)
  );
  const mlFeatures = allFeatures
    .filter((f) => f.feature.startsWith("ml_") && ML_FEATURE_NAMES.has(f.feature.slice(3)))
    .map((f) => ({ ...f, feature: f.feature.slice(3) }));
  const retrievalFeatures = allFeatures.filter((f) =>
    ["postgres_exact", "postgres_fts", "postgres_trigram", "postgres_vector", "semantic_sim"].includes(f.feature)
  );
  const ruleFeatures = allFeatures.filter(
    (f) =>
      !f.feature.startsWith("ml_") &&
      !["ml_score", "rule_score", "hard_contradiction", "ml_threshold"].includes(f.feature) &&
      !["postgres_exact", "postgres_fts", "postgres_trigram", "postgres_vector", "semantic_sim", "llm_attributes"].includes(f.feature)
  );

  const mlScore = allFeatures.find((f) => f.feature === "ml_score")?.value;
  const isHardContradiction = (allFeatures.find((f) => f.feature === "hard_contradiction")?.value ?? 0) > 0;

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
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium">Decision</span>
                    <Badge variant={(data.pair as Record<string, string>).decision === "merge" ? "default" : "outline"}>
                      {(data.pair as Record<string, string>).decision}
                    </Badge>
                    {mlScore !== undefined && (
                      <>
                        <span className="text-sm text-muted-foreground">·</span>
                        <span className="text-sm">
                          ML score <span className="font-semibold tabular-nums">{mlScore.toFixed(3)}</span>
                        </span>
                      </>
                    )}
                    {isHardContradiction && (
                      <Badge variant="destructive" className="text-xs">hard contradiction</Badge>
                    )}
                  </div>

                  <FeatureSection title="ML input features (26)" features={mlFeatures} showNegative />
                  <FeatureSection title="Retrieval signals" features={retrievalFeatures} />
                  <FeatureSection title="Rule features" features={ruleFeatures} />
                  <FeatureSection title="Scores" features={primaryFeatures} />

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
