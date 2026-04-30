const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

function qs(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

export type RunSummary = {
  run_id: string;
  path: string;
  input_records: number | null;
  final_unique_products: number | null;
  duplicate_records_grouped: number | null;
  elapsed_seconds: number | null;
  openai_cost_usd: number | null;
};

export type RunsResponse = { runs: RunSummary[] };

export type SummaryReport = {
  run_id?: string;
  input_records?: number;
  normalized_records?: number;
  candidate_pairs_scored?: number;
  candidate_pairs_kept?: number;
  merged_pairs?: number;
  near_miss_pairs?: number;
  threshold_sensitivity?: Record<string, number>;
  final_unique_products?: number;
  grouped_records?: number;
  duplicate_records_grouped?: number;
  reduction_ratio?: number;
  confidence_distribution?: Record<string, number>;
  decision_reason_counts?: { merge?: Record<string, number>; no_merge?: Record<string, number> };
  top_quality_flags?: Record<string, number>;
  blocking?: Record<string, number>;
  clustering?: Record<string, number>;
  largest_groups?: Array<{
    dedupe_id: string;
    canonical_name: string;
    num_offers: number;
    retailers: string[];
    cluster_confidence: number;
    source_ids: string[];
  }>;
  metrics?: { openai?: { total_estimated_cost_usd?: number } };
  elapsed_seconds?: number;
  [k: string]: unknown;
};

export type ProductRow = {
  source_id: string;
  dedupe_id: string;
  retailer: string;
  name_raw: string;
  brand_raw: string;
  price_cents: string;
  sku: string;
  dimension: string;
  canonical_name: string;
  canonical_brand: string;
  cluster_confidence: string;
  decision: string;
  explanation: string;
};

export type ProductsResponse = {
  total: number;
  limit: number;
  offset: number;
  products: ProductRow[];
};

export type Group = {
  dedupe_id: string;
  source_ids: string[];
  canonical_name: string;
  canonical_brand: string;
  canonical_category?: string;
  cluster_confidence: number;
  num_offers: number;
  retailers: string[];
  price_min_cents?: number;
  price_max_cents?: number;
  merge_reasons?: string[];
};

export type GroupsResponse = {
  total: number;
  limit: number;
  offset: number;
  groups: Group[];
};

export type GroupOffer = {
  source_id: string;
  retailer: string;
  name: string;
  brand: string;
  price_cents: string;
  sku: string;
  dimension: string;
};

export type GroupDetail = Group & { offers: GroupOffer[] };

export type GraphNode = {
  id: string;
  source_id: string;
  name: string;
  brand: string;
  retailer: string;
  price_cents: string;
  sku: string;
  dimension: string;
  canonical_name: string;
  canonical_brand: string;
  decision: string;
  cluster_confidence: string;
};

export type GraphEdge = {
  source: string;
  target: string;
  score: number;
  decision: string;
  explanation: string;
  feature_scores: string;
};

export type GraphResponse = {
  dedupe_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type DatasetNode = {
  id: string;
  source_id: string;
  dedupe_id: string;
  group_size: number;
  name: string;
  brand: string;
  retailer: string;
  price_cents: string;
  decision: string;
  is_singleton: boolean;
};

export type DatasetEdge = { source: string; target: string; score: number };

export type DatasetGraphResponse = {
  nodes: DatasetNode[];
  edges: DatasetEdge[];
  stats: {
    groups_returned: number;
    groups_truncated: boolean;
    singletons_total: number;
    singletons_returned: number;
    node_count: number;
    edge_count: number;
  };
};

export type CandidatePair = {
  product_a_id: string;
  product_b_id: string;
  score: number;
  decision: string;
  explanation: string;
  blocking_keys?: string;
  feature_scores?: string;
};

export type PairsResponse = {
  total: number;
  limit: number;
  offset: number;
  pairs: CandidatePair[];
};

export type NearMissPair = {
  product_a_id: string;
  product_b_id: string;
  score: string;
  decision: string;
  name_a: string;
  name_b: string;
  brand_a: string;
  brand_b: string;
  retailer_a: string;
  retailer_b: string;
  price_a: string;
  price_b: string;
  dimension_a: string;
  dimension_b: string;
  explanation: string;
};

export type NearMissResponse = {
  total: number;
  limit: number;
  offset: number;
  pairs: NearMissPair[];
};

export type SearchResult = {
  score: number;
  source_id: string;
  dedupe_id: string;
  retailer: string;
  name: string;
  brand: string;
  price_cents: string;
  cluster_confidence: string;
  decision: string;
  search_backend?: string;
  retrieval_evidence?: string[];
};

export type SearchResponse = {
  run_id: string;
  query: string;
  backend: string;
  results: SearchResult[];
};

export type ArtifactSearchResponse = {
  run_id: string;
  query: string;
  type: string | null;
  results: Array<Record<string, unknown>>;
};

export type ExplainResponse = {
  found: boolean;
  product_a: Record<string, string>;
  product_b: Record<string, string>;
  pair?: Record<string, unknown>;
  message?: string;
};

export const api = {
  health: () => request<{ ok: boolean; runs_root: string }>("/health"),
  listRuns: () => request<RunsResponse>("/runs"),
  summary: (runId: string) => request<SummaryReport>(`/runs/${runId}/summary`),
  products: (runId: string, params: Record<string, unknown> = {}) =>
    request<ProductsResponse>(`/runs/${runId}/products${qs(params)}`),
  groups: (runId: string, params: Record<string, unknown> = {}) =>
    request<GroupsResponse>(`/runs/${runId}/groups${qs(params)}`),
  group: (runId: string, dedupeId: string) =>
    request<GroupDetail>(`/runs/${runId}/groups/${dedupeId}`),
  graph: (runId: string, dedupeId: string) =>
    request<GraphResponse>(`/runs/${runId}/groups/${dedupeId}/graph`),
  datasetGraph: (runId: string, params: Record<string, unknown> = {}) =>
    request<DatasetGraphResponse>(`/runs/${runId}/dataset-graph${qs(params)}`),
  pairs: (runId: string, params: Record<string, unknown> = {}) =>
    request<PairsResponse>(`/runs/${runId}/pairs${qs(params)}`),
  nearMisses: (runId: string, params: Record<string, unknown> = {}) =>
    request<NearMissResponse>(`/runs/${runId}/near-misses${qs(params)}`),
  search: (runId: string, params: Record<string, unknown>) =>
    request<SearchResponse>(`/runs/${runId}/search${qs(params)}`),
  artifactSearch: (runId: string, params: Record<string, unknown>) =>
    request<ArtifactSearchResponse>(`/runs/${runId}/artifact-search${qs(params)}`),
  explain: (runId: string, source_id_a: string, source_id_b: string) =>
    request<ExplainResponse>(`/runs/${runId}/explain${qs({ source_id_a, source_id_b })}`),
};

export function formatCents(value: string | number | null | undefined): string {
  if (value === "" || value === null || value === undefined) return "—";
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num / 100);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPct(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}
