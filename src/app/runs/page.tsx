"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, formatNumber } from "@/lib/api";
import { useRunStore } from "@/lib/run-store";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatCost(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `$${value.toFixed(4)}`;
}

export default function RunsPage() {
  const router = useRouter();
  const setRunId = useRunStore((s) => s.setRunId);
  const { data, isLoading, error } = useQuery({
    queryKey: ["runs"],
    queryFn: () => api.listRuns(),
  });

  return (
    <>
      <PageHeader
        title="Pipeline runs"
        description="Pick a run to inspect dedupe results, products and explanations."
      />
      <div className="px-6 py-6 space-y-4">
        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 text-sm">
              <p className="font-medium text-destructive">Could not reach API</p>
              <p className="text-muted-foreground mt-1">{(error as Error).message}</p>
              <p className="text-muted-foreground mt-2">
                Start the backend (port 8000): <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">docker compose up</code>
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : data && data.runs.length > 0 ? (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Run ID</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Input</TableHead>
                  <TableHead className="text-right">Unique</TableHead>
                  <TableHead className="text-right">Duplicates</TableHead>
                  <TableHead className="text-right">Elapsed</TableHead>
                  <TableHead className="text-right">OpenAI cost</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...data.runs].sort((a, b) => b.run_id.localeCompare(a.run_id)).map((run) => (
                  <TableRow
                    key={run.run_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setRunId(run.run_id);
                      router.push(`/runs/${run.run_id}`);
                    }}
                  >
                    <TableCell>
                      <Link
                        href={`/runs/${run.run_id}`}
                        className="font-mono text-xs hover:underline"
                        onClick={() => setRunId(run.run_id)}
                      >
                        {run.run_id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {run.model_id ? (
                        <Badge variant="outline" className="font-mono text-[11px]">{run.model_id}</Badge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(run.input_records)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(run.final_unique_products)}</TableCell>
                    <TableCell className="text-right">
                      {run.duplicate_records_grouped !== null && run.duplicate_records_grouped !== undefined ? (
                        <Badge variant="secondary" className="tabular-nums font-normal">{formatNumber(run.duplicate_records_grouped)}</Badge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatDuration(run.elapsed_seconds)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatCost(run.openai_cost_usd)}</TableCell>
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
                <p className="text-sm text-muted-foreground">No runs found in outputs/.</p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </>
  );
}
