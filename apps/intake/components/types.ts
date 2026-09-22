export type NodeProps = {
  node: { id: string; title: string; props?: Record<string, unknown> };
  onNext: () => void;
};
