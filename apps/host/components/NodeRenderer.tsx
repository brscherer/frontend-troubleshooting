import type { ScreenNode } from '../lib/graph';
import { NodeErrorBoundary } from './NodeErrorBoundary';
import { resolveComponent } from './registry';

export function NodeRenderer({ node, onNext }: { node: ScreenNode; onNext: () => void }) {
  const Component = resolveComponent(node.component);
  return (
    <NodeErrorBoundary nodeId={node.id}>
      <Component node={{ id: node.id, title: node.title, props: node.props }} onNext={onNext} />
    </NodeErrorBoundary>
  );
}
