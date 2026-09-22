import { readCookie } from '@acme/bugs';
import { useSdui } from '@acme/sdui-context';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import type { Session } from '../_app';
import { Layout } from '../../components/Layout';
import { NodeRenderer } from '../../components/NodeRenderer';
import { Stepper } from '../../components/Stepper';
import { fetchGraph, plannedPath, resolveNext, type Graph, type ScreenNode } from '../../lib/graph';

type Props = { graph: Graph; node: ScreenNode; session: Session };

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, req }) => {
  const graph = await fetchGraph(decodeURIComponent(readCookie(req.headers.cookie) ?? ''));
  const node = graph.nodes[String(params?.nodeId)];
  if (!node || node.kind !== 'screen') {
    return { redirect: { destination: `/apply/${graph.entry}`, permanent: false } };
  }
  // Would come from the auth session in real life.
  const session: Session = { locale: 'de-DE', currency: 'EUR', user: { id: 'u_1042', name: 'Ana' } };
  return { props: { graph, node, session } };
};

export default function ApplyPage({ graph, node }: Props) {
  const router = useRouter();
  const { application } = useSdui();
  const steps = plannedPath(graph, application);

  const onNext = () => {
    const next = resolveNext(graph, node.id, application);
    if (next) void router.push(`/apply/${next.id}`);
  };

  return (
    <Layout>
      <Stepper steps={steps} currentId={node.id} />
      <h1>{node.title}</h1>
      <NodeRenderer key={node.id} node={node} onNext={onNext} />
      <footer className="ds-muted ds-footnote">
        graph {graph.id}@{graph.version} · node <code>{node.id}</code>
      </footer>
    </Layout>
  );
}
