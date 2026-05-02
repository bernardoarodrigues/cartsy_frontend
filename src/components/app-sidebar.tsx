"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRunStore } from "@/lib/run-store";
import { cn } from "@/lib/utils";
import { BrainCircuit, Boxes, GitMerge, Home, Network, Search, Share2, Sigma } from "lucide-react";

const NAV = [
  { href: "/", label: "Runs", icon: Home, scoped: false, exact: true },
  { href: "/model", label: "Model", icon: BrainCircuit, scoped: false, exact: true },
  { href: "/runs/[id]", label: "Overview", icon: Sigma, scoped: true, exact: true },
  { href: "/runs/[id]/products", label: "Products", icon: Boxes, scoped: true, exact: false },
  { href: "/runs/[id]/groups", label: "Groups", icon: Network, scoped: true, exact: false },
  { href: "/runs/[id]/graph", label: "Graph", icon: Share2, scoped: true, exact: false },
  { href: "/runs/[id]/pairs", label: "Pairs", icon: GitMerge, scoped: true, exact: false },
  { href: "/runs/[id]/search", label: "Search", icon: Search, scoped: true, exact: false },
];

export function AppSidebar() {
  const pathname = usePathname();
  const runId = useRunStore((s) => s.runId);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="px-6 h-16 flex items-center gap-3 border-b">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">C</div>
        <div className="leading-tight">
          <div className="font-semibold tracking-tight text-base">Cartsy</div>
          <div className="text-sm text-muted-foreground">Dedupe</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const href = item.scoped
            ? runId
              ? item.href.replace("[id]", runId)
              : null
            : item.href;
          const Icon = item.icon;
          const active = href !== null && (item.exact ? pathname === href : pathname === href || pathname.startsWith(href + "/"));
          if (!href) {
            return (
              <span
                key={item.label}
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-base text-muted-foreground/60 cursor-not-allowed"
                title="Select a run first"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            );
          }
          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-base hover:bg-accent hover:text-accent-foreground transition-colors",
                active && "bg-accent text-accent-foreground font-medium",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {runId && (
        <div className="p-4 border-t">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Active run</div>
          <div className="font-mono text-sm mt-1 truncate" title={runId}>{runId}</div>
        </div>
      )}
    </aside>
  );
}
