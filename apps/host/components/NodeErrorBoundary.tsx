import { Component, type ReactNode } from 'react';

type Props = { nodeId: string; children: ReactNode };
type State = { error: Error | null };

export class NodeErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`[sdui] node "${this.props.nodeId}" crashed`, error);
  }

  componentDidUpdate(prev: Props) {
    if (prev.nodeId !== this.props.nodeId && this.state.error) this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="ds-card ds-stack" role="alert">
          <h2>This step is temporarily unavailable</h2>
          <p className="ds-muted">Please try again in a few minutes.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
