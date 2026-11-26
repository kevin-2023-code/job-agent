---
name: job-setup
description: First-run onboarding for job-agent. Connects the TrueInterview account when the MCP is available, then gets the candidate's résumé, target roles, places, deal-breakers, compensation and work authorization on record, drafts their STAR stories, and sets up the companies to watch. Falls back to a local workspace when there is no connection. Use when the candidate says "set me up", "start", shares a résumé for the first time, or when nothing is known about them yet.
---

# Setup

> Connected vs local mode, the workspace, the `job-agent <command>` scripts and the rules: the `job-agent` skill (or `AGENTS.md`). Read it once per session.

Goal: in about ten minutes, enough on record to score a posting and fill a form. Perfect comes later, from use.

## 1. Connection and workspace

- If the `get_account` tool exists, call it. Signed in → connected mode; read `profile.next_in_chat` for what is missing. Tool present but not signed in → tell them how to sign in, in one line (Claude Code `/mcp`, Codex `codex mcp login trueinterview`, Cursor/VS Code the MCP panel), and continue locally meanwhile. Tool absent → local mode, no comment needed.
- If they pasted a code starting with `tih_` (from TrueInterview's Agent page), call `claim_setup_handoff` with it and follow the instructions it returns, reporting each stage with `report_setup_progress`. Keep both codes out of what you write back.
- Run `job-agent init` either way. It creates the workspace (`job-agent where` prints it) without overwriting anything. The local workspace holds `knowledge/`, `portals.yml`, reports and output in both modes.

## 2. Résumé

Ask for their résumé (PDF, DOCX, pasted text, or a LinkedIn "Save to PDF").

- **Connected:** read the file and call `import_resume` with its text. Show what it parsed in a few lines and ask what's wrong. If it returns `suggested_search`, confirm it in one line and save it with `update_job_search`.
- **Local:** write `profile/cv.md` in the shape of `examples/cv.example.md`, every fact as given. A bullet with no result keeps no number; mark it `<!-- add a number? -->`.

## 3. What they want

Ask only what the résumé can't tell you, in one message, as a short numbered list: target titles and level; places and remote/hybrid/on-site; deal-breakers; salary floor and target; work authorization and sponsorship; why they are looking (one line).

- **Connected:** `update_job_search` (roles, seniority, places, work mode, salary); `update_application_answers` for work authorization, sponsorship, relocation, notice period, salary range; `save_context_note` for goals, target companies, deal-breakers and the why, in their words (`topic` goals / target_companies / constraints / preferences). Say in one line what you saved.
- **Local:** fill `profile/profile.yml`.

Also ask, once, how much they want automated, and save it: with the server, `update_application_answers` with `resume_tailoring`, `cover_letter`, `voluntary_disclosures` and, only if they agree to the sentence `prepare_application` gives for it, `answer_mode: full_auto`; locally, the `apply:` block in `profile.yml`.

## 4. Stories

Draft three to five STAR stories in `profile/stories.md` from the résumé and anything in `knowledge/` (a hard technical problem, a conflict, a failure, leading without authority, a deadline). Tag each with what it shows, mark it `DRAFT`, and ask them to fix the facts. These carry the behavioral rounds. Stories stay local in both modes.

## 5. Companies to watch

Ask for 10–30 companies they'd actually join. Connected: save them as a `target_companies` note. Either way, put the ones on Greenhouse, Lever, Ashby or SmartRecruiters in `portals.yml` (`board` is the last part of `boards.greenhouse.io/<board>`, `jobs.lever.co/<board>`, `jobs.ashbyhq.com/<board>`), with title and location filters from step 3, so `job-agent scan` catches new postings the day they go up.

## 6. Knowledge

Tell them in two lines what `knowledge/` is for (past interview notes, brag docs, reviews, recruiter emails) and where it is. It's the part that gets better the longer they search.

## 7. Finish

Run `job-agent doctor`, fix what it flags, then offer the first real step: connected, `recommend_jobs` and the top five; local, the first scan, or "paste a posting you're considering".
