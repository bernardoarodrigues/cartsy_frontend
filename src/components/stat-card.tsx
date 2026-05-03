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
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              {label}
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight leading-none">
              {value}
            </div>
            {hint && (
              <div className="text-xs text-muted-foreground leading-snug pt-0.5">
                {hint}
              </div>
            )}
          </div>
          {icon && (
            <div
              className={cn(
                "rounded-md p-2 shrink-0",
                accent
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
