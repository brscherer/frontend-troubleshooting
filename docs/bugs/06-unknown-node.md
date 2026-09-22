# 06 · Unknown node type: the blank step

Flag: `unknown-node` · Profile: dev or prod · Fix branch: `fix/06-unknown-node`

## Symptom
Self-employed applicants reach **Tax documents** and see the title, then nothing: no form, no button, no error. They're stuck.

## Reproduce
`?bugs=unknown-node`, choose **Self-employed**, continue.

## Investigation path
1. Elements: `<h1>Tax documents</h1>` and then nothing where the card should be.
2. React DevTools: `NodeRenderer` renders an anonymous component that returns `null`.
3. Network: `GET /api/graph/graphs/loan` → `documents.component = { remote: 'intake', module: './IncomeVerification' }`.
4. `components/registry.tsx`: there's no key `intake:./IncomeVerification`, and the lookup falls back to `() => null` ("graceful degradation").
5. `curl localhost:3101/_next/static/chunks/remoteEntry.js | grep IncomeVerification` finds nothing. The remote doesn't expose it either.

## Root cause
The server-driven graph shipped a reference to a component that no client build knows about. The "never break the page" fallback turned it into an invisible dead end.

## Fix
The fallback renders a visible, actionable placeholder and reports the unknown ref (console.error + telemetry), so the next one gets caught on the first user. Longer term: the graph service validates component refs against the remotes' `mf-manifest.json` before publishing.

## Takeaways
- Swallowed errors are worse than crashes: a crash gets reported, a blank area doesn't.
- In SDUI, the server can deploy UI the client can't render. Treat that as a contract and test it.
