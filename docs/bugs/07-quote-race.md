# 07 · Race condition: the slow quote wins

Flag: `quote-race` · Profile: dev or prod · Fix branch: `fix/07-quote-race`

## Symptom
The user types a new amount and the offer shows a quote for a **previous** amount. The input says 30,000, the card says `15.000,00 €`. It's intermittent, and QA "can't reproduce" on fast networks.

## Reproduce
`?bugs=quote-race`, on the offer step change the amount to `15000`, then quickly to `30000`.

## Investigation path
1. Network → filter `quotes`. Two `POST`s: the 15,000 one takes ~1.5 s, the 30,000 one ~150 ms. The **slow one finishes last**.
2. Open the requests' Payload/Response: the card shows the last *response*, not the last *request*.
3. `OfferNode.tsx`: the effect fires a fetch per `[amount, termMonths]` with no cancellation and no staleness check, so `setQuote` is called by whoever returns last.
4. Throttle (Network → Slow 4G) to make it reproduce on any input.

## Root cause
Out-of-order async responses and an effect without cleanup.

## Fix
```diff
 useEffect(() => {
+  const controller = new AbortController();
-  fetchQuote(amount, termMonths)
+  fetchQuote(amount, termMonths, controller.signal)
     .then(setQuote)
-    .catch((e) => setError(String(e)));
+    .catch((e) => { if (e.name !== 'AbortError') setError(String(e)); });
+  return () => controller.abort();
 }, [amount, termMonths]);
```

## Takeaways
- Every async effect needs an answer to "what if a newer run finishes first?"
- The Network waterfall shows *order* of completion, which is exactly the evidence here.
