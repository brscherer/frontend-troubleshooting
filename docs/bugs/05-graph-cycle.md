# 05 · Graph cycle: the tab freezes at exactly 30,000

Flag: `graph-cycle` · Profile: dev or prod · Fix branch: `fix/05-graph-cycle`

## Symptom
"Check eligibility" freezes the tab. It happens only for some users ("can't reproduce" with 45,000 or 25,000). Chrome eventually offers *Page unresponsive*.

## Reproduce
`?bugs=graph-cycle`, enter an annual income of exactly **30000**, click **Check eligibility**.

## Investigation path
1. The tab is frozen, so the console can't help. Open DevTools **before** clicking, click, then press **Pause** (F8) in Sources.
2. The call stack is `resolveNext` → `pickEdge` → `evaluate`, looping forever in `while (edge)`.
3. Add a conditional breakpoint / logpoint in the loop: `target.id`. It alternates `eligibility → affordability → eligibility → …`.
4. `GET /api/graph/graphs/loan`: `eligibility` sends to `offer` when `totalIncome > 30000` (**gt**), and `affordability` sends back to `eligibility` when `totalIncome >= 30000` (**gte**). At exactly 30,000 neither lets go.
5. Performance panel (record, click) shows one long task that never ends: that's the flame-chart version of the same fact.

## Root cause
Two decision nodes owned by two teams disagree on a boundary (`>` vs `>=`). The graph has a cycle through decision nodes only, and the client resolver trusts the graph blindly.

## Fix
- Data: `eligibility` uses `gte`.
- Defense: the resolver keeps a `visited` set / hop limit and throws a descriptive error (`Decision cycle: eligibility → affordability → eligibility`), which the error boundary reports.
- Better still: validate graphs for decision-only cycles in CI.

## Takeaways
- For a frozen tab: open DevTools first, then Pause. The stack tells you where the loop is.
- Boundary values (`== threshold`) are where "can't reproduce" bugs live.
