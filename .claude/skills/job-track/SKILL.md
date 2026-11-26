---
name: job-track
description: Keep the application tracker (data/applications.tsv) current through scripts/track.mjs, surface follow-ups that are due, and summarize where the search stands with honest numbers (response rate, stage conversion, where it stalls). Use for "I got a reply from…", "I have an interview with…", "rejected by…", "where do I stand?", "what should I follow up on?", or a weekly review.
---

# Track applications

The tracker is a tab-separated file the candidate can open in any spreadsheet. Change it only through the script, so the format stays valid:

```bash
node scripts/track.mjs list [--status applied] [--company stripe]
node scripts/track.mjs find "<text>"
node scripts/track.mjs add --company "Stripe" --role "Backend Engineer" --url "<u>" --status evaluated --grade B
node scripts/track.mjs set <id> --status screen --next "prep recruiter call" --next-date 2026-12-03
node scripts/track.mjs note <id> "Recruiter: range 190-230 base, team is Payments Infra"
node scripts/track.mjs due          # follow-ups due today or earlier
node scripts/track.mjs stats        # funnel and response rates
```

Statuses, in order: `evaluated` → `applied` → `screen` → `interview` → `offer`, plus `rejected`, `withdrawn`, `skipped`, `ghosted`.

## Status updates

- Change a row only on the candidate's word. "I heard back from Stripe" → ask what they said if it isn't clear, then set the status.
- Put the useful details in a note (who, what they said, range, next step). Paste-able recruiter emails also go into `knowledge/` so later prep can use them; ask first.
- Every active row gets a next action and a date. After an application: check in 7–10 days. After an interview: thank-you note same day, follow up after the stated timeline plus two business days.
- A move to `screen` or `interview` → offer `job-prep`.
- A rejection → set it, add the stage it happened at, and say nothing more unless they want to talk about it.

## Follow-ups

Run `due` at the start of a session if the candidate is mid-search. For each due item, draft the follow-up message (short, specific, no guilt) for them to send. You never send it.

## Weekly review

Run `stats` and give at most six lines:
- applications this week, and active pipeline
- response rate (applied → any reply) and where rows stall
- one pattern worth acting on, if the numbers show one (e.g. "grade C applications got no replies; 4 of 5 screens came from A/B roles")
- the next week's plan in one line

Use the numbers in the file. Below about 15 applications, say the sample is too small to read much into.
