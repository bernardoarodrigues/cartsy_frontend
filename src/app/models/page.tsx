"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api, formatNumber, formatPct } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

export default function ModelsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ["models"],
    queryFn: () => api.listModels(),
  });

  return (
    <>
      <PageHeader
        title="Models"
        description="Trained logistic regression scorers — click a model to inspect metrics and feature weights."
      />
      <div className="px-6 py-6 space-y-4">
        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 text-sm">
              <p className="font-medium text-destructive">Could not reach API</p>
              <p className="text-muted-foreground mt-1">{(error as Error).message}</p>
              <p className="text-muted-foreground mt-2">
                Train a model first: <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">cartsy-dedupe train-model</code>
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : data && data.models.length > 0 ? (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Model ID</TableHead>
                  <TableHead className="text-right">Train pairs</TableHead>
                  <TableHead className="text-right">Test pairs</TableHead>
                  <TableHead className="text-right">Precision</TableHead>
                  <TableHead className="text-right">Recall</TableHead>
                  <TableHead className="text-right">F1</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...data.models].sort((a, b) => b.model_id.localeCompare(a.model_id)).map((model) => (
                  <TableRow
                    key={model.model_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/models/${model.model_id}`)}
                  >
                    <TableCell className="font-mono text-xs">{model.model_id}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumber(model.train_pairs ?? null)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumber(model.test_pairs ?? null)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPct(model.test_precision ?? null, 1)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPct(model.test_recall ?? null, 1)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatPct(model.test_f1 ?? null, 1)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{model.threshold != null ? model.threshold.toFixed(2) : "—"}</TableCell>
                    <TableCell className="text-right pr-4">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground inline" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          !error && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-sm text-muted-foreground">No trained models found.</p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </>
  );
}
