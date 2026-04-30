import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "neutral";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
}) {
  const accent = tone === "primary";
  return (
    <Card className="relative">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
            <div className="mt-2 text-4xl font-semibold tabular-nums">{value}</div>
            {hint && <div className="mt-1.5 text-sm text-muted-foreground">{hint}</div>}
          </div>
          {icon && (
            <div className={cn(
              "rounded-lg p-2.5 shrink-0",
              accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
