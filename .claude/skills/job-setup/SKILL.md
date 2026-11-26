---
name: job-setup
description: First-run onboarding for job-agent. Builds the candidate's profile (master CV, targets, deal-breakers, compensation, work authorization, stories) from a résumé file, LinkedIn text or a short conversation, and sets up the job boards to scan. Use when profile/ is empty or thin, or the candidate says "set me up", "start", "here's my resume".
---

# Setup

Goal: in about ten minutes, end with `profile/cv.md`, `profile/profile.yml`, `profile/stories.md` and `portals.yml` that are good enough to evaluate a posting. Perfect comes later, from use.

## Steps

1. **Run `npm run setup`** if `profile/profile.yml` does not exist. It copies the examples in place without overwriting anything.
2. **Get the raw material.** Ask for their résumé (a PDF, a DOCX, pasted text or a LinkedIn "Save to PDF" export) and anything in `knowledge/` worth reading: performance reviews and brag docs are the richest. Read what exists before asking questions.
3. **Write `profile/cv.md`** from their résumé, in the shape of `examples/cv.example.md`. Keep every fact as given. Where a bullet has no result, keep it and mark it `<!-- add a number? -->` rather than inventing one. Show them the diff in one message and ask what is wrong.
4. **Fill `profile/profile.yml`.** Ask only what the résumé can't tell you, in one message, as a short numbered list:
   - target titles and level, and why they are looking (one line)
   - deal-breakers
   - compensation floor and target
   - remote / cities / relocation
   - work authorization and sponsorship
   Use their words. Leave a field empty rather than guessing.
5. **Draft `profile/stories.md`.** Pull three to five stories out of the CV and knowledge files (a hard technical problem, a conflict, a failure, leading without authority, a deadline). Draft them in STAR form with tags, mark each `DRAFT`, and ask them to correct the facts. These carry the behavioral rounds; they are worth the time.
6. **Set up `portals.yml`.** Ask for 10–30 companies they would actually join. For each, find the careers page and work out the ATS and board name (the last part of `boards.greenhouse.io/<board>`, `jobs.lever.co/<board>`, `jobs.ashbyhq.com/<board>`). Set the title and location filters from step 4. Companies on another system go in a comment for them to check by hand.
7. **Run `npm run doctor`** and fix what it flags.
8. **Close with one next step**: "Paste a posting you're considering and I'll score it", or run the first scan.

## Optional data source

If the agent has a job-data tool connected (see `docs/data-sources.md`), mention in one line what it adds and leave it there. Everything above works without one.
