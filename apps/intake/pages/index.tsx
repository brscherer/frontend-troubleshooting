import dynamic from 'next/dynamic';

const ApplicantForm = dynamic(() => import('../components/ApplicantForm'), { ssr: false });

/** Standalone preview of the intake remote. The real app is the host on :3100. */
export default function Preview() {
  return (
    <main style={{ maxWidth: 560, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>intake remote</h1>
      <p>Exposes: ApplicantForm, EmploymentForm, DocumentsForm, IncomeForm, CoSignerForm.</p>
      <ApplicantForm node={{ id: 'applicant', title: 'About you' }} onNext={() => alert('next')} />
    </main>
  );
}
