/** Standalone page so the remote has something to serve. The real app is the host on :3100. */
export default function Preview() {
  return (
    <main style={{ maxWidth: 560, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>offers remote</h1>
      <p>Exposes: OfferNode, ReviewNode. Open the host at http://localhost:3100.</p>
    </main>
  );
}
