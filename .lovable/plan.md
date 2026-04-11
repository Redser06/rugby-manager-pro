
# Playtest Report: "On the Gain Line" — Leinster Coach Simulation

## Test Summary
Played as Leinster Rugby (URC, reputation 90). Advanced from Week 1 to Week 5, explored Squad, Tactics, Training, Transfers, and Fixtures pages.

---

## Critical Bugs Found

### Bug 1: Matches are never simulated (BLOCKER)
The `advanceWeek()` function in `GameContext.tsx` only increments `currentWeek` by 1. It does **not**:
- Run the match simulator for the current week's fixture
- Update fixture status from "scheduled" to "completed"
- Record scores on the fixture
- Update league standings
- Apply fatigue, injuries, or form changes to players

After 4 weeks advanced, Fixtures page shows "0 Completed" and all past fixtures remain "Scheduled" with no scores. This is the central gameplay loop and it's completely missing.

### Bug 2: Standings page uses random data
`src/pages/Standings.tsx` generates standings using `Math.random()` on every render (lines 21-44). It doesn't read from `league.standings` or fixture results at all. Every time you visit the page, different random data appears.

### Bug 3: Dashboard standings widget is static
The dashboard shows "P: 0 | Pts: 0" because `league.standings` is initialized with zeros and never updated by match results.

### Bug 4: Player stats never change
After advancing weeks, Team Form (7.1/10), Injuries (0), and Squad Strength (75 avg) remain completely static. No fatigue, injury, or form processing occurs on week advance.

### Bug 5: Transfer window timing not tied to week progression
Transfer window shows "Closed — opens June 1" regardless of current week. There's no calendar/date mapping from game weeks to in-game months.

---

## What Works Well
- Team selection page — visually polished with reputation tiers
- Squad roster with contract data, wages, positions
- Tactics configuration (attack/defense style, scrum focus, lineout)
- Training system with session creation, group targeting
- Fixture generation (30 fixtures with home/away, weather, travel)
- Season narrative events (academy graduate event fired at Week 3)
- Match simulator exists as a standalone page (but disconnected from season)
- Transfer market with 1749 players, filtering, shortlisting

---

## Proposed Fix Plan

### 1. Wire match simulation into `advanceWeek` (Core fix)
**Files**: `src/contexts/GameContext.tsx`, `src/pages/Dashboard.tsx`

- When advancing a week, retrieve the current week's fixtures from the schedule
- For the player's team match: either auto-simulate or prompt to play live
- For all other league matches: auto-simulate with `simulateFullMatch`
- Update fixture status to "completed" and record scores
- Save updated schedule back to localStorage

### 2. Update league standings from results
**Files**: `src/contexts/GameContext.tsx` or new utility

- After simulating all matches in a week, recalculate `league.standings` from completed fixtures
- Update points (4 for win, 2 for draw, bonus points for 4+ tries or losing within 7)
- Store in GameState so dashboard and standings page read real data

### 3. Fix Standings page to use actual data
**File**: `src/pages/Standings.tsx`

- Replace `Math.random()` block with actual `league.standings` data from GameContext
- Sort by total points, then points difference

### 4. Apply player effects on week advance
**Files**: `src/contexts/GameContext.tsx`

- Process fatigue recovery/accumulation based on whether player played
- Roll for injuries using the existing injury system
- Update player form based on match performance ratings
- Apply training effects from assigned sessions

### 5. Connect transfer window to game calendar
**File**: `src/pages/Transfers.tsx` or `GameContext`

- Map game weeks to approximate months (e.g., Week 1 = September)
- Open/close transfer window based on game week ranges

### Technical approach
- The `advanceWeek` function becomes the central game loop orchestrator
- Move fixture schedule into GameContext (or pass it through) so it persists across page navigations
- Create a `simulateWeek()` function that coordinates: match sim → standings update → player effects → narrative events → calendar advance
