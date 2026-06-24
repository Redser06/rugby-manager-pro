# Rugby Manager Pro — Launch Plan & Roadmap

> Owner decisions locked 2026-06-24. This is the working execution plan, not a pitch.
> Companion: `.lovable/plan.md` (older playtest report — now **stale**; its #1 blocker "matches never simulated" is FIXED).

---

## 1. Vision & scope decisions

A provincial-and-national **rugby union management sim** for the hardcore "Football Manager for rugby" audience. Two career modes at launch:

- **Club mode** — manage a URC / Premiership / Top 14 / Super Rugby Pacific club across domestic + European seasons.
- **National mode** — manage a Tier-1/2 nation across the Test calendar (Six Nations, Rugby Championship, autumn internationals, July tours, Lions tours, World Cup cycle).

### Locked product decisions
1. **Full multi-competition world at launch** — all leagues simulate weekly; European cups (Champions/Challenge) advance rounds and reset on season rollover; overlapping domestic + European + international calendar.
2. **Fake names by default; user edits/uploads to make real.** Ship an in-app roster/club editor + CSV/Excel import-export. This is a feature (reuses `src/utils/squadImportExport.ts` + `exceljs`), not a licensing burden.
3. **Transfer realism = light abstraction.** Mostly contract-expiry free moves + occasional early release. Drop release-fee/buyout/selling-club-consent complexity. Still must implement functional offers (AI accept/reject of the player's incoming club offers; player actually joins the squad — today the loop is a dead end and no signing can occur).
4. **Loans & dual-registration required.** The primary real-world squad-building mechanism — non-negotiable for authenticity.
5. **National-team mode = launch scope.** Distinct setup flow, Test-window calendar, nation squad drawn from eligible players across all clubs, no weekly domestic sim.
6. **Monetization = freemium trial → one-time paid download (IAP unlock).** Trial threshold TBD (owner floated "2 matches"; see §6 recommendation).
7. **No women's rugby** (perceived no gamer market). Out of scope.

---

## 2. State of health (diagnosis)

### What works now (verified)
- **Core weekly loop**: `advanceWeek()` → `simulateWeek()` (`GameContext.tsx:99-130`, `gameLoop.ts:96-303`); fixtures found, simulated, marked completed, persisted to localStorage.
- **Real standings**: `Standings.tsx` / `Dashboard.tsx` read `league.standings` with rugby-correct points (4 W / 2 D, losing BP within 7, try BP).
- **Basic player effects**: fatigue, ~5% injury roll, form, bye-week recovery (`gameLoop.ts:244-292`).
- **Schedule persistence**: keyed `fixtures-<leagueId>-<season>`, rehydrated on load.
- **Rugby-literate subsystems** (marketing strengths): set-piece micro-engines (scrum/lineout/maul), in-match fatigue engine (bomb-squad advantage), discipline/TMO (real ref pool), staff→engine bonuses (Schmidt/Gatland/Erasmus), scouting engine, academy feeder-school data, multi-currency + salary-cap concept.

### Rejection-level blockers (must fix to ship)
1. **No season rollover** — `currentSeason` never increments; nobody ages/declines/retires/develops; contracts never expire; academy never produces regens; European cups never reset. **There is no career until this exists.**
2. **Tactics are cosmetic** — `team.tactics` + `ExtendedTactics` are never read by `matchSimulator.ts`/`setPieces.ts`. Weekly tactical decisions have zero effect on results.
3. **Match page disconnected** — `MatchSimulation.tsx` picks a *random* opponent and writes nothing back; the real fixture is auto-simmed and the rich output (commentary, ratings, MOTM) is discarded behind a stale toast.
4. **Regulation 9 not enforced** — called-up players still play club matches during Test windows; domestic fixtures run straight through international windows.
5. **Transfer loop is a dead end** — no AI accept/reject, no player joins squad, no incoming offers.
6. **Only the player's league simulates** — every other table stays 0/0/0; cross-league standings and European qualification by standing are impossible.
7. **No loans/dual-reg** — absent from types and engine.
8. **No international calendar or national-team career** — Six Nations call-ups exist in `SixNationsContext` but the broader Test calendar (autumn, RC, Lions, July tours, World Cup) and a nation-manager loop don't exist.
9. **Salary cap silently broken for 3/4 leagues** — `SALARY_CAP_RULES` keys (`'Premiership','URC','Super Rugby'`) never match real names (`'Gallagher Premiership','United Rugby Championship','Super Rugby Pacific'`).

### Visible authenticity bugs (credibility killers)
- Sin-binned/red-carded players **not removed from the on-field set** — a carded player can *score a try while off the pitch*; infringers chosen from top-15 without on-field filter (`matchSimulator.ts:348`).
- AI-vs-AI quick-sim is rugby-unrealistic: flat random scores (not 5/7/3/2 multiples), tries back-derived as `floor(score/7)`, **only the human team's players ever tire or get hurt** (`gameLoop.ts:32-72`).
- Match macro-loop is an "event slot machine" — each minute rolls a fresh field position with no territorial continuity; ruck contest essentially absent.
- `PlayerExtended` (aging, decline, milestones, caps, happiness) is defined-but-never-called; lives only in component state.
- Training is cosmetic (unpersisted local state; `TrainingEffect` never produced).
- Academy promotion is a no-op (`promoteToFirstTeam` imported, never called).
- European cups init once, never advance/reset; pool matches only generate between different-league teams (unbalanced).
- Share is localStorage-only — a `/share/:code` link shows "Not Found" to anyone else.
- `.env` (Supabase anon key) committed to git; `.gitignore` doesn't exclude it.
- Zero real tests (only `example.test.ts`); no CI pipeline.

---

## 3. Build roadmap

Effort: S / M / L / XL.

### P0 — ship-blockers (cannot launch without)
| # | Item | Effort | Touches |
|---|------|--------|---------|
| P0.1 | **Season rollover orchestrator** — detect final week, `currentSeason++`, regen fixtures, reset standings, age++ all players, decrement contract years, fire academy intake, reset European cups. New `engine/seasonRollover.ts` called from `advanceWeek`. | L | `GameContext.tsx`, new `engine/seasonRollover.ts`, `fixtureGenerator.ts`, `gameLoop.ts`, `europeanCompetitions.ts`, `leagues.ts` |
| P0.2 | **Wire tactics into match sim** — `team.tactics` + `ExtendedTactics` drive `matchSimulator.ts`/`setPieces.ts`; persist ExtendedTactics via GameContext (not local `Tactics.tsx:130` state). | L | `matchSimulator.ts`, `setPieces.ts`, `Tactics.tsx`, `GameContext.tsx`, `tactics.ts` |
| P0.3 | **Play your scheduled fixture** — `MatchSimulation.tsx` loads current week's fixture (not random opponent); on completion writes scores + events/commentary/ratings/MOTM to the fixture; preserve rich output in `gameLoop.ts:134-145`; fix stale-toast closure bug; add Dashboard "Play match" button. | M | `MatchSimulation.tsx`, `Dashboard.tsx`, `gameLoop.ts`, `GameContext.tsx` |
| P0.4 | **Simulate all leagues weekly** — `generateSeasonFixtures` builds for every league; `simulateWeek` iterates all; standings recalc per league. | M | `fixtureGenerator.ts:186`, `gameLoop.ts:108-110,185-188` |
| P0.5 | **Enforce Regulation 9** — during Test windows, filter called-up players out of club lineups; skip/pause domestic fixtures per `internationalBreaks`; propagate Test injuries/suspensions back via `updatePlayer`. Needs the international calendar (shared with P1.4). | M | `gameLoop.ts`, `matchSimulator.ts`, `SixNationsContext.tsx`, `fixtureGenerator.ts`, new `data/internationals.ts` |
| P0.6 | **Critical UI safety** — nation-select silently assigning `LEAGUES[0].teams[0]` (`TeamSelection.tsx:194-198`); invalid `lg:grid-cols-15` (`Dashboard.tsx:352`); remove `.env` from git + `.gitignore`; new-game/continue confirmation so picking a team doesn't overwrite an existing season. | S | `TeamSelection.tsx`, `Dashboard.tsx`, `.gitignore`, git history |

### P1 — launch-complete (national mode + the career loop)
| # | Item | Effort | Touches |
|---|------|--------|---------|
| P1.1 | **International calendar data** — autumn internationals, Rugby Championship, July tours, Lions tours, World Cup cycle + qualifying, plus Six Nations home/away rotation. Foundation for both P0.5 (club Reg-9) and P1.2 (national mode). | L | new `data/internationals.ts`, `SixNationsContext.tsx` generalized, `sixNationsData.ts` |
| P1.2 | **National-team career mode** — new setup flow (choose nation, not club); Test-window loop (no weekly domestic sim); nation squad drawn from eligible players across all clubs; rankings; World Cup cycle. New `engine/nationalTeam.ts`, `pages/NationalSetup.tsx`, `pages/NationalDashboard.tsx`. | XL | new `engine/nationalTeam.ts`, new pages, `GameContext.tsx`, `gameLoop.ts` |
| P1.3 | **Eligibility engine** — birth/residency/ancestry rules for national selection; player.nationality + residency tracking; `isEligible(nation, player)`. | M | new `engine/eligibility.ts`, `playerExtended.ts`, `nationalTeam.ts` |
| P1.4 | **Transfer completion (simplified)** — contract-expiry free moves; AI accept/reject of the player's incoming club offers (based on squad need, wage, reputation); player moves into buyer squad; fix `SALARY_CAP_RULES` keys + SH window detection. | M | `TransferContext.tsx`, `transfer.ts`, `OfferDialog.tsx`, `agentSystem` |
| P1.5 | **Loans & dual-registration** — loan contract type (duration, recall, playing-time rules); dual-reg so a player registers to two clubs; UI in Transfers. | L | new `engine/loans.ts`, `transfer.ts`, `Transfers.tsx` |
| P1.6 | **European cup advancement** — advance `currentRound`; pool→knockout transition; reset on season rollover; fix pool match generation (allow same-league pairings, balanced schedule); fix knockout R16 null-away pairing. | M | `europeanCompetitions.ts`, `EuropeanCups.tsx` |
| P1.7 | **Wire PlayerExtended into the loop** — `simulateWeek` calls `weeklyDevelopment`, `applyAgingDecline`, `rollForInjury` (with matchMinutes), `updateForm`, `updateConfidenceAfterMatch`, `updateHappinessWeekly`, `checkMilestones`, `weeklyIntegration`; persist PlayerExtended to game state; unify `Player.form` and `rollingForm`; increment caps. | L | `gameLoop.ts`, `playerPsychology.ts`, `retirement.ts`, `injuryRehab.ts`, `GameContext.tsx`, `Squad.tsx` |
| P1.8 | **Training effects** — persist assigned sessions; produce `TrainingEffect`; apply to attributes; staff coachingQuality modifies gains. | M | `Training.tsx`, `training.ts`, `gameLoop.ts`, `staff.ts` |
| P1.9 | **Academy promotion + persistence** — call `promoteToFirstTeam` in `handlePromote`; persist prospects/feeders to game state. | S | `Academy.tsx`, `GameContext.tsx` |
| P1.10 | **Roster editor + import/export** — in-app editor for players/clubs/competitions; CSV/Excel import; user makes names/rosters real. Reuses `squadImportExport.ts` + `exceljs`. | M | new `pages/RosterEditor.tsx`, `squadImportExport.ts`, `data/leagues.ts` |
| P1.11 | **Freemium trial gate + IAP unlock** — trial to a threshold (§6); one-time unlock purchase; gate persisted per account/device. | M | new `engine/entitlement.ts`, `GameContext.tsx`, paywall UI |
| P1.12 | **Real share** — Supabase-backed season snapshots (table + RLS) replacing localStorage-only `useSeasonShare`. | M | `useSeasonShare.ts`, `ShareView.tsx`, new Supabase table |
| P1.13 | **PWA + native packaging** — manifest, service worker (`vite-plugin-pwa`); Capacitor wrapper for App Store/Google Play (the paid-download channel, §5). | M | `public/`, `vite.config.ts`, new capacitor config |
| P1.14 | **CI + env validation + error reporting** — GitHub Actions (lint, build, test); zod env check so missing Supabase config fails loudly; Sentry. Add real unit tests (currently only `example.test.ts`). | M | `.github/workflows/`, `src/test/`, new env check |

### P2 — depth (turns a season into a career)
| # | Item | Effort | Touches |
|---|------|--------|---------|
| P2.1 | Fix sin-bin/red-card on-field bug; infringer on-field filter; fatigue divisor = actual on-field count. | S | `matchSimulator.ts:348,580,506-509` |
| P2.2 | Ruck simulation + minute-to-minute territorial continuity; chain penalty-to-corner → lineout. | L | `matchSimulator.ts`, `setPieces.ts` |
| P2.3 | Domestic playoffs/knockout finals (URC, Top 14, Premiership) + promotion/relegation (Pro D2↔Top 14). | L | `fixtureGenerator.ts`, `gameLoop.ts`, new `engine/playoffs.ts` |
| P2.4 | Domestic cup competitions (Prem Cup, Coupe de France, URC Shield) + overlapping domestic/European calendar with European rounds in specific weeks. | M | `fixtureGenerator.ts`, `europeanCompetitions.ts` |
| P2.5 | Real league rosters (drop fictional/relegated filler — Caledonia Reds, Roma Leoni, Worcester, London Irish, etc.; Top 14=14, Prem=10-12); URC shield/conference structure. | M | `leagues.ts` |
| P2.6 | AI-vs-AI quick-sim realism — 5/7/3/2 score multiples, real try/penalty breakdown, fatigue/injury attrition on AI squads (removes human-only attrition asymmetry). | M | `gameLoop.ts:32-72` |
| P2.7 | Six Nations deeper sim — tactics/squad-quality inputs (not reputation+random); home/away rotation by year. | S | `sixNationsData.ts`, `SixNationsContext.tsx` |

### P3 — delight (signals seriousness to the hardcore)
| # | Item | Effort | Touches |
|---|------|--------|---------|
| P3.1 | 2024-25 Champions Cup single-pool format (currently pre-2024 4-pools-of-6). | M | `europeanCompetition.ts`, `europeanCompetitions.ts` |
| P3.2 | HIA/blood-substitution protocol, penalty try, captain's challenge, graduated return-to-play. | M | `matchSimulator.ts`, `injuryRehab.ts` |
| P3.3 | 3D replay wired in (`replayGenerator` → match playback UI). | L | `replayGenerator.ts`, `replay.ts`, new replay UI |
| P3.4 | Onboarding first-run coachmarks; keyboard shortcuts (advance week, nav). | S | new components, `AppSidebar.tsx` |
| P3.5 | Sabbatical / short-term overseas deals (NH→Japan); distinct academy contract tier. | M | `transfer.ts`, `contractGenerator.ts` |
| P3.6 | Normalized rugby DB schema (seasons/leagues/teams/fixtures) for cross-user analytics + shared league state (only if multiplayer ever scoped). | L | Supabase migrations, `GameContext.tsx` |
| P3.7 | Central/provincial contract types (IRFU, NZRU) + EQP/JIFF/overseas quotas as roster-composition constraints. | L | `transfer.ts`, `contractGenerator.ts`, `TransferContext.tsx` |

---

## 4. Recommended build sequence (first phase)

Do these in order — each unblocks the next:
1. **P0.1 Season rollover** — unblocks aging/decline/retirement/development/contract-expiry/European-reset in one move.
2. **P0.3 Play your scheduled fixture + fix stale toast** — the single biggest immersion fix; restores the genre's core fantasy.
3. **P0.2 Wire tactics into the sim** — makes the tactical interface matter.
4. **P0.4 Simulate all leagues** — prerequisite for multi-competition + European qualification by standing.
5. **P1.1 International calendar data** — foundation for P0.5 and P1.2.
6. **P0.5 Enforce Regulation 9** — uses the calendar from #5.
7. **P0.6 Critical UI safety** — small, do alongside the above.
8. **P1.2 + P1.3 National mode + eligibility** — the largest launch workstream; start the data/scaffolding early in parallel with #1-7.
9. **P1.4 Transfer completion** + **P1.5 Loans/dual-reg** — functional squad-building.
10. **P1.7 PlayerExtended** + **P1.8 Training** + **P1.9 Academy** — the development loop.
11. **P1.10 Roster editor**, **P1.11 Freemium/IAP**, **P1.13 PWA/native**, **P1.14 CI** — shipping hardening.

---

## 5. Distribution & monetization

- **Channel:** paid-download-with-trial fits **native app stores** (Capacitor → iOS App Store + Google Play, optionally Steam for desktop). Web has no native trial/purchase primitive — use web only as a storefront/demo landing page. P1.13 packages the existing PWA-able app.
- **Trial gate:** free-to-play to a threshold; one-time IAP unlock thereafter. Threshold in §6.
- **Build/host:** `npm run build` → static SPA; Supabase kept for auth + saves + shared snapshots. Remove `.env` from git history; add `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` to host env. zod env check (P1.14).
- **Auth:** Supabase email/password + Google/Apple already work; keep. Anonymous/offline play retained for trial retention; prompt "sign in to save your career" on first week-advance.
- **Saves:** localStorage today is single-device; cloud auto-sync (write `rugbyManagerState` to `game_saves` debounced on week advance) becomes the key cross-device feature post-purchase. Until then, the trial is local.

### GTM (rugby audience)
- Communities: r/rugbyunion, r/rugbycoach, RugbyPass Forum, Eggchasers socials, URC/Prem/Top 14 fan X accounts, the Rugby Network.
- Content-led launch: "design diary" on the scrum/lineout/maul engine and the fatigue/bomb-squad model — the authenticity *is* the marketing.
- Influencer: one mid-size rugby YouTuber (Squidge, Wiggle, or an FM-creator crossover) with a pre-launch build; a 20-min Six Nations playthrough is the highest-leverage asset.
- Beta the hardcore first (post-P0) to pressure-test authenticity before launch.
- Timing: target the November autumn window or the Six Nations (Feb–Mar) — peak rugby attention.

---

## 6. Open decision: trial threshold

Owner floated **"2 matches."** **Recommendation: free trial = a full first season (or first ~8 match weeks); paywall = continuing into season 2+.**

Why: a management game sells on the *career loop*, not a single fixture. Two matches demo set pieces and a sin-bin but not aging, development, academy intake, tactics compounding, or a title race — the things that retain. A full first season free lets the player fall in love with the whole loop *and* gates the exact thing that retains them (continuity into year 2+). It converts better than 2 matches and costs nothing.

→ **Pending owner confirm:** stick with ~2 matches, or adopt the full-first-season gate.

---

## 7. Open questions for the owner (final small set)
- **Q-Trial:** 2-match gate vs. full-first-season gate? (§6)
- **Team counts:** drop fictional/relegated filler clubs and model real 2025-26 rosters (Top 14=14, Prem=10-12)? (affects P2.5 realism)
- **National mode depth at launch:** full World Cup cycle + qualifying, or launch with the core annual Test calendar (6N + autumn + summer) and add the World Cup cycle shortly after?
- **Real-data import:** ship a default fictional roster set that's internally consistent across all launch competitions, or lean entirely on user-imported rosters from day one?

---

## 8. Source map (key files)
`src/contexts/GameContext.tsx` · `src/engine/gameLoop.ts` · `src/engine/matchSimulator.ts` · `src/engine/setPieces.ts` · `src/utils/fixtureGenerator.ts` · `src/data/europeanCompetitions.ts` · `src/data/leagues.ts` · `src/data/sixNationsData.ts` · `src/contexts/SixNationsContext.tsx` · `src/contexts/TransferContext.tsx` · `src/types/transfer.ts` · `src/pages/Dashboard.tsx` · `src/pages/MatchSimulation.tsx` · `src/pages/TeamSelection.tsx` · `src/pages/Standings.tsx` · `src/pages/Academy.tsx` · `src/pages/Training.tsx` · `src/pages/Tactics.tsx` · `src/utils/squadImportExport.ts` · `.lovable/plan.md`