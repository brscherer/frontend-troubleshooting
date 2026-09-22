import { Field } from './Field';
import type { NodeProps } from './types';
import { useFormStep } from './useFormStep';

export default function DocumentsForm({ onNext }: NodeProps) {
  const { application, setField, submit } = useFormStep(onNext);
  return (
    <form className="ds-card ds-stack" onSubmit={submit}>
      <p>Self-employed applicants need their last tax return.</p>
      <Field label="Tax return (PDF)" hint={application.taxReturn ? `Selected: ${application.taxReturn}` : undefined}>
        <input
          className="ds-input"
          type="file"
          accept="application/pdf"
          onChange={(e) => setField('taxReturn', e.target.files?.[0]?.name)}
        />
      </Field>
      <button className="ds-button" type="submit">Continue</button>
    </form>
  );
}
