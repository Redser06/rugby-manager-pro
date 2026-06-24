# Lovable Build Prompt — Rugby Manager Pro

> Save-and-run doc. Paste everything inside the ``` block below into a fresh
> Lovable chat on this project. Before running tomorrow, paste any overnight
> UI-redesign direction into the **OWNER NOTES** section at the bottom (Lovable
> will read the whole file context if you also paste this header, or just the
> block — your call).
>
> Context: This repo is co-built by two agents pushing to the same GitHub repo.
> Claude Code owns the engine/logic; Lovable owns the screens/visual layer.
> Read `/PLAN.md` first for full scope and priorities.

---

```
You are working on "Rugby Manager Pro", a rugby-union management sim
(Vite + React + TypeScript + shadcn/ui + Tailwind + Supabase). This repo is
being built by TWO collaborators pushing to the SAME GitHub repo (origin/main):

  1. CLAUDE CODE (a CLI agent) — owns the ENGINE and LOGIC:
     game loop, match simulator, season rollover, fixtures, standings,
     transfers/loans, player development, international calendar,
     national-team engine, eligibility, CI, tests, bug fixes.
  2. LOVABLE (you) — owns the SCREENS and VISUAL/UX layer:
     pages, components, layouts, match presentation, editors,
     onboarding, polish, theming, mobile.

IMPORTANT — READ THE PLAN FIRST
Before doing anything, read /PLAN.md at the repo root (and .lovable/plan.md
for historical context, though it is now stale). PLAN.md contains the full
launch roadmap (P0–P3), the locked product decisions, the state-of-health
diagnosis with file:line references, and the build sequence. Treat PLAN.md as
the source of truth for scope and priorities. Do not contradict it.

═══════════════════════════════════════════════════════════════════
COLLABORATION MODEL — WHO BUILDS WHAT
═══════════════════════════════════════════════════════════════════

Claude Code is implementing (DO NOT touch these engine files unless asked):
  - src/engine/* (seasonRollover.ts [new], gameLoop.ts, matchSimulator.ts,
    setPieces.ts, nationalTeam.ts [new], eligibility.ts [new], loans.ts [new],
    academy.ts, fatigue.ts, injuryRehab.ts, retirement.ts, playerPsychology.ts)
  - src/utils/fixtureGenerator.ts
  - src/contexts/GameContext.tsx (state shape + advanceWeek logic)
  - src/contexts/TransferContext.tsx, SixNationsContext.tsx (logic)
  - src/data/internationals.ts [new], leagues.ts, europeanCompetitions.ts
  - Supabase migrations, CI (.github/workflows), env validation, tests

Lovable (you) should build:
  - New pages: NationalSetup.tsx, NationalDashboard.tsx, RosterEditor.tsx,
    SeasonSummary.tsx (end-of-season), MatchExperience.tsx (rich match view),
    Paywall / trial-gate modal.
  - Existing-page UI refinement: Dashboard "Play this week's match" card,
    MatchSimulation presentation, Tactics editor surfaces, Squad/Standings/
    Fixtures visual polish, Academy/Training visual states.
  - Cross-cutting: onboarding first-run coachmarks, keyboard shortcuts,
    broadcast-skin theming, loading/empty/error states everywhere, mobile
    responsiveness, new-game vs. continue confirmation flow.

═══════════════════════════════════════════════════════════════════
GITHUB SYNC RULES (CRITICAL)
═══════════════════════════════════════════════════════════════════

Because two of us push to origin/main, follow these rules religiously:

1. ALWAYS pull / sync the latest from main before generating code. Claude Code
   pushes engine commits (e.g. a new src/engine/seasonRollover.ts, or changes
   to GameContext state shape). If you build UI against a stale version you
   will generate broken imports and mismatched data shapes.
2. When Claude Code has shipped an engine feature, he will describe the
   DATA CONTRACT it exposes (the shape of state/results the UI should render).
   Build your UI strictly against that contract — do not invent parallel state.
   If a field you need isn't exposed yet, STOP and flag it rather than
   duplicating the logic in the UI layer.
3. Never rewrite or "clean up" files under src/engine/, src/utils/fixtureGenerator,
   or the logic inside src/contexts/*. You may IMPORT from them and render
   their output. If you believe an engine function is buggy, note it in a
   comment and tell me — do not fix it yourself (Claude Code owns correctness
   there and will re-sync).
4. Put all shared state in GameContext (existing pattern). Do NOT create new
   local component state for things that must persist across navigation
   (assigned training sessions, tactics, academy prospects, roster edits,
   national squad selection). This was a major cause of bugs in the current
   codebase (Training, Academy, PlayerExtended all lived in throwaway local
   state). Persist via the existing GameContext + localStorage/Supabase
   patterns.
5. Match existing conventions: shadcn/ui components, Tailwind, lucide-react
   icons, the AppSidebar/GameLayout nav structure, react-router-dom routes,
   the ThemeContext for theming. Use the existing toast (sonner) for feedback.
6. After your changes, run `npm run build` and `npm run lint` and make sure
   they pass before committing. Claude Code runs `npm test` (vitest) on the
   engine; keep your UI changes from breaking the build.

═══════════════════════════════════════════════════════════════════
WHAT TO BUILD — IN THIS ORDER
═══════════════════════════════════════════════════════════════════

PHASE A — UNBLOCKED NOW (no dependency on Claude Code's engine work):
Build these first; they only need existing state/data.

  A1. NEW-GAME / CONTINUE FLOW + onboarding
      - TeamSelection currently lets you pick a team and silently overwrites
        an existing season. Add a first-run gate: if a season already exists
        in localStorage, show "Continue [team] (Season X, Week Y)" vs
        "Start new career". P0.6 item in PLAN.md.
      - First-run coachmarks overlay for the main nav (Squad, Tactics,
        Training, Fixtures, Match, Standings). Dismissible, remembered.
      - Keyboard shortcuts: "n" = advance week, number keys for nav sections.
        Surface in a help popover.

  A2. GLOBAL POLISH PASS
      - Audit every page in src/pages/* for: loading states, empty states,
        error states, mobile layout (the sidebar should collapse to a drawer
        on mobile). Fix the invalid Tailwind class `lg:grid-cols-15` in
        Dashboard.tsx (it's not a real class — use a valid grid or flex).
      - Standings, Squad, Fixtures, Transfers: make tables responsive and
        readable on phone.

  A3. END-OF-SEASON SUMMARY SCREEN (SeasonSummary.tsx)
      - Claude Code is building src/engine/seasonRollover.ts which, on the
        final week, will produce a season-end result object: final league
        position, trophy/relegation/promotion status, European qualification,
        top performers, academy graduates, retirements, financials summary,
        and the next season's setup. Build a rich, celebratory summary
        screen that renders this. Until the engine ships, build the page
        against the documented contract (below) and stub the data. This is
        the single biggest "career feels real" moment — invest in it.
        DATA CONTRACT (Claude Code will produce this shape from seasonRollover):
          SeasonResult {
            season: number;
            team: Team;
            leagueFinalPosition: number;
            trophy?: { competition: string; name: string };
            relegated?: boolean; promoted?: boolean;
            europeanQualified?: string; // competition name
            topPerformers: { player: Player; rating: number; tries: number }[];
            academyGraduates: Player[];
            retirements: Player[];
            contractExpiries: Player[];
            financials: { revenue: number; wages: number; profit: number };
            nextSeasonPreview: { competitions: string[]; keyFixtures: string[] };
          }
      - Add a route and a "View season summary" entry from Dashboard once
        the season is complete.

PHASE B — WAIT FOR CLAUDE CODE'S ENGINE COMMITS, THEN BUILD:
I will tell you when each engine piece is on main. Build the matching UI then.

  B1. MATCH EXPERIENCE (depends on Claude Code P0.3)
      He is rewiring MatchSimulation to load the CURRENT WEEK'S scheduled
      fixture (not a random opponent) and preserving the rich match output
      (events, minute-by-minute commentary, player ratings, MOTM, discipline,
      cards) instead of discarding it behind a stale toast.
      You build:
      - A Dashboard "Play this week's match" card (shows opponent, venue,
        weather, kickoff; "Play"/"Auto-sim" buttons).
      - MatchExperience.tsx: a rich match view that renders the engine's
        output — a live commentary feed, scoreboard, key events timeline
        (tries, penalties, cards, subs), player ratings table, MOTM,
        post-match stats. Make it feel like a broadcast. This is the genre's
        core fantasy; make it gorgeous.
      DATA CONTRACT (he will expose via GameContext.lastMatchResult):
        { homeTeam, awayTeam, homeScore, awayScore, scorers, events[],
          minuteLog[], playerRatings{home[],away[]}, motm, discipline{cards[]},
          possession, territory }

  B2. TACTICS EDITOR (depends on Claude Code P0.2)
      He is wiring team.tactics + ExtendedTactics into the match simulator so
      tactics actually affect results, and persisting ExtendedTactics via
      GameContext (not local Tactics.tsx state).
      You build: the Tactics and StrikePlayEditor page UI surfaces on top of
      the persisted state — attack/defense style, scrum focus, lineout primary,
      tempo, risk, pod shape, backs moves, kicking strategies, defensive
      back-three shape. Show a clear "these choices will affect results"
      affordance once wired. Make strike plays visual (a pitch diagram
      for pod/move placement would be a delight feature — nice to have).

  B3. NATIONAL-TEAM MODE SCREENS (depends on Claude Code P1.2/P1.3)
      He is building src/engine/nationalTeam.ts + eligibility.ts and exposing
      national-mode state through GameContext (separate from club mode; no
      weekly domestic sim, a Test-window calendar).
      You build:
      - NationalSetup.tsx: choose a nation (not a club), difficulty, then
        enter the national career.
      - NationalDashboard.tsx: upcoming Tests (Six Nations, autumn, summer
        tours, Rugby Championship, Lions, World Cup), squad selection from
        eligible players across all clubs (show eligibility badge: birth /
        residency / ancestry), world rankings, squad depth by position.
      - A Test-match experience (reuse MatchExperience styling).

  B4. ROSTER EDITOR + IMPORT/EXPORT (depends on Claude Code P1.10)
      He is building the Excel/CSV import-export logic over exceljs and
      src/utils/squadImportExport.ts, plus validation.
      You build: RosterEditor.tsx — an editable table UI for players/clubs,
        import-from-file flow (drag-and-drop CSV/XLSX), export button, and a
        "make names real" quick-action. This is a headline feature (we ship
        fake names by default; users edit/import to make real).

  B5. PAYWALL / TRIAL GATE (depends on Claude Code P1.11)
      He is building the entitlement engine (src/engine/entitlement.ts):
        free trial = first HALF of season 1; gate fires when currentWeek
        exceeds totalWeeks/2 in season 1; gate BLOCKS advanceWeek + new saves
        but allows viewing state; one-time IAP unlock removes the gate.
      You build: the paywall surface — a modal/blocker that appears when the
        user tries to advance past mid-season of year 1, explaining the
        trial, showing price, with "Unlock now" (IAP) and "Keep browsing"
        (non-blocking; they can still view everything). Make it feel like a
        fair trial, not a hard wall mid-action.

═══════════════════════════════════════════════════════════════════
OWNER NOTES (overnight UI-redesign direction)
═══════════════════════════════════════════════════════════════════
Paste your overnight UI-redesign direction below this line before running the
prompt tomorrow. Anything here overrides the visual guidance above for the
screens it touches; engine/data-contract rules still stand.

> [OWNER: add redesign notes here — e.g. new design system, palette, layout
>  grid, component library changes, specific screens to restyle, before/after
>  references, typography, spacing scale, dark/light defaults.]

═══════════════════════════════════════════════════════════════════
GUARDRAILS / CONVENTIONS (recap)
═══════════════════════════════════════════════════════════════════
- Read PLAN.md first; respect its scope and priorities.
- Pull latest from main before generating (Claude Code pushes engine commits).
- Build UI only against documented data contracts; flag missing fields,
  don't duplicate engine logic.
- Don't modify src/engine/*, fixtureGenerator.ts, or context logic.
- All persistent state goes in GameContext; never throwaway local state.
- shadcn/ui + Tailwind + lucide + sonner toasts; AppSidebar/GameLayout nav;
  react-router routes; ThemeContext for theming.
- Build + lint must pass before commit.
- Mobile-first responsiveness throughout; this ships as a Capacitor-native
  app (App Store + Google Play), so touch targets and phone layouts matter.

═══════════════════════════════════════════════════════════════════
START HERE
═══════════════════════════════════════════════════════════════════
Begin with PHASE A only (A1 onboarding/new-game-continue flow, A2 global
polish pass, A3 SeasonSummary screen against the stubbed data contract).
Do not start PHASE B until I confirm the corresponding engine commits are
on main. Confirm you've read PLAN.md before you start, and tell me which
A-item you're tackling first.
```