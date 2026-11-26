---
name: job-prep
description: Prepare the candidate for a specific interview: what the company's process looks like, the likely question types per round, a day-by-day plan to the interview date, story-to-question mapping from profile/stories.md, and mock rounds in chat with honest feedback. Draws on the candidate's knowledge/ folder first, the web second, and a connected interview-data source when there is one. Use for "I have an interview with…", "prep me for the onsite", "mock me", "what will they ask?".
---

# Interview prep

## Steps

1. **Pin down the interview.** Company, role, level, round(s) and date. Read the tracker row and the evaluation report.
2. **Gather what is known**, and keep track of where each fact came from:
   - `knowledge/`: past interview notes for this company or similar ones, recruiter emails describing the loop (`node scripts/kb.mjs search "<company>"`).
   - The recruiter's own description of the rounds, if the candidate has it.
   - With a search tool: the company's careers/engineering pages describing their process, recent public interview reports.
   - With a connected interview-data source (see `docs/data-sources.md`): reported questions and round structure for this company and role. Prefer it over web guesses when it has data, and pass on its links as given.
   If sources disagree, say so. If nothing is known about a round, say that and prepare for the common format for that round type.
3. **Write the plan** to `output/<company>-<role>/prep.md`:
   - The loop, round by round: format, length, what is assessed.
   - For each round, the three to five most likely question types, with the candidate's weak spots first (from their notes, past rejections, the report's gaps).
   - A day-by-day schedule to the date, sized to the hours per day they say they have. Most time goes to the highest-weight round they are weakest at.
   - Story map: each likely behavioral question → the story from `profile/stories.md` that answers it. Flag questions with no story, and help draft one from real experience.
   - Questions for them to ask the interviewer (from the report).
4. **Mock rounds on request.** Play the interviewer for one round type at a time:
   - Coding: give a problem at the right level, let them think aloud, ask follow-ups on complexity and edge cases, don't hand them the answer.
   - System design: give a prompt, push on requirements, scale, trade-offs and failure modes as a real interviewer would.
   - Behavioral: ask, then probe ("what did *you* do?", "what would you change?").
   - End each mock with: what worked, the two most important fixes, and a hire/no-hire read with the reason. Honest beats encouraging.
   - Save the feedback to `knowledge/mocks/<yyyymmdd>-<company>-<round>.md` so later prep can track progress.
5. **After the real interview**, offer to write up what was asked into `knowledge/interviews/`. It is the most valuable file they will have for the next loop.
