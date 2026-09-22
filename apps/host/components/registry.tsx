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

export function resolveComponent(ref: ComponentRef): ComponentType<NodeComponentProps> {
  // Graceful degradation: never break the page because of one node.
  return REGISTRY[`${ref.remote}:${ref.module}`] ?? (() => null);
}
