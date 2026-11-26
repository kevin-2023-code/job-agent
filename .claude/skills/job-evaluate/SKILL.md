---
name: job-evaluate
description: Score one job posting against the candidate's profile on six weighted dimensions, give an A–F grade with a clear apply / skip call, map every must-have to evidence in their CV, and write a short report to reports/. Use when the candidate pastes a posting or link, asks "is this worth applying to?", "am I a fit?", or after a scan to triage new postings.
---

# Evaluate a posting

Read `docs/scoring.md` once per session: it defines the dimensions, weights and grade bands. This file is the workflow.

## Steps

1. **Get the posting.** Fetch the link, or use the pasted text. If the page is a job board listing (LinkedIn, Indeed), ask for the employer's own link too: it has the full text and the real form. Note if the posting looks closed or older than 60 days.
2. **Check the tracker**: `node scripts/track.mjs find "<company>"`. If they already applied or skipped this role, say so first.
3. **Read the candidate**: `profile/profile.yml`, `profile/cv.md`, and search `knowledge/` for the company (`node scripts/kb.mjs search "<company>"`). Past interview notes or a recruiter thread about this company change the call.
4. **Look outward, briefly**: with a search tool, check for recent layoffs, funding, a hiring freeze or a reorg (last 6 months). With a connected data source, pull what it has on the company's interviews and the role. Two or three facts, not an essay.
5. **Score it** on the six dimensions in `docs/scoring.md`. Every score gets one line of reason. Check deal-breakers first: any hit caps the grade at D and says which one.
6. **Map the must-haves.** List the posting's hard requirements. For each: `met` with the CV line that shows it, `partial` with what's there, or `missing`. Don't stretch: "used Kafka once" is not "deep Kafka expertise".
7. **Write the report** to `reports/<company>-<role>-<yyyymmdd>.md` (lowercase, hyphens) using the template below.
8. **Log it**: `node scripts/track.mjs add --company "<c>" --role "<r>" --url "<u>" --status evaluated --grade <G> --report <path>`.
9. **Answer in chat in five lines or fewer**: grade and verdict, the two strongest reasons, the biggest gap, and the one next step (tailor the CV and apply / skip / ask a person at the company first).

## Report template

```markdown
# <Company> — <Role>
<url> · evaluated <yyyy-mm-dd> · **Grade <G> (<score>/100) — <Apply now | Apply | Maybe | Skip>**

## Verdict
Two or three sentences a busy person would read.

## Scores
| Dimension | Score | Why |
| --- | --- | --- |
| Role & level fit | x/25 | … |
| Skills match | x/25 | … |
| Odds | x/15 | … |
| Company & team | x/15 | … |
| Comp & logistics | x/10 | … |
| Goals | x/10 | … |

## Must-haves
| Requirement | Status | Evidence |
| --- | --- | --- |

## Gaps and how to handle them
- Gap → what to say, or what to put forward instead. Never "add it to the CV" unless it is true.

## Angle for the CV
Which two or three experiences to lead with, and the posting's words to mirror where they are true.

## Red flags
Only real ones, with the source.

## Questions to ask them
Three questions whose answers would change the decision.
```

## Batch triage

When there are many postings (after a scan), do a quick pass first: title, level, location and deal-breakers only, from the pipeline lines. Give each a one-line `keep` / `drop` with the reason, and run the full evaluation only on the keeps the candidate picks.
