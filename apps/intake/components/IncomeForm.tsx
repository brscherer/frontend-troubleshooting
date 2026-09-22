import { formatMoney, useSdui } from '@acme/sdui-context';
import { Field } from './Field';
import type { NodeProps } from './types';
import { useFormStep } from './useFormStep';

export default function IncomeForm({ node, onNext }: NodeProps) {
  const { number, submit } = useFormStep(onNext);
  const ctx = useSdui();
  const threshold = Number(node.props?.threshold ?? 0);
  return (
    <form className="ds-card ds-stack" onSubmit={submit}>
      <Field
        label="Annual gross income"
        hint={`Below ${formatMoney(threshold, ctx)} we will ask for a co-signer.`}
      >
        <input className="ds-input" required min={0} step={1000} {...number('income')} />
      </Field>
      <button className="ds-button" type="submit">Check eligibility</button>
    </form>
  );
}
