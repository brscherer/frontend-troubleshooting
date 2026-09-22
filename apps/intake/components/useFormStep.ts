import { useSdui } from '@acme/sdui-context';
import type { FormEvent } from 'react';

/** Shared helper for intake steps: bind inputs to the application draft in the host. */
export function useFormStep(onNext: () => void) {
  const { application, setField } = useSdui();

  const text = (field: string) => ({
    name: field,
    value: (application[field] as string | undefined) ?? '',
    onChange: (e: { target: { value: string } }) => setField(field, e.target.value),
  });

  const number = (field: string) => ({
    name: field,
    type: 'number',
    inputMode: 'numeric' as const,
    value: application[field] === undefined ? '' : String(application[field]),
    onChange: (e: { target: { value: string } }) =>
      setField(field, e.target.value === '' ? undefined : Number(e.target.value)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return { application, setField, text, number, submit };
}
