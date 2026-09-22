# 02 · Hydration mismatch: the progress bar the server never saw

Flag: `hydration-path` · Profile: dev (loud) and prod (quiet) · Fix branch: `fix/02-hydration-path`

## Symptom
Self-employed applicants who **reload** mid-application see the step bar flicker. In dev, Next shows *"Hydration failed because the initial UI does not match what was rendered on the server"*. In prod the console only shows `Minified React error #418` / `#423`, and React throws away the server HTML and re-renders the whole page on the client (slower LCP, lost scroll position).

## Reproduce
1. `?bugs=hydration-path`, pick **Self-employed** on the Employment step, continue to Income.
2. Reload `/apply/income`.

## Investigation path
1. Read the diff React prints (dev): `Text content did not match. Server: "Income" Client: "Tax documents"` in `<li>` inside `Stepper`.
2. Ask: *which input to `Stepper` differs between server and client?* `plannedPath(graph, application)`. The graph is identical (it comes from SSR props). `application` isn't.
3. `pages/_app.tsx`: the `useState` initializer reads `sessionStorage` when `typeof window !== 'undefined'`. The server renders with `{}`, while the first client render already has the draft, so the graph walk takes the `documents` branch.
4. Prod: decode `#418` at react.dev/errors/418. Performance panel shows a second full render right after hydration.

## Root cause
Render output depended on browser-only state during the hydration render. Branchy SDUI graphs make this worse: one answer changes the *shape* of the page, not just a text node.

## Fix
Restore client-only state **after** hydration (in an effect), or persist the draft somewhere the server can read (cookie / server session) so both sides walk the same path.

```diff
-  const [application, setApplication] = useState(() =>
-    typeof window !== 'undefined' ? loadDraft() : {});
+  const [application, setApplication] = useState({});
+  useEffect(() => setApplication(loadDraft()), []);
```

## Takeaways
- `typeof window` inside render is a hydration bug waiting for the right data.
- In prod, hydration errors are *recoverable*: no crash, just a silent full client re-render. Watch for `#418/#423` in RUM/Sentry.
