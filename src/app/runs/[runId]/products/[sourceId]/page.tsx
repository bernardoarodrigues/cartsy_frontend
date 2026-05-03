"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, formatCents } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DecisionBadge, RetailerBadge } from "@/components/decision-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ runId: string; sourceId: string }>;
}) {
  const { runId, sourceId } = use(params);
  const decoded = decodeURIComponent(sourceId);

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", runId, decoded],
    queryFn: () => api.products(runId, { q: decoded, limit: 1, offset: 0 }),
  });

  const product = data?.products.find((p) => p.source_id === decoded) ?? data?.products[0];

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-1.5">
            <Link href={`/runs/${runId}/products`}>
              <Button variant="ghost" size="icon" className="h-7 w-7 -ml-1">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="font-mono text-base sm:text-lg font-semibold">{decoded}</span>
          </span>
        }
        description={product?.name_raw}
      />
      <div className="px-6 py-6 space-y-6">
        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">
              {(error as Error).message}
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-56" />
          </div>
        )}

        {product && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-5 space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Retailer</div>
                  <RetailerBadge retailer={product.retailer} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Price</div>
                  <div className="text-2xl font-semibold tabular-nums tracking-tight">
                    {formatCents(product.price_cents)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Decision</div>
                  <DecisionBadge decision={product.decision} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-5 space-y-3 text-sm">
                <KV label="Name (raw)">{product.name_raw}</KV>
                <KV label="Brand (raw)">{product.brand_raw || "—"}</KV>
                <KV label="SKU">{product.sku || <span className="text-muted-foreground">—</span>}</KV>
                <KV label="Dimension">{product.dimension || <span className="text-muted-foreground">—</span>}</KV>
                <KV label="Confidence">
                  {product.cluster_confidence
                    ? <span className="tabular-nums">{Number(product.cluster_confidence).toFixed(4)}</span>
                    : <span className="text-muted-foreground">—</span>}
                </KV>
                <div className="pt-3 mt-1 border-t space-y-3">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    Canonical
                  </div>
                  <KV label="Name">{product.canonical_name || <span className="text-muted-foreground">—</span>}</KV>
                  <KV label="Brand">{product.canonical_brand || <span className="text-muted-foreground">—</span>}</KV>
                </div>
                {product.explanation && (
                  <div className="pt-3 mt-1 border-t space-y-2">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                      Explanation
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap bg-muted/50 rounded-md p-3 leading-relaxed">
                      {product.explanation}
                    </pre>
                  </div>
                )}
                <div className="pt-3 mt-1 border-t">
                  <Link
                    href={`/runs/${runId}/groups/${product.dedupe_id}`}
                    className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View group <span className="font-mono text-xs">{product.dedupe_id}</span> →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-right text-sm min-w-0">{children}</span>
    </div>
  );
}
