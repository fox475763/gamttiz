# Fry Radar collection

- GitHub Actions runs hourly at minute 17 (KST/UTC minutes are identical).
- Minute 47 is a recovery check: collect only when the last published completion
  is at least 75 minutes old or missing. GitHub may delay/drop scheduled jobs;
  this is mitigation, not a punctual-delivery guarantee. workflow_dispatch is
  available for manual recovery. Deletion uses the same concurrency group.
- All 68 Bing keyword queries and 10 Google discovery queries run each cycle.
  News requests use two workers; official brands use three; stored event
  rechecks use four. Transient network/408/429/5xx failures are retried, bounded
  by request timeouts. No new post is accepted without an accessible source.
- Google intermediary URLs are never saved as verified publisher URLs. Google
  stories whose actual publisher cannot be resolved are omitted.
- Official alternatives include Shinsegae Food's .com newsroom, Shake Shack's
  operator newsroom, and Burger King's Kakao channel. Brand-specific media
  searches run independently even when a brand site blocks access. A reachable
  shell without detail links is reported as partial coverage, not full success.
- Existing URLs are revisited even when absent from the listing. Clear scoped
  dates can revise the same ID; explicit termination notices archive the event.
  Ambiguous dates, image-only notices, mismatched titles and unavailable pages
  do not overwrite confirmed values. Audit history and recheckStatus are kept.
  Ended events are rechecked for 30 days for extensions/corrections.
- The board and home preview check published JSON every 60 seconds while visible,
  and on focus/online/return. Failed refreshes retain current cards and filters.
  Publishing new JSON triggers a Pages rebuild; it is not available until that
  deployment completes. No credentials or admin write access are added to clients.

Validation: `node --test tools/test-fry-radar.mjs tools/test-fry-delete.mjs`
and `node tools/check-site.mjs`. Collection health and per-query/source failures
are in data/fry-radar-health.json, also retained as a workflow artifact for 14 days.
