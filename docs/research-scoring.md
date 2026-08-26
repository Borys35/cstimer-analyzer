# Scoring calibration research

Evidence gathered 2026-08-25 to recalibrate the three scoring axes (consistency = CV of recent singles,
improvement = trend of daily means, volume = active days / solves per active day). Deliberately biased
toward primary/community sources (forum solve logs, survey analyses, full-WCA-dataset studies) and toward
strict-side anchors.

## Method

- Web search across speedsolving.com forums, r/Cubers, statistical blogs, GitHub tooling, and WCA-derived
  analysis sites. Primary documents fetched and read in full where possible (two r/Cubers Megasurvey PDFs
  were downloaded and text-extracted; the Höhle WCA-mining post was read in full).
- Every numeric claim carries its source URL inline plus a note on the sample it comes from
  (one person's log vs. survey of N vs. full WCA export).
- Confidence labels: **[HIGH]** = large-N or full-population data; **[MEDIUM]** = small-N but measured;
  **[LOW]** = single-person log; **[ANEC]** = community anecdote/convention, no data.
- Items explicitly marked **DERIVED** are arithmetic conversions of published absolute numbers into
  %/week or CV. Items marked **PROPOSED** have no direct public data and are defaults anchored to adjacent
  findings.
- Known gaps stated openly in §5.

## 1. Consistency benchmarks (CV = stddev/mean of recent singles)

Direct published CV distributions by skill level do not exist. What exists: (a) a handful of measured
solve logs with mean+stddev posted publicly, (b) a long-standing community rule of thumb, and (c) one
full-WCA-dataset finding that *relative* dispersion is roughly constant across skill levels.

| Level (session mean) | Typical CV observed | Source(s) & sample | Confidence |
|---|---|---|---|
| ~40 s, low volume (~12 solves/wk) | **12.8%** (mean 40.63, σ=5.22, Ao12) | SpeedSolving "Race to Sub-30" round post, n=12 solves — https://www.speedsolving.com/threads/new-race-to-sub-30.21411/page-196 (Schmidt post, 2013) | LOW (one log, tiny n) |
| ~40 s | **~10%** ("stddev roughly 10% of my solve time", ~4 s on ~40 s) | SpeedSolving statistics thread, self-reported — https://www.speedsolving.com/threads/standard-deviation.18285/ (meichenl, 2010) | LOW |
| ~22–25 s (Ao100 basis) | **~9–12%** ("typical std dev for an Ao100 ranges 2.2–2.6" at ~sub-22–25 averages) | SpeedSolving "Measuring Standard Deviation of solve averages", one solver's repeated Ao100s — https://www.speedsolving.com/threads/measuring-standard-deviation-of-solve-averages.51546/ (mafergut, 2015) | MEDIUM (repeated logs, single person) |
| ~18 s | **5.1%** (mean 18.06, σ=0.92; small set incl. best 15.97 / worst 22.64) | SpeedSolving Accomplishment Thread stats block — https://www.speedsolving.com/threads/accomplishment-thread.1688/page-880 (Robert-Y, 2011) | LOW (one stats block) |
| Sub-10 | **11.5–11.8%** (Ao12: mean 10.27/σ 1.18; Ao5: mean 9.60/σ 1.13) | SpeedSolving member's PB posts — https://www.speedsolving.com/members/jackj.7027/recent-content (JackJ, 2020 & 2025) | LOW–MEDIUM (two independent logs, same person) |

Community reference points (not measurements):

- Long-standing convention: **stddev < 10% of average = "fairly good" consistency; < 5% = "really good"**
  — https://www.speedsolving.com/threads/standard-deviation.18285/ (miniGOINGS & Cride5, 2010). **[ANEC]**
- csTimer's displayed stddev for Ao5/Ao12 **excludes the two trimmed solves**, so it systematically
  understates single-solve dispersion; the same thread recommends tracking stddev over large samples
  (Ao50/Ao100) for consistency work — https://www.speedsolving.com/threads/measuring-standard-deviation-of-solve-averages.51546/.
  Implication: an app computing CV over *all* raw singles (as cstimer-analyzer does) should expect values
  modestly **higher** than the trimmed-stats numbers above. **[ANEC but methodologically important]**
- Indirect population-level support that CV is roughly scale-free: smooth quantile curves of Ao5 vs.
  years-of-experience over the entire WCA database stay "more or less parallel", which the author reads as
  stable variance/skewness across experience levels — http://staff.math.su.se/hoehle/blog/2019/05/06/wcamining.html
  (full WCA export, 124,997 players / 2,130,374 results as of 2019-04-19). **[MEDIUM]** (indirect)

**Working summary:** measured session-level CV clusters around **8–15% at every skill level**, with a
long-standing community threshold of 10% separating "consistent" from "inconsistent". No public data shows
beginners' raw-single CV reliably exceeding this; occasional blow-up solves suggest it does, but that
remains unmeasured (see §5).

## 2. Improvement-rate benchmarks

Best population evidence: Höhle's WCA-database cohort analyses (full WCA export) plus the r/Cubers
Megasurveys (N≈1,400–1,500) and dated forum progression logs. All %-week figures below are **DERIVED**
(geometric weekly rate implied by the cited before/after numbers).

| Stage | Evidence (timeline) | DERIVED rate | Source(s) & sample | Confidence |
|---|---|---|---|---|
| First solve → sub-60 | ~30–40 h of practice to sub-60 (one user's accounting); casual solvers often stall near ~60 s | (absolute-hours basis) | https://www.speedsolving.com/threads/how-long-did-it-take-you-to-reach-certain-milestones.21768/ (Zarxrax thread, 2010; multiple posters); "around a minute… is the limit for how fast most people can get by only practicing once in a while" — https://www.reddit.com/r/Cubers/comments/bl8r18/analysing_the_wca_database/ (PianoCube93 comment) | LOW–MEDIUM |
| ~210 s → ~105 s (casual competitor) | Cohort entering first WCA comp at 180–240 s avg drops to 90–120 s **within ~6 months**, then stalls | **≈ −2.5 to −2.7%/wk** for those first months | Höhle WCA mining: cohort N=168 first-timers (2015+), only 28.0% ever compete again — http://staff.math.su.se/hoehle/blog/2019/05/06/wcamining.html | **[HIGH]** (population data; survivorship caveats noted by author) |
| ~60 s → sub-30 (active beginner) | 3.5 months start→sub-30/avg-25 (one poster); ~50 h to sub-30 (another) | **≈ −1.5 to −3%/wk** while actively switching methods | https://www.speedsolving.com/threads/how-long-did-it-take-for-you-to-get-sub-20-seconds.3343 (Crzyazn, 2008); milestones thread .21768 (oprah62) | LOW (forum anecdotes, convergent) |
| ~60 s → sub-20 (committed beginner) | 4 months (fast self-report); ~9 months called "about normal, maybe a bit slow"; ~1 year another case | **−1.7 to −2.8%/wk** sustained | https://www.speedsolving.com/threads/time-to-get-sub-20-avg.49410 (NooberCuber 4 mo→13.5 @9 mo; TDM verdict "about normal"; Deleted-member ~1 yr 1:25→19) | LOW (multiple independent anecdotes) |
| sub-20 → sub-15 | Exceptional: Feliks Zemdegs sub-20 in 4 mo, sub-15 in 9 mo from start (≈ −2.5%/wk in that segment); typical forum range ~2–9 months for the last 5 s | **−0.6 to −1.8%/wk** (typical), −2.5%/wk world-class-fast | SpeedSolving wiki biography — https://www.speedsolving.com/wiki/index.php/Feliks_Zemdegs ; https://www.speedsolving.com/threads/time-to-get-sub-20-avg.49410 (NooberCuber 20→13.5 in 5 mo ≈ −1.8%/wk) | LOW–MEDIUM |
| sub-15 → sub-13/12 | One committed solver: ~15–16 → sub-15 in 2 mo, sub-14 +1 mo, sub-13 +2 more mo | **−0.6 to −1.7%/wk** | https://www.reddit.com/r/Cubers/comments/nwhnp9/if_you_average_sub15_what_do_you_average_and_how/ (single commenter, 2021) | LOW |
| sub-30 starter, long run | Cohort starting competition with sub-30 average: halving your time "takes several years" | **≈ −0.3 to −0.45%/wk** sustained | Höhle cohort N=29,466 via https://www.reddit.com/r/Cubers/comments/bl8r18/analysing_the_wca_database/ (analysis in http://staff.math.su.se/hoehle/blog/2019/05/06/wcamining.html family) | **[HIGH]** |
| Whole-career shape | "The average cubers take 4 years to get to their best times; less time for the fastest ones" | decay toward 0 by year ~4 | r/Cubers Megasurvey 2021 PDF p.25 (N=1,501) — https://basilio.dev/cubing/megasurvey/CubingMegasurvey2021.pdf | **[HIGH]** (survey) |

Cross-checks:

- Megasurvey 6 (N≈1,400): speed "depends mostly on how long we have been cubing, which on average is 2.5
  years"; median community average 16.9–17.7 s; ~4–5% of surveyed cubers average sub-10, ~18% sub-15,
  ~40% sub-20 — https://basilio.dev/cubing/megasurvey6/ and its PDF
  (https://basilio.dev/cubing/megasurvey6/CubingMegasurvey2022.pdf). **[HIGH]** (self-selection bias applies)
- Personal-log illustration of deceleration: one blogger's own multi-year csTimer data shows rapid early
  gains, then "progress in 2019 has slowed" as room for improvement shrinks —
  https://joshuacherian.github.io/posts/Cubing-Data-Analysis/ (one person, thousands of solves). **[LOW]**
- Elite plateau folklore: "First ever sub 10 average of 5… only 11+ years in the making" (JackJ, sub-10
  solver) — https://www.speedsolving.com/members/jackj.7027/recent-content. **[ANEC]**

## 3. Practice-volume norms

- **Median self-reported cubing time ≈ 63 min/day (2022 survey) / similar in 2021** — r/Cubers Megasurvey 6
  (N≈1,400), https://basilio.dev/cubing/megasurvey6/CubingMegasurvey2022.pdf p.13. **[HIGH]**
- Self-described frequency buckets (approximate read of the same chart; bucket↔bar alignment is ambiguous
  in the extracted PDF text, treat shares as ±few points): ~5% cube 4+ h/day, roughly a quarter to a third
  about an hour a day, a quarter to a third "a handful of solves every day", and the remainder once a week
  or rarer (2021 edition: 5/6/27/33/24/5% across the six buckets) —
  https://basilio.dev/cubing/megasurvey/CubingMegasurvey2021.pdf p.12 and 2022 p.13. **[MEDIUM]**
- **More frequency ↔ faster averages**: groups cubing ≥1 h/day average ~16.4–17.4 s vs. ~19.0–19.1 s for
  "handful of solves daily", once-a-week, and rarer groups — Megasurvey 2021 (N=1,501),
  https://basilio.dev/cubing/megasurvey/CubingMegasurvey2021.pdf p.12. Cross-sectional, not causal. **[HIGH]**
- Solve-count norms among forum improvers: "minimum 20, maximum 100" per day (OP); advice to cut to
  20–30/day and drill weaknesses instead; heavy grinders report 200–750/day (outliers) —
  https://www.speedsolving.com/threads/how-many-solves-i-need-to-do-per-day.74240/ (2019–2022 thread). **[ANEC]**
- Minimum-effective-dose claims (all anecdotal/coaching): ~half an hour daily is framed as enough to reach
  sub-30 within a year or less (PianoCube93 comment under the WCA-mining post —
  https://www.reddit.com/r/Cubers/comments/bl8r18/analysing_the_wca_database/); three focused 25-min
  sessions/week beat one unfocused 3-h session; 20–30 min deliberate daily beats longer infrequent work —
  https://aicubetrainer.com/practice-habits; "there is no required daily solve count" — attention-preserving
  volume beats mindless grinding — https://www.cuberpal.com/blog/how-to-practice-speedcubing. **[ANEC]**
- Structure over raw volume: recommended split ~50% deliberate drills / 50% solves —
  https://www.speedsolving.com/threads/practice-routines-and-general-cubing-tips.88962/ ; "half your time…
  slow solving and learning new algs" attributed to Feliks Zemdegs (quoted in .74240 thread). **[ANEC]**
- Top-solver reference point: during his fastest-improving years Feliks Zemdegs estimates ~30–60 min
  weekdays + 1 h+ weekend days, unstructured — https://www.speedsolving.com/threads/interview-with-feliks-zemdegs-march-2012.77096/. **[LOW]**
- Retention signal (relevant to "active days" floor): only **28%** of first-time WCA competitors starting at
  180–240 s ever enter a second competition (cohort N=168) —
  http://staff.math.su.se/hoehle/blog/2019/05/06/wcamining.html. Sporadic engagement is the norm, not the
  exception. **[HIGH]**

No public dataset ties solves-per-day longitudinally to improvement velocity (see §5); the frequency↔average
link above is cross-sectional.

## 4. Implications for scoring anchors

Design stance: anchors sit slightly stricter than the central tendencies found, so "good" scores require
genuinely good behavior rather than average behavior. Rationale follows each table.

### 4.1 Consistency (CV of recent raw singles)

| CV (raw singles, rolling window) | Score band | Justification |
|---|---|---|
| ≥ 0.25 | 0–20 | Far beyond any observed log (max measured: 12.8%); indicates blow-ups/DNF-heavy sessions |
| 0.15 – 0.25 | 20–40 | Plausibly messy beginner sessions; below everything measured in §1 (**PROPOSED** — no direct data) |
| 0.12 – 0.15 | 40–55 | Weakest measured logs land here (12.8% low-volume ~40 s solver) |
| 0.09 – 0.12 | 55–75 | Typical band across all measured levels (9–12%) — "par", not praiseworthy (strict side) |
| 0.07 – 0.09 | 75–90 | Better than the community's 10% "good" line; approaching best observed steady-state |
| 0.04 – 0.07 | 90–100 | Matches "really good" convention (<5%) and best observed log (5.1%) |
| < 0.04 | cap at 98, flag | Below anything documented; statistically suspect for raw singles — review for data errors |

Justification: measured CVs cluster at 8–15% regardless of level ([MEDIUM]/[LOW]), population data suggests
relative dispersion is nearly level-independent ([MEDIUM]), and the durable community convention puts
"good" under 10% and "excellent" under 5% ([ANEC]). A single scale (not level-adjusted) is therefore
defensible. Because these are raw singles including outliers (unlike csTimer's trimmed stddev), the 10%
line stays meaningful while the very bottom of the scale is reserved, not awarded.

### 4.2 Improvement rate (% change of weekly mean, geometric)

| Sustained trend | Score band | Justification |
|---|---|---|
| ≥ 0 (flat or worsening over 4+ weeks) | 0–15 | Population medians show even engaged cubers keep improving slightly until ~year 4; flat-for-months is genuinely underperforming |
| −0.1 to −0.3%/wk | 15–35 | Matches the long-run WCA sub-30 cohort (−0.3 to −0.45%/wk for years) — respectable maintenance pace ([HIGH]) |
| −0.3 to −0.7%/wk | 35–60 | Typical committed intermediate/advanced pace (sub-20→sub-15 segment) |
| −0.7 to −1.5%/wk | 60–85 | Fast but well-documented pace for actives (forum logs; sub-15→sub-12 reports) |
| −1.5 to −3%/wk | 85–100 | Beginner/early-intermediate ceiling; matches WCA 180→90–120 s-in-6-months cohort (−2.7%/wk) and fast forum cases ([HIGH]+[LOW]) |
| < −3%/wk (any stage past first month) | cap at 95, flag | Exceeds every sustained population figure; almost always short-window noise or method-switch artifact |

Justification: the two population-grade anchors are the WCA cohorts — −2.7%/wk briefly at entry level then
−0.3 to −0.45%/wk for years ([HIGH]) — bracketing the entire realistic space; forum timelines (multiple
independent [LOW] logs) fill the intermediate bands consistently. Stage-dependent expectations are NOT
encoded in v1 (the app may not know the user's stage robustly); instead the cap flags implausibly steep
trends, which keeps the scale strict at the top without punishing fast beginners.

### 4.3 Practice volume

- **Active days / 14 days:** **PROPOSED** (no public benchmark exists): ≥11 = 90–100 (daily, matches the
  megasurvey's faster cohorts); 6–10 = 55–85 (rough hourly-average cadence); 3–5 = 25–50 (weekly-ish);
  ≤2 = 0–20 (matches the retention finding that most lapsed entrants effectively stop). Anchor rationale:
  cross-sectional megasurvey data links ≥1 h/day cadence with meaningfully faster averages ([HIGH]),
  and ~63 min/day median defines "regular".
- **Solves per active day:** 20–100 = healthy band (forum norm [ANEC]); <10 = low (below the smallest
  reported serious volumes); >200 = no bonus (documented only as outlier behavior; coaching consensus says
  attention, not volume, drives gains [ANEC]). **PROPOSED** mapping: <10 → ≤40; 10–20 → 55; 20–60 → 75;
  60–100 → 85; 100–200 → 90; >200 → cap 90.

## 5. Explicit gaps (no solid public data found)

1. **Distribution of session-level CV by skill band.** Only isolated logs exist (§1); nobody publishes a
   large-N csTimer-export analysis of CV. The 8–15% cluster rests on ~5 independent datapoints + convention.
   If a bulk dataset ever becomes available (csTimer server backups are private), recalibrate.
2. **Beginner (>45 s) raw-single CV.** No log found; the ≥15% "weak" band in §4.1 is **PROPOSED**, not measured.
3. **Longitudinal dose-response** (solves/day or active-days vs subsequent improvement velocity). Only
   cross-sectional frequency↔average correlations exist. All volume anchors are therefore inferential.
4. **Active-days-per-fortnight norms.** Nothing published anywhere close; the proposed ladder is anchored
   to survey frequency buckets and the WCA retention figure only.
5. **Sub-12 elite consistency.** Only one solver's trimmed stats found; elites likely sit lower than 11%
   on raw singles, but this is unverified.

## Sources

1. r/Cubers Megasurvey 5 analysis page (N≈1,500) — https://basilio.dev/cubing/megasurvey/
2. Megasurvey 5 full PDF (2021) — https://basilio.dev/cubing/megasurvey/CubingMegasurvey2021.pdf
3. r/Cubers Megasurvey 6 analysis page (N≈1,400) — https://basilio.dev/cubing/megasurvey6/
4. Megasurvey 6 full PDF (2022/2023) — https://basilio.dev/cubing/megasurvey6/CubingMegasurvey2022.pdf
5. M. Höhle, "Speedmining the Cubing Community with dbplyr" (full WCA export, 2019) — http://staff.math.su.se/hoehle/blog/2019/05/06/wcamining.html
6. r/Cubers thread on the WCA-database analysis (incl. sub-30 cohort N=29,466; PianoCube93 comments) — https://www.reddit.com/r/Cubers/comments/bl8r18/analysing_the_wca_database/
7. SpeedSolving, "Standard Deviation." (2010; convention + meichenl log) — https://www.speedsolving.com/threads/standard-deviation.18285/
8. SpeedSolving, "Measuring Standard Deviation of solve averages" (2015; mafergut Ao100 logs; csTimer trimming caveat) — https://www.speedsolving.com/threads/measuring-standard-deviation-of-solve-averages.51546/
9. JackJ recent content (PB posts with mean/stddev) — https://www.speedsolving.com/members/jackj.7027/recent-content
10. SpeedSolving Accomplishment Thread p.880 (Robert-Y session stats) — https://www.speedsolving.com/threads/accomplishment-thread.1688/page-880
11. SpeedSolving "Race to Sub-30!" p.196 (Schmidt σ=5.22 @ 40.63) — https://www.speedsolving.com/threads/new-race-to-sub-30.21411/page-196
12. SpeedSolving, "Time to get sub-20 AVG?" (2014) — https://www.speedsolving.com/threads/time-to-get-sub-20-avg.49410
13. SpeedSolving, "How long did it take for you to get sub 20 seconds?" (2008) — https://www.speedsolving.com/threads/how-long-did-it-take-for-you-to-get-sub-20-seconds.3343
14. SpeedSolving, "How long did you take to get to sub-15 since… sub-20" — https://www.speedsolving.com/threads/how-long-did-you-take-to-get-to-sub-15-since-the-time-you-cracked-sub-20.38211/
15. SpeedSolving, "How long did it take you to reach certain milestones?" (hours-based, 2010) — https://www.speedsolving.com/threads/how-long-did-it-take-you-to-reach-certain-milestones.21768/
16. r/Cubers, "If you average sub-15…" progression reports — https://www.reddit.com/r/Cubers/comments/nwhnp9/if_you_average_sub15_what_do_you_average_and_how/
17. SpeedSolving wiki, "Feliks Zemdegs" (milestone timeline) — https://www.speedsolving.com/wiki/index.php/Feliks_Zemdegs
18. Interview with Feliks Zemdegs (practice volume) — https://www.speedsolving.com/threads/interview-with-feliks-zemdegs-march-2012.77096/
19. SpeedSolving, "How Many Solves I Need To Do Per Day?" — https://www.speedsolving.com/threads/how-many-solves-i-need-to-do-per-day.74240/
20. AI Cube Trainer, "How to Practice Speedcubing Effectively" — https://aicubetrainer.com/practice-habits
21. CuberPal, "Practice Speedcubing: A Better Session Plan" — https://www.cuberpal.com/blog/how-to-practice-speedcubing
22. SpeedSolving, "Practice Routines and General Cubing Tips" (50/50 rule) — https://www.speedsolving.com/threads/practice-routines-and-general-cubing-tips.88962/
23. J. Cherian, "Cubing Data Analysis" (personal multi-year log) — https://joshuacherian.github.io/posts/Cubing-Data-Analysis/
24. SpeedSolving wiki, "Average" (Ao conventions, trimmed-mean definitions) — https://www.speedsolving.com/wiki/index.php/Average
25. WCA Results Export (dataset reference) — https://www.worldcubeassociation.org/export/results
26. r/Cubers, "At what point are you considered a 'fast' cuber?" (community wisdom) — https://www.reddit.com/r/Cubers/comments/16e85wg/at_what_point_are_you_considered_a_fast_cuber/

## Appendix: CFOP phase-share references (added for split prescriptions)

Coaching heuristics converge on Cross = 10-15%, F2L = 45-55%, full last layer (OLL+PLL) = 30-40% of total solve time. The implementation uses midpoints: cross 12%, F2L 50%, OLL 19%, PLL 19%.

- CuberPal, "CFOP Solve Splits" (2026-07-21) - https://www.cuberpal.com/blog/cfop-solve-splits - states the ranges above, explicitly labeled "broad coaching heuristics, not published standards"; worked example at a 30s average shows F2L ~57% flagged as high.
- SpeedSolving forum thread "CFOP breakdown percentage" - https://www.speedsolving.com/threads/cfop-breakdown-percentage.51030 - community convention example 10/60/15/15; individual self-reports vary widely (one sub-25 solver reported 20/30/25/25), confirming these are conventions rather than measured distributions.

Confidence: LOW-to-MEDIUM. No large-N measured phase-share distribution is publicly available; the reference shares are convention-based and deliberately conservative (a phase must exceed its reference by more than 2 percentage points to be called out).
