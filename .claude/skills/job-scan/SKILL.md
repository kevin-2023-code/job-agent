---
name: job-scan
description: Find new postings at the candidate's target companies by scanning their public Greenhouse, Lever, Ashby and SmartRecruiters job boards (scripts/scan.mjs), filter by title, location and age, drop roles already seen or tracked, and triage what is left. Use for "find me jobs", "anything new?", "scan", or a daily or weekly check.
---

# Scan for new roles

## Steps

1. **Check `portals.yml` exists.** If not, run the portals step of `job-setup` first.
2. **Run the scanner**: `npm run scan`. Useful flags:
   - `--company <name>` one company only
   - `--days <n>` override `max_age_days`
   - `--all` include postings already seen
   - `--json` machine-readable output on stdout
   It prints a summary and appends new matches to `data/pipeline.md`. Seen posting ids are kept in `data/seen.json`, so the next scan shows only what is new.
3. **Report the errors plainly.** A 404 usually means the board name is wrong or the company moved ATS; offer to look up the new careers page and fix `portals.yml`.
4. **Triage.** For the new rows, do the quick pass from `job-evaluate` (title, level, location, deal-breakers) and show a short table: company, role, location, keep/drop, one-line reason. Keep it under twenty rows; say how many more there are.
5. **Ask which keeps to evaluate in full**, then run `job-evaluate` on those, one report each.

## Beyond the company list

- If a search tool is available, the candidate can ask for a wider search ("staff ML infra roles, remote US"). Search, then treat results like pipeline rows: dedupe against the tracker, quick-triage, offer full evaluations.
- If a job-data tool is connected (see `docs/data-sources.md`), its search is usually better than web search for this: use it, and say where the results came from.
- Never sign in to a job board or scrape pages that need an account.

## Cadence

Suggest a rhythm once, not every time: scan two or three times a week, evaluate the keeps the same day. Fresh postings get far more attention from recruiters in the first week.
