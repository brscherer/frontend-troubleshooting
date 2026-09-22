import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import type { ComponentRef } from '../lib/graph';
import { Submitted } from './Submitted';
import { Welcome } from './Welcome';

export type NodeComponentProps = {
  node: { id: string; title: string; props?: Record<string, unknown> };
  onNext: () => void;
};

const Loading = () => <div className="ds-card ds-skeleton" aria-busy="true" />;

/**
 * Remote nodes are client-only: mount after hydration, then lazy-load the
 * federated module. Remote modules must be listed statically so webpack can
 * wire the federated imports.
 */
function remote(load: () => Promise<{ default: ComponentType<NodeComponentProps> }>) {
  const Lazy = lazy(load);
  function RemoteNode(props: NodeComponentProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return <Loading />;
    return (
      <Suspense fallback={<Loading />}>
        <Lazy {...props} />
      </Suspense>
    );
  }
  return RemoteNode;
}

const REGISTRY: Record<string, ComponentType<NodeComponentProps>> = {
  'host:Welcome': Welcome,
  'host:Submitted': Submitted,
  'intake:./ApplicantForm': remote(() => import('intake/ApplicantForm')),
  'intake:./EmploymentForm': remote(() => import('intake/EmploymentForm')),
  'intake:./DocumentsForm': remote(() => import('intake/DocumentsForm')),
  'intake:./IncomeForm': remote(() => import('intake/IncomeForm')),
  'intake:./CoSignerForm': remote(() => import('intake/CoSignerForm')),
  'offers:./OfferNode': remote(() => import('offers/OfferNode')),
  'offers:./ReviewNode': remote(() => import('offers/ReviewNode')),
};

function UnknownNode({ node, componentRef }: NodeComponentProps & { componentRef: ComponentRef }) {
  useEffect(() => {
    // Graceful for the user, loud for us: the graph references UI no client build knows about.
    console.error(`[sdui] node "${node.id}" references unknown component "${componentRef.remote}:${componentRef.module}"`);
  }, [node.id, componentRef]);
  return (
    <div className="ds-card ds-stack" role="alert">
      <h2>We can't show this step right now</h2>
      <p className="ds-muted">Our team has been notified. Please try again later or contact support.</p>
    </div>
  );
}

const unknownCache = new Map<string, ComponentType<NodeComponentProps>>();

export function resolveComponent(ref: ComponentRef): ComponentType<NodeComponentProps> {
  const key = `${ref.remote}:${ref.module}`;
  if (REGISTRY[key]) return REGISTRY[key];
  // Stable component type per ref, so the placeholder doesn't remount on every render.
  if (!unknownCache.has(key)) {
    unknownCache.set(key, function Unknown(props: NodeComponentProps) {
      return <UnknownNode {...props} componentRef={ref} />;
    });
  }
  return unknownCache.get(key)!;
}
