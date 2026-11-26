# Scoring

Every evaluation scores six dimensions out of 100, then maps the total to a grade. The point is not precision; it is to make the agent show its reasoning the same way every time, so the candidate can disagree with a specific line.

## Dimensions

| Dimension | Points | What it asks |
| --- | --- | --- |
| **Role & level fit** | 25 | Is this the job they want (`targets.roles`), at their level? A title match at the wrong level scores low. Read the responsibilities, not the title. |
| **Skills match** | 25 | Share of must-haves `met` with evidence, plus nice-to-haves. Each missing must-have costs more than a missing nice-to-have. |
| **Odds** | 15 | Can they realistically get it? Work authorization and sponsorship, location eligibility, posting age (fresh is better), years-of-experience bar, signals of a hiring freeze, a referral path in `knowledge/`. |
| **Company & team** | 15 | Against *their* stated priorities (`targets.industries`, `company_stage`, `why`): product, trajectory, stability, team, engineering culture where known. |
| **Comp & logistics** | 10 | Posted or known range against `compensation`; remote/on-site against `location_prefs`. Unknown range scores the midpoint, not zero. |
| **Goals** | 10 | Does it move them toward `targets.why`? A role that pays well but is a step sideways scores low here. |

## Deal-breakers

Check `deal_breakers` first. Any hit caps the grade at **D**, whatever the total, and the report says which one. If the posting is ambiguous on a deal-breaker (e.g. "hybrid" when on-site 5 days is a deal-breaker), don't cap: score it, and put it under "Questions to ask them".

## Grades

| Grade | Total | Call |
| --- | --- | --- |
| **A** | 85–100 | Apply now, with a tailored CV. Look for a referral. |
| **B** | 70–84 | Apply, tailored. |
| **C** | 55–69 | Apply only if it is quick, or something specific makes it worth it. |
| **D** | 40–54 | Skip, unless the candidate has a reason the profile doesn't show. |
| **F** | 0–39 | Skip. |

`targets.min_grade` (default C) is the line below which the agent recommends against applying. The candidate can always override it.

## Calibration

After about 20 applications, compare grades with outcomes (`npm run track -- stats` shows replies by grade). If C roles reply as often as B, the weights are off for this candidate's market: say so and suggest which dimension to reweigh. The candidate edits this file if they agree.
