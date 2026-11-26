---
name: job-tailor
description: Produce a CV (Markdown and PDF) and, when wanted, a cover letter tailored to one posting, using only facts from the candidate's master CV and knowledge files. Reorders and rewords to match the posting's language, shows every change for approval, and renders a clean one- or two-page PDF. Use for "tailor my resume", "CV for this role", "write a cover letter".
---

# Tailor a CV and cover letter

## Before you start

- There should be an evaluation report for the role in `reports/`. If not, run `job-evaluate` first; its "Angle for the CV" section drives this.
- Read `profile/cv.md` (the master) and search `knowledge/` for material that never made it into the CV: brag docs and reviews often hold the better bullet.

## The CV

1. **Copy, don't edit the master.** Write to `output/<company>-<role>/cv.md`. The master changes only when the candidate says "update my master CV".
2. **Choose what leads.** Put the two or three experiences from the report's angle at the top of each role. Cut or shorten bullets that don't serve this posting; a tailored CV is mostly subtraction.
3. **Mirror the language where it is true.** If the posting says "distributed systems" and the CV says "backend services" for the same work, use their phrase. ATS keyword filters and recruiters both scan for the posting's words.
4. **Summary line.** Rewrite the two-line summary for this role: level, the domain they want, one proof point.
5. **Skills line.** Order by the posting's priorities. Remove skills irrelevant to the role. Never add one the candidate doesn't have.
6. **Hard limits.** No new employers, titles, dates, degrees, numbers or technologies. A bullet without a number stays without one unless the candidate gives you the number. If a must-have is missing, it stays missing: say so in chat, and suggest how to address it in the cover letter or interview.
7. **Show the changes** as a short list: moved, reworded (old → new), cut. Wait for an OK or edits.
8. **Render the PDF**: `npm run pdf -- output/<company>-<role>/cv.md`. It writes `cv.pdf` next to it. Check the page count it prints: one page under ~8 years of experience, two at most otherwise.

## The cover letter

Write one only when `apply.cover_letter` is `always`, or the form asks for one, or the candidate asks.

- 200–300 words, `output/<company>-<role>/cover-letter.md`.
- Paragraph 1: the role and a specific reason for this company (from the posting, the company's own writing, or the candidate's notes; never generic praise).
- Paragraph 2: the one experience that best matches their biggest need, with the result.
- Paragraph 3: a gap, if a big one exists, handled honestly; or a second proof point.
- Close in one line. No "I am writing to express my interest".
- Show it before it goes anywhere.

## Language

Write the CV and letter in the posting's language. If the candidate's master CV is in another language, translate faithfully and flag phrases where meaning may have shifted.
