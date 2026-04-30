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
        title="Pipeline Runs"
        description="Pick a run to inspect dedupe results, products and explanations."
      />
      <div className="p-6">
        {error && (
          <Card className="border-destructive/40">
            <CardContent className="p-4 text-sm">
              <p className="font-medium text-destructive">Could not reach API</p>
              <p className="text-muted-foreground mt-1">{(error as Error).message}</p>
              <p className="text-muted-foreground mt-2">
                Start the backend (port 8000): <code className="font-mono">docker compose up</code>
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : data && data.runs.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run ID</TableHead>
                  <TableHead className="text-right">Input</TableHead>
                  <TableHead className="text-right">Unique</TableHead>
                  <TableHead className="text-right">Duplicates</TableHead>
                  <TableHead className="text-right">Elapsed</TableHead>
                  <TableHead className="text-right">OpenAI cost</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.runs.map((run) => (
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
                        className="font-mono text-sm hover:underline"
                        onClick={() => setRunId(run.run_id)}
                      >
                        {run.run_id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(run.input_records)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(run.final_unique_products)}</TableCell>
                    <TableCell className="text-right">
                      {run.duplicate_records_grouped !== null && run.duplicate_records_grouped !== undefined ? (
                        <Badge variant="secondary" className="tabular-nums">{formatNumber(run.duplicate_records_grouped)}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatDuration(run.elapsed_seconds)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCost(run.openai_cost_usd)}</TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          !error && <p className="text-sm text-muted-foreground">No runs found in outputs/.</p>
        )}
      </div>
    </>
  );
}
