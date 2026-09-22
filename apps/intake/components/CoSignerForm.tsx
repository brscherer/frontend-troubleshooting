import { Field } from './Field';
import type { NodeProps } from './types';
import { useFormStep } from './useFormStep';

export default function CoSignerForm({ onNext }: NodeProps) {
  const { text, number, submit } = useFormStep(onNext);
  return (
    <form className="ds-card ds-stack" onSubmit={submit}>
      <p>Your income is below our threshold. Add a co-signer to continue.</p>
      <Field label="Co-signer name">
        <input className="ds-input" required {...text('coSignerName')} />
      </Field>
      <Field label="Co-signer annual income">
        <input className="ds-input" required min={0} step={1000} {...number('coSignerIncome')} />
      </Field>
      <button className="ds-button" type="submit">Re-check eligibility</button>
    </form>
  );
}
