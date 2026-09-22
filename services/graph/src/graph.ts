/**
 * The loan application graph.
 *
 * - "screen" nodes render a component (host-native or from a federated remote).
 * - "decision" nodes render nothing: the host evaluates their edges and
 *   immediately follows the first one that matches.
 *
 * Edges are evaluated in order; an edge without `when` always matches.
 */
export type Condition = {
  field: string;
  op: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'present' | 'absent';
  value?: string | number | boolean;
};

/** `likely` marks the branch the progress bar shows before the answer is known. */
export type Edge = { to: string; when?: Condition; likely?: boolean };

export type ComponentRef = { remote: 'host' | 'intake' | 'offers'; module: string };

export type GraphNode =
  | { id: string; kind: 'screen'; title: string; component: ComponentRef; props?: Record<string, unknown>; edges: Edge[] }
  | { id: string; kind: 'decision'; title: string; edges: Edge[] };

export type Graph = { id: string; version: string; entry: string; nodes: Record<string, GraphNode> };

export const INCOME_THRESHOLD = 30000;

export function buildLoanGraph(bugs: Set<string>): Graph {
  const nodes: GraphNode[] = [
    {
      id: 'start',
      kind: 'screen',
      title: 'Welcome',
      component: { remote: 'host', module: 'Welcome' },
      edges: [{ to: 'applicant' }],
    },
    {
      id: 'applicant',
      kind: 'screen',
      title: 'About you',
      component: { remote: 'intake', module: './ApplicantForm' },
      edges: [{ to: 'employment' }],
    },
    {
      id: 'employment',
      kind: 'screen',
      title: 'Employment',
      component: { remote: 'intake', module: './EmploymentForm' },
      edges: [
        { to: 'documents', when: { field: 'employmentType', op: 'eq', value: 'self-employed' } },
        { to: 'income', likely: true },
      ],
    },
    {
      id: 'documents',
      kind: 'screen',
      title: 'Tax documents',
      component: bugs.has('unknown-node')
        ? // Risk team shipped the new verification screen in the graph before the remote exposed it.
          { remote: 'intake', module: './IncomeVerification' }
        : { remote: 'intake', module: './DocumentsForm' },
      edges: [{ to: 'income' }],
    },
    {
      id: 'income',
      kind: 'screen',
      title: 'Income',
      component: { remote: 'intake', module: './IncomeForm' },
      props: { threshold: INCOME_THRESHOLD },
      edges: [{ to: 'eligibility' }],
    },
    {
      // Owned by the Risk team.
      id: 'eligibility',
      kind: 'decision',
      title: 'Eligibility',
      edges: [
        {
          to: 'offer',
          when: { field: 'totalIncome', op: bugs.has('graph-cycle') ? 'gt' : 'gte', value: INCOME_THRESHOLD },
          likely: true,
        },
        { to: 'affordability' },
      ],
    },
    {
      // Owned by the Growth team: "re-check eligibility when the applicant is right at the limit".
      id: 'affordability',
      kind: 'decision',
      title: 'Affordability',
      edges: [
        { to: 'eligibility', when: { field: 'totalIncome', op: 'gte', value: INCOME_THRESHOLD } },
        { to: 'co-signer' },
      ],
    },
    {
      id: 'co-signer',
      kind: 'screen',
      title: 'Co-signer',
      component: { remote: 'intake', module: './CoSignerForm' },
      edges: [{ to: 'eligibility' }],
    },
    {
      id: 'offer',
      kind: 'screen',
      title: 'Your offer',
      component: { remote: 'offers', module: './OfferNode' },
      props: { defaultAmount: 25000, terms: [24, 36, 60, 84] },
      edges: [{ to: 'review' }],
    },
    {
      id: 'review',
      kind: 'screen',
      title: 'Review & submit',
      component: { remote: 'offers', module: './ReviewNode' },
      edges: [{ to: 'submitted' }],
    },
    {
      id: 'submitted',
      kind: 'screen',
      title: 'Submitted',
      component: { remote: 'host', module: 'Submitted' },
      edges: [],
    },
  ];

  return {
    id: 'loan',
    version: '2026.09.1',
    entry: 'start',
    nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
  };
}
