"use client";

import { use, useEffect } from "react";
import { useRunStore } from "@/lib/run-store";

export default function RunLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ runId: string }>;
}) {
  const { runId } = use(params);
  const setRunId = useRunStore((s) => s.setRunId);
  useEffect(() => {
    setRunId(runId);
  }, [runId, setRunId]);
  return <>{children}</>;
}
