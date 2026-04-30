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
          <span className="flex items-center gap-2">
            <Link href={`/runs/${runId}/products`}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="font-mono text-base">{decoded}</span>
          </span>
        }
        description={product?.name_raw}
      />
      <div className="p-6 space-y-6">
        {error && (
          <Card className="border-destructive/40">
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
            <div className="grid md:grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-muted-foreground">Retailer</div>
                  <div className="mt-1">
                    <RetailerBadge retailer={product.retailer} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-muted-foreground">Price</div>
                  <div className="text-2xl font-semibold tabular-nums">
                    {formatCents(product.price_cents)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-muted-foreground">Decision</div>
                  <div className="mt-1">
                    <DecisionBadge decision={product.decision} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4 space-y-4 text-sm">
                <KV label="Name (raw)">{product.name_raw}</KV>
                <KV label="Brand (raw)">{product.brand_raw || "—"}</KV>
                <KV label="SKU">{product.sku || "—"}</KV>
                <KV label="Dimension">{product.dimension || "—"}</KV>
                <KV label="Confidence">
                  {product.cluster_confidence
                    ? Number(product.cluster_confidence).toFixed(4)
                    : "—"}
                </KV>
                <div className="pt-2 border-t">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Canonical
                  </div>
                  <KV label="Name">{product.canonical_name || "—"}</KV>
                  <KV label="Brand">{product.canonical_brand || "—"}</KV>
                </div>
                {product.explanation && (
                  <div className="pt-2 border-t">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      Explanation
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap bg-muted/40 rounded p-3">
                      {product.explanation}
                    </pre>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <Link
                    href={`/runs/${runId}/groups/${product.dedupe_id}`}
                    className="text-sm hover:underline text-primary"
                  >
                    View group {product.dedupe_id} →
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
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
