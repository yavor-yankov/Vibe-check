-- PR-K: persist expanded insights on the reports table.
--
-- `insights` is the sanitized ExpandedInsights object returned by /api/analyze
-- (marketSize / fundingSignal / graveyard / buildEffort / regulatoryFlags /
-- pricingBenchmarks). Stored as jsonb and nullable so reports created before
-- this migration keep working — they simply return NULL and the UI hides the
-- insights panel via `report.insights && <InsightsPanel ... />`.

alter table public.reports
  add column if not exists insights jsonb;
