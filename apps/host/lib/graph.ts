import type { LoanApplication } from '@acme/sdui-context';

// Mirror of services/graph/src/graph.ts (the wire contract).
export type Condition = {
  field: string;
  op: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'present' | 'absent';
  value?: string | number | boolean;
};
/** `likely` marks the branch the progress bar shows before the answer is known. */
export type Edge = { to: string; when?: Condition; likely?: boolean };
export type ComponentRef = { remote: 'host' | 'intake' | 'offers'; module: string };
export type ScreenNode = {
  id: string;
  kind: 'screen';
  title: string;
  component: ComponentRef;
  props?: Record<string, unknown>;
  edges: Edge[];
};
export type DecisionNode = { id: string; kind: 'decision'; title: string; edges: Edge[] };
export type GraphNode = ScreenNode | DecisionNode;
export type Graph = { id: string; version: string; entry: string; nodes: Record<string, GraphNode> };

export const GRAPH_URL = process.env.GRAPH_URL ?? 'http://localhost:4000';

export async function fetchGraph(bugsHeader: string): Promise<Graph> {
  const res = await fetch(`${GRAPH_URL}/graphs/loan`, { headers: { 'x-bugs': bugsHeader } });
  if (!res.ok) throw new Error(`graph-service responded ${res.status}`);
  return res.json();
}

/** Fields computed from the raw answers, available to edge conditions. */
export function facts(app: LoanApplication): LoanApplication {
  const income = Number(app.income ?? NaN);
  const coSignerIncome = Number(app.coSignerIncome ?? 0);
  return { ...app, totalIncome: Number.isNaN(income) ? undefined : income + coSignerIncome };
}

/** `undefined` = the answer isn't known yet. */
export function evaluate(cond: Condition, f: LoanApplication): boolean | undefined {
  const v = f[cond.field];
  if (cond.op === 'present') return v !== undefined && v !== '';
  if (cond.op === 'absent') return v === undefined || v === '';
  if (v === undefined || v === '') return undefined;
  switch (cond.op) {
    case 'eq': return v === cond.value;
    case 'neq': return v !== cond.value;
    case 'lt': return Number(v) < Number(cond.value);
    case 'lte': return Number(v) <= Number(cond.value);
    case 'gt': return Number(v) > Number(cond.value);
    case 'gte': return Number(v) >= Number(cond.value);
  }
}

function pickEdge(node: GraphNode, f: LoanApplication): Edge | undefined {
  return node.edges.find((e) => !e.when || evaluate(e.when, f) === true);
}

/**
 * Where does "Continue" go from `fromId`? Follows the first matching edge and
 * walks through decision nodes until it lands on a screen.
 */
export function resolveNext(graph: Graph, fromId: string, app: LoanApplication): ScreenNode | undefined {
  const f = facts(app);
  const visited: string[] = [];
  let edge = pickEdge(graph.nodes[fromId], f);
  while (edge) {
    const target = graph.nodes[edge.to];
    if (!target) return undefined;
    if (target.kind === 'screen') return target;
    // The graph comes from the server: never trust it to be acyclic.
    if (visited.includes(target.id)) {
      throw new Error(`Decision cycle in graph ${graph.id}@${graph.version}: ${[...visited, target.id].join(' → ')}`);
    }
    visited.push(target.id);
    edge = pickEdge(target, f);
  }
  return undefined;
}

/**
 * The steps shown in the progress bar: walk from the entry using what we know.
 * When an answer is unknown, show the branch marked `likely`.
 */
export function plannedPath(graph: Graph, app: LoanApplication): ScreenNode[] {
  const f = facts(app);
  const path: ScreenNode[] = [];
  const seen = new Set<string>();
  let id: string | undefined = graph.entry;
  while (id && !seen.has(id)) {
    seen.add(id);
    const node: GraphNode | undefined = graph.nodes[id];
    if (!node) break;
    if (node.kind === 'screen') path.push(node);
    const known: Edge | undefined = node.edges.find((e) => !e.when || evaluate(e.when, f) === true);
    const unknown = node.edges.some((e) => e.when && evaluate(e.when, f) === undefined);
    id = (unknown ? node.edges.find((e) => e.likely) ?? known : known)?.to;
  }
  return path;
}
