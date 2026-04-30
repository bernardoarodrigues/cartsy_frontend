"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { type DatasetGraphResponse, type DatasetNode } from "@/lib/api";

function DotNode({ data }: NodeProps<{ raw: DatasetNode }>) {
  const isSingleton = data.raw.is_singleton;
  return (
    <div
      style={{
        width: NODE_SIZE,
        height: NODE_SIZE,
        borderRadius: 999,
        background: isSingleton ? "var(--muted)" : "var(--primary)",
        border: isSingleton ? "1px solid var(--border)" : "none",
      }}
    />
  );
}

const NODE_TYPES = { dot: DotNode };
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const NODE_SIZE = 14;
const NODE_SPACING = NODE_SIZE * 1.25; // distance between adjacent member centres
const GROUP_PADDING = 18;
const SINGLETON_RING_GAP = 120;
const PHI = Math.PI * (3 - Math.sqrt(5));

function clusterRadius(size: number): number {
  // Disk that fits `size` nodes via sunflower packing.
  return NODE_SPACING * Math.sqrt(Math.max(1, size));
}

function layoutClusters(
  groups: { id: string; members: DatasetNode[] }[],
  singletons: DatasetNode[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (groups.length === 0 && singletons.length === 0) return positions;

  // Per-group disk radius, including padding to keep clusters from touching.
  const radii = groups.map((g) => clusterRadius(g.members.length) + GROUP_PADDING);
  const maxRadius = Math.max(...radii, 30);
  const spacing = 2 * maxRadius;

  let outerExtent = 0;

  groups.forEach((group, i) => {
    const r = spacing * Math.sqrt(i + 1);
    const theta = (i + 1) * PHI;
    const cx = Math.cos(theta) * r;
    const cy = Math.sin(theta) * r;
    outerExtent = Math.max(outerExtent, r + radii[i]);

    const m = group.members;
    if (m.length === 1) {
      positions.set(m[0].id, { x: cx, y: cy });
    } else {
      // Sunflower disk packing — fills the interior, not just a ring.
      m.forEach((member, k) => {
        const innerR = NODE_SPACING * Math.sqrt(k + 0.5);
        const a = (k + 1) * PHI;
        positions.set(member.id, {
          x: cx + Math.cos(a) * innerR,
          y: cy + Math.sin(a) * innerR,
        });
      });
    }
  });

  // Singletons on an outer ring (or rings if many).
  if (singletons.length > 0) {
    const ringStart = outerExtent + SINGLETON_RING_GAP;
    const perRing = Math.max(60, Math.floor(2 * Math.PI * ringStart / (NODE_SIZE * 2.2)));
    singletons.forEach((s, i) => {
      const ringIdx = Math.floor(i / perRing);
      const radius = ringStart + ringIdx * (NODE_SIZE * 3);
      const idxInRing = i % perRing;
      const a = (idxInRing / perRing) * Math.PI * 2;
      positions.set(s.id, {
        x: Math.cos(a) * radius,
        y: Math.sin(a) * radius,
      });
    });
  }

  return positions;
}

export function DatasetGraph({ data, runId }: { data: DatasetGraphResponse; runId: string }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<DatasetNode | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const { nodes, edges } = useMemo(() => {
    // Group members
    const grouped = new Map<string, DatasetNode[]>();
    const singletons: DatasetNode[] = [];
    for (const n of data.nodes) {
      if (n.is_singleton) {
        singletons.push(n);
      } else {
        const arr = grouped.get(n.dedupe_id) ?? [];
        arr.push(n);
        grouped.set(n.dedupe_id, arr);
      }
    }
    const groupList = Array.from(grouped.entries())
      .map(([id, members]) => ({ id, members }))
      .sort((a, b) => b.members.length - a.members.length);

    const positions = layoutClusters(groupList, singletons);

    const flowNodes: Node[] = data.nodes.map((node) => {
      const p = positions.get(node.id) ?? { x: 0, y: 0 };
      return {
        id: node.id,
        type: "dot",
        position: p,
        data: { raw: node },
        draggable: false,
        selectable: false,
        style: { cursor: "pointer" },
      };
    });

    return { nodes: flowNodes, edges: [] as Edge[] };
  }, [data]);

  const onNodeMouseEnter: NodeMouseHandler = (event, node) => {
    setHovered((node.data as { raw: DatasetNode }).raw);
    setHoverPos({ x: event.clientX, y: event.clientY });
  };
  const onNodeMouseLeave = () => {
    setHovered(null);
    setHoverPos(null);
  };
  const onNodeClick: NodeMouseHandler = (_event, node) => {
    const raw = (node.data as { raw: DatasetNode }).raw;
    if (raw?.dedupe_id) router.push(`/runs/${runId}/groups/${raw.dedupe_id}`);
  };

  return (
    <div className="relative h-[720px] rounded-lg border bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.05}
        maxZoom={4}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onNodeClick={onNodeClick}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={32} size={1} color="var(--border)" />
        <Controls showInteractive={false} />
      </ReactFlow>
      {hovered && hoverPos && (
        <div
          className="pointer-events-none fixed z-50"
          style={{ left: hoverPos.x + 16, top: hoverPos.y + 16 }}
        >
          <Card className="w-80 shadow-lg p-3 space-y-1.5">
            <div className="font-medium line-clamp-2 text-sm">{hovered.name || hovered.source_id}</div>
            <div className="flex gap-1.5 flex-wrap">
              {hovered.retailer && <Badge variant="outline" className="text-xs">{hovered.retailer}</Badge>}
              {hovered.brand && <Badge variant="secondary" className="text-xs">{hovered.brand}</Badge>}
              <Badge variant={hovered.is_singleton ? "outline" : "default"} className="text-xs">
                {hovered.is_singleton ? "singleton" : `group of ${hovered.group_size}`}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground pt-1">
              <span>Source ID</span><span className="font-mono text-foreground">{hovered.source_id}</span>
              <span>Dedupe ID</span><span className="font-mono text-foreground truncate">{hovered.dedupe_id}</span>
              {hovered.price_cents && (<><span>Price</span><span className="text-foreground">{(Number(hovered.price_cents) / 100).toFixed(2)}</span></>)}
              <span>Decision</span><span className="text-foreground">{hovered.decision}</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
