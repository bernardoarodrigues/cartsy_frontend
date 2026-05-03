"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRunStore } from "@/lib/run-store";
import { cn } from "@/lib/utils";
import { ArrowLeft, BrainCircuit, Boxes, GitMerge, Home, Network, Search, Share2, Sigma } from "lucide-react";

const RUN_NAV = [
  { href: "/runs/[id]", label: "Overview", icon: Sigma, exact: true },
  { href: "/runs/[id]/products", label: "Products", icon: Boxes, exact: false },
  { href: "/runs/[id]/groups", label: "Groups", icon: Network, exact: false },
  { href: "/runs/[id]/graph", label: "Graph", icon: Share2, exact: false },
  { href: "/runs/[id]/pairs", label: "Pairs", icon: GitMerge, exact: false },
  { href: "/runs/[id]/search", label: "Search", icon: Search, exact: false },
];

const navItem =
  "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors";
const navItemActive = "bg-sidebar-accent text-sidebar-accent-foreground";

export function AppSidebar() {
  const pathname = usePathname();
  const runId = useRunStore((s) => s.runId);
  const inRun = pathname.startsWith("/runs/") && pathname !== "/runs";

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="px-5 h-14 flex items-center gap-2.5 border-b">
        <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-sm">
          C
        </div>
        <div className="leading-tight">
          <div className="font-semibold tracking-tight text-sm">Cartsy</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Dedupe</div>
        </div>
      </div>

      {inRun ? (
        <nav className="flex-1 p-3 space-y-0.5">
          <Link
            href="/runs"
            className="flex items-center gap-2 px-3 py-2 mb-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to runs</span>
          </Link>
          <div className="px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground/80 font-medium">
            Run
          </div>
          {RUN_NAV.map((item) => {
            const href = runId ? item.href.replace("[id]", runId) : null;
            const Icon = item.icon;
            const active = href !== null && (item.exact ? pathname === href : pathname === href || pathname.startsWith(href + "/"));
            if (!href) return null;
            return (
              <Link
                key={item.label}
                href={href}
                className={cn(navItem, active && navItemActive)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : (
        <nav className="flex-1 p-3 space-y-0.5">
          <Link
            href="/runs"
            className={cn(
              navItem,
              (pathname === "/runs" || pathname.startsWith("/runs/")) && navItemActive,
            )}
          >
            <Home className="h-4 w-4 shrink-0" />
            Runs
          </Link>
          <Link
            href="/models"
            className={cn(
              navItem,
              (pathname === "/models" || pathname.startsWith("/models/")) && navItemActive,
            )}
          >
            <BrainCircuit className="h-4 w-4 shrink-0" />
            Models
          </Link>
        </nav>
      )}
    </aside>
  );
}
