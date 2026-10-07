# Prescriptions research

Evidence gathered 2026-08-26 on improvement strategies, drills, and coaching feedback calibration for
speedcubers at different solve-time bands. References primary coaching sources, community data, and
deliberate-practice literature. Every claim carries its source URL inline.

## Method

- Web search across SpeedSolving.com forums, r/Cubers, coaching sites (CubeSkills, J Perm, CuberPal,
  TheCubicle, AI Cube Trainer, Caiden Lee), WCA regulations, deliberate-practice academic papers,
  and csTimer documentation.
- Primary documents fetched and read in full where possible.
- Confidence labels: **[HIGH]** = large-N data or authoritative source; **[MEDIUM]** = measured but
  small-N; **[LOW]** = single-person log or coaching anecdote; **[ANEC]** = community convention, no data.
- Items explicitly marked **DERIVED** are arithmetic conversions of published numbers.
- Items marked **PROPOSED** have no direct public data and are defaults anchored to adjacent findings.

## 1. What matters most at each time band

### 1.1 Sub-60 (Beginner — typically 60–120 s)

**#1 bottleneck: Method efficiency.** At this stage, most solvers use a beginner layer-by-layer method
with high move count. Transitioning to CFOP (specifically learning F2L) is the single highest-impact change.

- "Beginners are typically cubers who recently learned how to solve the Rubik's Cube… improvement for
  beginners can be extremely rapid. Most beginners can experience noticeable improvement by just
  repeatedly solving the cube." — TheCubicle (Damian Bias), https://www.thecubicle.com/blogs/thecubicle-blogs/how-to-improve-at-speedcubing
- "Around a minute… is the limit for how fast most people can get by only practicing once in a while" —
  PianoCube93 comment, https://www.reddit.com/r/Cubers/comments/bl8r18/analysing_the_wca_database/
- "Sub-60 seconds takes 2–4 weeks" with 20–30 min/day deliberate practice — AI Cube Trainer FAQ,
  https://aicubetrainer.com/faq

**Phase-share targets (rough):** Cross 15%, F2L 55%, OLL 15%, PLL 15%. At this level, F2L is
dominated by inefficiency; OLL/PLL are fast because they use 2-look with few algs.

**What to fix first:**
1. Solve cross on bottom (not top)
2. Learn intuitive F2L (eliminate beginner layer-by-layer)
3. Basic finger tricks (double-flicks for M/U moves)
4. Learn 2-look OLL and 2-look PLL

**Source:** Zubin Park's "Help for cubers who want to beat sub-x" thread (sub-1 min + sub-50 sections),
https://www.speedsolving.com/threads/help-for-cubers-who-want-to-beat-sub-x-cfop.77867

### 1.2 Sub-40 (Early Intermediate — 30–60 s)

**#1 bottleneck: F2L efficiency + 2-look OLL/PLL drilling.** Once the solver has transitioned to CFOP,
the biggest time sinks are (a) inefficient F2L pair solutions (rotations, excessive moves) and (b)
slow/uncertain last-layer algorithm execution.

- "You should: Mostly done with 2 look OLL and PLL; Cross on bottom & less than 8 moves at least 25%
  of the time; Solid Intuitive F2L; Basic finger tricks learned" — Zubin Park, sub-40 section
- "The only thing stopping you from advancing is lack of solves/practice. If you can, try doing 100
  solves a day" — same source
- "Drill 2 look OLL and PLL algs… repeat the algs over and over again" — same source

**Phase-share targets:** Cross 12%, F2L 55%, OLL 17%, PLL 16%. F2L is still the dominant time sink
but last-layer recognition gaps create significant pauses.

**What to fix first:**
1. All 2-look OLL/PLL algs drilled to automaticity
2. F2L cases learned beyond pure intuition (some algorithmic solutions for common cases)
3. Cross under 8 moves 50%+ of the time
4. Eliminate cube rotations where possible

**Source:** Same thread (sub-40 section); CuberPal practice guide (drill structure),
https://www.cuberpal.com/blog/how-to-practice-speedcubing

### 1.3 Sub-25 (Intermediate — 20–30 s)

**#1 bottleneck: Cross-to-F2L transition + F2L lookahead initiation.** At this stage the solver knows
full PLL (or nearly) and has 2-look OLL. The gap to sub-20 is dominated by pauses between steps —
especially after cross and between F2L pairs.

- "You should: Learning Full PLL; Eliminate U4's; Less than 8 moves for cross ≥50% of the time" —
  Zubin Park, sub-30 section
- "Start learning full PLL… learn some, and learn them no more than 2 at a time" — same source
- "Start to learn Full OLL… learn the easy cases" — same source (sub-30 section)
- "Try to be move efficient… don't be afraid to use F moves to insert your F2L pairs" — same source
- "Start thinking about lookahead in F2L… try to do your current pair without looking at the pair
  being solved" — same source

**Phase-share targets:** Cross 10%, F2L 52%, OLL 19%, PLL 19%. F2L pauses now dominate; OLL/PLL
execution is reasonably fast but recognition can lag.

**What to fix first:**
1. Full PLL learned (21 algs)
2. Begin learning full OLL (start with easy non-dot cases)
3. Cross planning during inspection (aim for full cross planned 75%+ of the time)
4. F2L: solve into back slots to reduce rotations
5. Slow-solve practice to build lookahead

**Source:** CuberPal "How to Get Sub-20 on 3x3" guide,
https://www.cuberpal.com/guides/how-to-get-sub-20-on-3x3 (referenced in training plan);
Cubelelo sub-20 guide (Sarthak Masta), https://www.cubelelo.com/blogs/cubing/how-to-be-sub-20

### 1.4 Sub-15 (Advanced — 12–18 s)

**#1 bottleneck: F2L lookahead fluidity + OLL/PLL recognition speed + cross-F2L transition.** At this
level, the solver has full OLL and PLL. Improvement comes from reducing pauses to near-zero, increasing
TPS while maintaining efficiency, and eliminating cube rotations.

- "You should: Full PLL and Full OLL (or at least 75% of them) with all of them at least sub-2;
  Sub 20 regularly, with some sub 15 solves mixed in; Efficient cross all the time; Good or great
  tracking for F2L; Cross to F2L transition relatively fast and smooth; Sub 2 cross all the time" —
  Zubin Park, sub-15 section
- "Lookahead. You should be looking ahead all the time, and making your F2L fairly, if not completely,
  smooth." — same source
- "Don't rotate to solve PLL's, turn the U face instead" (AUF) — same source
- "Start some alg subsets… I would recommend, at this stage, COLL or WV" — same source

**Phase-share targets:** Cross 8%, F2L 50%, OLL 20%, PLL 22%. Last-layer execution is now fast;
the gap is almost entirely F2L fluidity and cross-F2L transition.

**What to fix first:**
1. Cross-F2L transition seamless (plan cross + locate first F2L pair in inspection)
2. F2L lookahead across all 4 pairs (not just current pair)
3. AUF (Adjust U Face) instead of cube rotations for PLL
4. Begin learning COLL or Winter Variation
5. Eliminate all regrips from OLL/PLL execution

**Source:** Same thread (sub-15 section); CuberPal F2L lookahead guide,
https://www.cuberpal.com/guides/f2l-lookahead; Caiden Lee coaching description (C+1 training,
lookahead, efficiency drills), https://caidenlee.com/

### 1.5 Sub-10 (Elite — 8–12 s)

**#1 bottleneck: Minimizing total pause time + TPS × efficiency balance + advanced technique
integration.** At this level, all algs are known, F2L is intuitive and efficient, and the solver is
optimizing micro-details: pause-free solves, sub-1 cross, transition fluidity, and ergonomics.

- "It's time to get your TPS up… practice some more slow solving… continue to spam your PLL and OLL
  algs" — Zubin Park, sub-10 section
- "Don't worry about splits. At this stage, splits are dependent on the type of turner/learner you
  are" — same source
- "Work on CN if you haven't already… it only shaves off a little of your solve time, while taking
  months at this stage to conquer" — same source
- "Solve, solve, solve… and solve… improvement comes with repetition" — same source
- Advanced technique subsets: ZBLL (493 algs), VLS, pseudoslotting — used by world-record holders
  (Yiheng Wang, Tymon Kolasiński) — https://en.wikipedia.org/wiki/Speedcubing

**Phase-share targets:** Cross 6–8%, F2L 48–52%, OLL 18–22%, PLL 18–22%. Splits become very
individual; some elites have 5% cross, others 10%.

**What to fix first:**
1. TPS increase via drill repetition (not just raw speed)
2. Cross sub-1 sec 90%+ of the time
3. F2L fluidity with zero full stops
4. OLL/PLL recognition instant (sub-0.5 sec recognition)
5. Consider CN (color neutral) or dual-CN for scramble advantage
6. Advanced subsets (COLL, ZBLL) if OLL/PLL are already fast

**Source:** Same thread (sub-10 + sub-9 sections); TheCubicle elite/pro sections; Wikipedia CFOP
article (ZBLL, pseudoslotting); AI Cube Trainer FAQ

## 2. Scoring calibration — Weight shifts by time band

### 2.1 How the three sub-scores should be weighted

The default weights (improvement 40%, consistency 30%, frequency 30%) reflect an overall coaching
philosophy: improvement is most visible, consistency is second, and frequency is a prerequisite.
However, the *relative importance* of each axis shifts across time bands because the nature of
improvement changes.

| Time band | Improvement weight | Consistency weight | Frequency weight | Rationale |
|---|---|---|---|---|
| Sub-60 | 45% | 15% | 40% | Rapid gains are normal; frequency is critical because the solver is building habit. Consistency matters least because large CV is expected. |
| Sub-40 | 40% | 25% | 35% | Improvement is still fast; consistency starts to matter as the solver must sustain new skills (F2L, 2-look). |
| Sub-25 | 35% | 35% | 30% | Improvement slows; consistency becomes a signal of skill consolidation. Frequency still matters but less than focused practice. |
| Sub-15 | 30% | 40% | 30% | Improvement is slow; consistency is the primary signal of mastery. Frequency maintenance is needed but diminishing returns set in. |
| Sub-10 | 25% | 45% | 30% | Improvement is very slow; consistency dominates. Frequency is maintenance-level; raw volume has minimal marginal return. |

**PROPOSED** — no published study directly measures the correlation between these three axes and
improvement velocity at different levels. The shift is anchored to:
- Megasurvey finding that faster averages correlate with ≥1 h/day cadence ([HIGH], cross-sectional)
- Community convention that consistency CV < 10% = "good" at every level ([ANEC])
- Deliberate-practice literature (Ericsson et al., 1993) emphasizing quality over quantity, which
  supports reducing frequency weight at elite levels where quality dominates

**Implementation note:** The app could compute a composite score using level-adaptive weights
determined by the user's current session mean. The band boundaries (sub-60, sub-40, etc.) would
trigger weight shifts automatically.

### 2.2 Scoring each sub-score at each band

#### Improvement score (%/week of weekly mean, geometric)

The improvement axis should be scored against **stage-appropriate expectations**, not a single scale.
See research-scoring.md §2 for the full benchmark table. Key points:

| Band | Expected sustained rate | Score 50 = | Score 80 = |
|---|---|---|---|
| Sub-60 → sub-40 | −1.5 to −3%/wk | −1.0%/wk | −2.0%/wk |
| Sub-40 → sub-25 | −0.8 to −1.5%/wk | −0.6%/wk | −1.2%/wk |
| Sub-25 → sub-15 | −0.3 to −0.7%/wk | −0.3%/wk | −0.5%/wk |
| Sub-15 → sub-10 | −0.1 to −0.4%/wk | −0.15%/wk | −0.3%/wk |
| Sub-10 (maintenance) | −0.05 to −0.2%/wk | −0.05%/wk | −0.15%/wk |

**Source:** Derived from research-scoring.md §2 benchmarks (WCA cohorts, forum logs).

#### Consistency score (CV of raw singles)

> **Implementation note (2026-10-07):** the app computes this axis with `madCv` (robust, median-based, 1.4826 × MAD / median; `src/lib/stats.ts`). All CV bands in this doc carry over unchanged.

A single scale (not level-adjusted) is defensible based on the evidence in research-scoring.md §1:
measured CVs cluster at 8–15% regardless of level. However, **what counts as "good" consistency
varies in coaching value by level:**

| Band | CV < 10% means | CV > 15% means |
|---|---|---|
| Sub-60 | Not expected; flag for data quality | Normal — not actionable |
| Sub-40 | Good — skill is consolidating | Mild concern — check for inconsistent technique |
| Sub-25 | Good — execution is stable | Actionable — likely inconsistent F2L or last-layer recognition |
| Sub-15 | Expected — plateau signal if CV doesn't decrease | Strong concern — execution is unreliable |
| Sub-10 | Required — elite-level | Critical failure — fundamental technique issue |

**Source:** Community convention (< 10% = good, < 5% = excellent) from SpeedSolving "Standard Deviation"
thread (miniGOINGS & Cride5, 2010), https://www.speedsolving.com/threads/standard-deviation.18285/;
measured logs from research-scoring.md §1.

#### Frequency score (sessions/week)

No public benchmark exists (research-scoring.md §4.3). PROPOSED anchors:

| Band | "Good" frequency | "Excellent" frequency | Diminishing returns threshold |
|---|---|---|---|
| Sub-60 | 3–5 sessions/week (20–30 min each) | Daily | > 7 sessions/week adds little at this stage |
| Sub-40 | 5–7 sessions/week | Daily, 30–60 min | > 60 min/day shows diminishing returns |
| Sub-25 | 5–7 sessions/week, 30–60 min | Daily, 45–90 min | > 90 min/day: quality drops unless structured |
| Sub-15 | 5–7 sessions/week, 45–90 min | Daily, 60–120 min | > 2 hrs/day: fatigue reduces deliberate practice value |
| Sub-10 | 5–7 sessions/week, 60–120 min | Daily, 90–180 min | > 3 hrs/day: marginal; cognitive fatigue dominates |

**Source:** Megasurvey 2021 p.12 (N=1,501) — more frequency ↔ faster averages (cross-sectional);
Feliks Zemdegs interview (~30–60 min weekdays, 1+ hr weekends during peak improvement);
AI Cube Trainer FAQ ("15–30 minutes of focused practice is worth more than 2 hours of casual
solving"); CuberPal practice guide ("short attentive sessions repeated across the week are easier
to sustain than occasional marathons").

## 3. Drill content — Specific drills by time band

### 3.1 Sub-60 drills

| Drill | Purpose | Source |
|---|---|---|
| **Cross-on-bottom practice** — scramble, plan cross on bottom, execute without looking at cross pieces | Eliminate top-cross habit; enable F2L transition | Zubin Park sub-50 section; J Perm cross tutorial, https://jperm.net/3x3/cfop/cross |
| **F2L pair insertion (untimed)** — take scrambled cube, solve one F2L pair only, reset, repeat | Build intuitive F2L without time pressure | TheCubicle guide; CuberPal practice guide |
| **Finger trick drill** — practice double-flicks for U2, M2 moves; R/U triggers slowly | Build mechanical foundation | J Perm finger tricks video, https://www.youtube.com/watch?v=wLuVF9Dk3AQ |
| **2-look OLL/PLL recognition** — flash case on screen, name it, execute | Build recognition speed | AI Cube Trainer F2L/OLL trainer, https://aicubetrainer.com/faq |

**Session structure:** 5 min warm-up solves, 10 min F2L pair drill, 10 min 2-look drill, 5 min
timed solves. Total: 30 min.

### 3.2 Sub-40 drills

| Drill | Purpose | Source |
|---|---|---|
| **Cross-only timed solves** — time just cross from scramble, target < 5 sec | Cross efficiency | SpeedSolving "method of CFOP training" thread (2013), https://www.speedsolving.com/threads/a-method-of-cfop-speedcubing-training-that-yields-systematic-progress.39406 |
| **F2L case isolation** — scramble, solve only F2L (cross + 4 pairs), record time | Identify F2L weakness | Same thread; efattah's advice (2025), https://www.speedsolving.com/threads/averaging-25-seconds-on-3x3-with-cfop.94402 |
| **2-look OLL/PLL drill** — random case display, execute within 3 sec target | Automatize last layer | CuberPal spaced-repetition practice |
| **100-solve session** — timed, track Ao100, note biggest pauses | Build consistency and volume | Zubin Park sub-40 section |

**Session structure:** 5 min warm-up, 10 min cross-only drill, 10 min F2L-only drill, 15 min
normal timed solves. Total: 40 min.

### 3.3 Sub-25 drills

| Drill | Purpose | Source |
|---|---|---|
| **Slow solve with lookahead** — solve at 50% speed, never pause, track next pair continuously | Build F2L lookahead | SolveTheCube speedcubing guide; CuberPal F2L lookahead guide; Zubin Park sub-30 section |
| **Cross + 1 (C+1)** — plan cross AND first F2L pair during inspection, execute both without looking | Cross-F2L transition | Caiden Lee coaching (C+1 training); SpeedSolving training thread |
| **Full PLL drill** — random PLL case, execute within 2.5 sec | Automatize all 21 PLL algs | J Perm PLL trainer, https://jperm.net/algs/pll |
| **Back-slot F2L** — solve pairs into back slots only (R/U/L moves, no rotations) | Reduce rotations | Zubin Park sub-20 section |
| **Cross inspection drill** — take 15 sec inspection, plan entire cross (no turning) | Plan cross fully | CuberPal cross inspection trainer; Sub-X cross trainer, https://subx.guru/ |

**Session structure:** 5 min warm-up, 10 min slow-lookahead solves, 10 min C+1 drill, 10 min
PLL recognition drill, 10 min normal timed solves. Total: 45 min.

### 3.4 Sub-15 drills

| Drill | Purpose | Source |
|---|---|---|
| **Metronome F2L** — solve F2L to a metronome at target BPM, increasing BPM over sessions | Continuous turning at speed | SpeedSolving training thread (2013); recommended BPM target: ~200 for sub-15 |
| **OLL recognition trainer** — flash 57 OLL cases, target < 1 sec recognition | Eliminate OLL pause | J Perm OLL trainer; CuberPal algorithm practice |
| **PLL AUF drill** — solve PLL with correct U-adjustment without cube rotation | Eliminate PLL rotations | Zubin Park sub-15 section |
| **COLL/WV learning** — learn subset cases, drill 2–3 per session | Last-slot optimization | Same source; SpeedSolving wiki COLL page |
| **Eyes-crossed drill** — solve cross with eyes closed, then open for F2L transition | Cross-F2L seamlessness | SpeedSolving training thread |
| **TPS ramp** — do 20 solves at comfortable speed, then 10 at max TPS, compare efficiency | TPS vs efficiency balance | Sub-X TPS analysis; CuberPal practice guide |

**Session structure:** 5 min warm-up, 10 min metronome F2L, 10 min OLL/PLL recognition, 10 min
COLL/WV practice, 10 min normal timed solves, 5 min review. Total: 50 min.

### 3.5 Sub-10 drills

| Drill | Purpose | Source |
|---|---|---|
| **Full-solve reconstruction** — reconstruct 3 solves, identify worst phase, drill that phase | Micro-optimization | CuberPal solve analysis; efattah advice |
| **ZBLL learning** — learn subsets (start with T, U, Pi), drill 1–2 cases per session | Single-algorithm last layer | Speedcubedb ZBLL, https://speedcubedb.com/a/3x3/ZBLL; Wikipedia CFOP |
| **Pseudoslotting practice** — intentional D-layer misalignment for creative F2L | Efficiency gains | Wikipedia CFOP (Tymon Kolasiński technique) |
| **Competition simulation** — WCA-style inspection (+2/DNF rules), 5-solve Ao5 under pressure | Competition readiness | WCA regulations A3a1; CuberPal practice guide |
| **Color neutral drill** — solve on non-dominant cross color for 20 solves | Scramble advantage | Zubin Park sub-10 section |
| **Record & review** — film 5 solves, analyze pauses, identify micro-stops | Pause elimination | Zubin Park sub-20 section (recording solves); CuberPal review guidance |

**Session structure:** 5 min warm-up, 10 min ZBLL/COLL drill, 10 min competition simulation,
10 min reconstruction + targeted drill, 10 min free solves, 5 min review. Total: 50 min.

## 4. Diminishing returns — When each axis stops mattering

### 4.1 Consistency (CV)

> **Implementation note:** "CV" here is `madCv` (robust, median-based) — `src/lib/stats.ts`. Bands unchanged.

| CV range | Coaching value | Diminishing returns threshold |
|---|---|---|
| CV > 20% | **High** — indicates blow-ups, technique errors, or data quality issues | N/A (always actionable) |
| CV 15–20% | **High** — most solvers at this level have technique inconsistency that drilling can fix | N/A |
| CV 10–15% | **Medium** — "par" level; improvement likely comes from other axes | Starts diminishing around 12% |
| CV 8–10% | **Low-Medium** — good consistency; focus should shift to improvement or frequency | Diminishing returns begin |
| CV 5–8% | **Low** — "really good"; pushing further yields marginal benefit for most solvers | Strong diminishing returns |
| CV < 5% | **Very Low** — elite-level; further improvement in consistency requires solving volume + competition experience | Near-zero marginal return for coaching |

**Key finding:** Consistency matters most when CV > 15% (the "inconsistent" zone). Once CV drops
below 8%, the coaching value of further consistency improvement is minimal — the solver should
focus on improvement (technique) or maintain frequency.

**Source:** Community convention (SpeedSolving "Standard Deviation" thread); research-scoring.md §1
measured logs; Sub-X analysis tool explicitly states "the 2.1s standard deviation is the binding
constraint" at one solver's level, https://subx.guru/

### 4.2 Improvement rate

| Improvement rate | Coaching value |
|---|---|
| > −3%/wk | **Very High** — rapid improvement; don't interrupt it with technique changes |
| −1 to −3%/wk | **High** — healthy improvement; maintain current structure |
| −0.3 to −1%/wk | **Medium** — typical intermediate/advanced; drill weaknesses |
| −0.1 to −0.3%/wk | **Low** — maintenance mode; improvement is slow; consider plateau-breaking techniques |
| < −0.1%/wk (flat) | **High but different** — plateau; needs diagnosis (wrong drills? burnout? technique ceiling?) |
| Worsening (positive slope) | **Critical** — something is broken; review technique, volume, or motivation |

**Key finding:** Improvement rate has strong diminishing returns past sub-15. At sub-10, even
−0.1%/wk is good. The coaching value shifts from "keep improving fast" to "don't lose what you
have" and "diagnose plateaus."

**Source:** research-scoring.md §2 (WCA cohort data, forum logs)

### 4.3 Practice frequency

| Sessions/week | Coaching value |
|---|---|
| 0–1 | **High** — almost everyone improves with more frequency (at least until sub-30) |
| 2–4 | **Medium-High** — sufficient for steady improvement; sessions should be structured |
| 5–7 | **Medium** — daily practice is good but quality matters more than volume at this point |
| 8+ (multiple/day) | **Low** — diminishing returns; risk of burnout and mindless grinding |
| 14+ (2+ hrs/day) | **Very Low** — cognitive fatigue dominates; "there is no required daily solve count" (CuberPal) |

**Key finding:** Frequency has the strongest diminishing returns of all three axes. Moving from
0 to 3 sessions/week is transformative. Moving from 5 to 7 is modest. Moving from 7 to 14
is near-zero for most solvers. The exception: sub-10 solvers who do 1–2 hrs/day of *structured*
practice (drills + solves) can still benefit, but *unstructured* volume provides almost no return.

**Source:** Megasurvey 2021 (frequency↔average correlation); AI Cube Trainer FAQ ("quality beats
quantity"); CuberPal ("short attentive sessions repeated across the week are easier to sustain");
Feliks Zemdegs interview (~30–60 min weekdays during peak years)

## 5. Realistic benchmarks summary

| Metric | Sub-60 | Sub-40 | Sub-25 | Sub-15 | Sub-10 |
|---|---|---|---|---|---|
| **CV (raw singles)** | 12–20% (unmeasured at this level) | 10–15% | 9–12% | 7–10% | 5–8% |
| **Improvement rate (%/wk)** | −1.5 to −3% | −0.8 to −1.5% | −0.3 to −0.7% | −0.1 to −0.4% | −0.05 to −0.2% |
| **Sessions/week (good)** | 3–5 | 5–7 | 5–7 | 5–7 | 5–7 |
| **Time to next band** | 2–4 weeks | 2–4 months | 6–18 months | 1–3 years | 3–5+ years |
| **Alg count needed** | ~10 (2-look) | ~31 (2-look + PLL) | ~57+21 (full OLL+PLL) | ~78+ (OLL+PLL+COLL/WV) | ~130+ (add ZBLL subsets) |

**Source:** AI Cube Trainer FAQ timelines; research-scoring.md §2; community convention

## 6. Explicit gaps

1. **No longitudinal dose-response data** linking specific drill types to improvement velocity. All
   drill recommendations are coaching convention, not measured.
2. **No published CV distributions by time band** with large N. The 8–15% cluster rests on ~5
   datapoints + convention (research-scoring.md §1).
3. **No formal study of diminishing returns** in cubing practice frequency. The thresholds above
   are PROPOSED from cross-sectional survey data and coaching convention.
4. **No comparative study of drill effectiveness** (e.g., metronome F2L vs. slow-solve vs. PLL
   drill). Coaching recommendations are consensus-based, not experimentally validated.
5. **csTimer-specific scoring calibration** — no public documentation of how csTimer computes
   statistics (trimmed vs. raw, window sizes) that would affect CV calculation. See
   research-scoring.md §1 note on csTimer's trimmed stddev.

## Sources

1. TheCubicle, "How to Improve at Speedcubing?" (Damian Bias, Dec 2022) — https://www.thecubicle.com/blogs/thecubicle-blogs/how-to-improve-at-speedcubing
2. AI Cube Trainer, "Speedcubing FAQ: 25 Common Questions Answered" (Trevor, May 2026) — https://aicubetrainer.com/faq
3. CuberPal, "How to Practice Speedcubing" (Jul 2026) — https://www.cuberpal.com/blog/how-to-practice-speedcubing
4. SpeedSolving, "Help for cubers who want to beat sub-x (CFOP)" (Zubin Park, 2020–2021) — https://www.speedsolving.com/threads/help-for-cubers-who-want-to-beat-sub-x-cfop.77867
5. SpeedSolving, "A method of CFOP speedcubing training that yields systematic progress" (2013) — https://www.speedsolving.com/threads/a-method-of-cfop-speedcubing-training-that-yields-systematic-progress.39406
6. J Perm, "CFOP Speedsolving Method" — https://jperm.net/3x3/cfop
7. J Perm, "F2L" — https://jperm.net/3x3/cfop/f2l
8. J Perm, "Cross" — https://jperm.net/3x3/cfop/cross
9. SolveTheCube, "Speedcubing Guide" — https://solvethecube.com/speedcubing
10. Cubelelo, "How to be Sub-20 in 3x3" (Sarthak Masta, Nov 2022) — https://www.cubelelo.com/blogs/cubing/how-to-be-sub-20
11. CubeSkills (Feliks Zemdegs) — https://www.cubeskills.com/
12. Caiden Lee, coaching description — https://caidenlee.com/
13. Sub-X, speedcubing analytics — https://subx.guru/
14. CuberPal, "CFOP Solve Splits by Speed" — https://www.cuberpal.com/blog/cfop-solve-splits
15. CuberPal, "How to Improve F2L Lookahead" — https://www.cuberpal.com/guides/f2l-lookahead
16. CuberPal, "How to Get Sub-20 on 3x3" — https://www.cuberpal.com/guides/how-to-get-sub-20-on-3x3
17. CuberPal, "Cross Inspection Trainer" — https://subx.guru/ (cross inspection trainer section)
18. Cube.Academy, "How to be Sub x" — https://www.cube.academy/how-to-be-sub-x
19. Cubelelo, "Speedcubing Problems & Solutions" (Mar 2025) — https://www.cubelelo.com/blogs/cubing/solving-challenges-common-problems-and-how-to-overcome-them-in-speedcubing
20. SpeedSolving, "Standard Deviation" thread (2010) — https://www.speedsolving.com/threads/standard-deviation.18285/
21. r/Cubers Megasurvey 2021 — https://basilio.dev/cubing/megasurvey/CubingMegasurvey2021.pdf
22. r/Cubers Megasurvey 6 (2022) — https://basilio.dev/cubing/megasurvey6/CubingMegasurvey2022.pdf
23. M. Höhle, "Speedmining the Cubing Community" (2019) — http://staff.math.su.se/hoehle/blog/2019/05/06/wcamining.html
24. WCA Regulations (inspection rules) — https://www.worldcubeassociation.org/regulations/#article-A-speed-solving
25. Wikipedia, "Speedcubing" (CFOP, ZBLL, pseudoslotting) — https://en.wikipedia.org/wiki/Speedcubing
26. Speedcubedb, ZBLL — https://speedcubedb.com/a/3x3/ZBLL
27. Speedcubedb, Winter Variation — https://speedcubedb.com/a/3x3/WV
28. Speedcubedb, VLS — https://speedcubedb.com/a/3x3/VLS
29. Ericsson et al. (1993), "The Role of Deliberate Practice in the Acquisition of Expert Performance" — https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2019.02396/full (2019 reprint with commentary)
30. CuberPal, "Practice Speedcubing: A Better Session Plan" — https://www.cuberpal.com/blog/how-to-practice-speedcubing
31. Cubzor, "Free 3D Rubik's Cube Simulator: Practice Online" — https://www.cubzor.com/game/practice
32. F2L Trainer — https://f2l-trainer.top/
33. SpeedSolving wiki, "Feliks Zemdegs" — https://www.speedsolving.com/wiki/index.php/Feliks_Zemdegs
34. Interview with Feliks Zemdegs (2012) — https://www.speedsolving.com/threads/interview-with-feliks-zemdegs-march-2012.77096/
35. SpeedSolving, "How Many Solves I Need To Do Per Day?" (2019–2022) — https://www.speedsolving.com/threads/how-many-solves-i-need-to-do-per-day.74240/
36. csTimer GitHub README — https://github.com/cs0x7f/cstimer/blob/master/README.md
