import { Field } from './Field';
import type { NodeProps } from './types';
import { useFormStep } from './useFormStep';

export default function EmploymentForm({ onNext }: NodeProps) {
  const { text, submit } = useFormStep(onNext);
  return (
    <form className="ds-card ds-stack" onSubmit={submit}>
      <Field label="Employment type">
        <select className="ds-input" required {...text('employmentType')}>
          <option value="" disabled>Choose one</option>
          <option value="employed">Employed</option>
          <option value="self-employed">Self-employed</option>
          <option value="retired">Retired</option>
        </select>
      </Field>
      <Field label="Employer or business name">
        <input className="ds-input" {...text('employer')} />
      </Field>
      <button className="ds-button" type="submit">Continue</button>
    </form>
  );
}
