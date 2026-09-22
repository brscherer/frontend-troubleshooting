import { DateInput } from '@acme/date-input';
import { formatMoney, useSdui } from '@acme/sdui-context';
import { Field } from './Field';
import type { NodeProps } from './types';
import { useFormStep } from './useFormStep';

export default function ApplicantForm({ onNext }: NodeProps) {
  const ctx = useSdui();
  const { application, setField, text, number, submit } = useFormStep(onNext);
  return (
    <form className="ds-card ds-stack" onSubmit={submit}>
      <Field label="Full name">
        <input className="ds-input" required autoComplete="name" {...text('fullName')} />
      </Field>
      <Field label="Email">
        <input className="ds-input" required type="email" autoComplete="email" {...text('email')} />
      </Field>
      <Field label="Date of birth">
        <DateInput
          value={application.dateOfBirth as string | undefined}
          onChange={(iso) => setField('dateOfBirth', iso)}
          max={new Date().toISOString().slice(0, 10)}
        />
      </Field>
      <Field label="How much do you need?" hint={`Between ${formatMoney(5000, ctx)} and ${formatMoney(75000, ctx)}`}>
        <input className="ds-input" required min={5000} max={75000} step={500} {...number('amount')} />
      </Field>
      <button className="ds-button" type="submit">Continue</button>
    </form>
  );
}
