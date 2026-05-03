import { cn } from "@/lib/utils";

export function DecisionBadge({ decision, className }: { decision: string; className?: string }) {
  const cls =
    decision === "merge"
      ? "decision-merge"
      : decision === "no_merge"
        ? "decision-no_merge"
        : decision === "singleton"
          ? "decision-singleton"
          : "bg-muted text-muted-foreground border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium tabular-nums leading-5",
        cls,
        className,
      )}
    >
      {decision || "—"}
    </span>
  );
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

export function RetailerBadge({ retailer, className }: { retailer: string; className?: string }) {
  const hue = hashHue(retailer);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground leading-5",
        className,
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: `oklch(0.6 0.12 ${hue})` }}
      />
      {retailer}
    </span>
  );
}
