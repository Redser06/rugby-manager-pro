
# Match Engine & Game Systems Overhaul

## Phase 1: Core Types & Data Models
Extend the type system to support all new mechanics:
- **Player model extensions**: fatigue, discipline, confidence, ego, archetype, caps, milestones, chronic injuries, ceiling (hidden potential), form history, integration status
- **Match engine types**: MatchStats (possession, territory, tackles, metres, phases, rucks), referee system, weather, substitution plan, TMO events, cards with sin-bin timing
- **Staff types**: specialist coaching staff roles (scrum coach, kicking coach, defence coach, analyst, psychologist, nutritionist)
- **Contract extensions**: agent system, French leverage for Irish players, cultural fit, integration period

## Phase 2: Set-Piece Engine
- **Scrum**: Dynamic engagement with loosehead/tighthead battle. Pack weight + technique = dominance. Ref bias affects penalty tendency. Dominant scrum degrades opposition 9/10 ball quality
- **Lineout**: Repertoire of calls (8-10). Opposition scouting over matches. Hooker throwing accuracy + jumper aerial ability. Lineout coach expands repertoire
- **Maul**: Post-lineout catch→set→drive sequence. Pack weight + technique determines drive success. Defence can sack (risky) or hold. Training investment required

## Phase 3: Match Simulation Engine Rewrite
Replace the current random-event loop with attribute-driven simulation:
- **Phase-by-phase model**: Each possession is a sequence of phases with breakdown, ruck speed, and gainline outcomes
- **Kicking game**: Box kicks, 50:22, contestable kicks, exit strategies — all tied to player kicking stats and aerial ability
- **Breakdown**: Jackal threat, cleanout quality, ruck speed affecting ball quality
- **Weather effects**: Wind on kicks, wet ball handling, heavy pitch fatigue curves
- **Fatigue system**: Players tire over 80 mins with position-specific curves (props gas at 55-60 min). Fresh subs vs tired starters is a real advantage

## Phase 4: Live Match Stats Dashboard
- Real-time updating stats panel during simulation: possession %, territory %, tackle completion, metres gained, ruck speed, phase count, penalties conceded
- Post-match detailed stats with comparison bars
- Player ratings generated from match contributions

## Phase 5: Bench & Substitution System
- Bench composition choice (6-2 vs 5-3 split)
- Impact substitution rating per player
- Pre-set auto-sub rules ("sub loosehead at 50 min")
- Timing risk/reward mechanics
- SA "bomb squad" style: fresh front row dominates tired opposition

## Phase 6: Discipline, Cards & TMO
- Per-player discipline stat affecting penalty tendency
- Team warning system → next infringement = yellow card
- Yellow card with 10-min sin bin (plays with 14 men)
- Red card for dangerous tackles tied to aggression stat
- TMO reviews on try-scoring events (random chance to disallow/upgrade)
- Penalty goal vs lineout attack decision-making

## Phase 7: Player Psychology & Development
- Confidence meter (rises with good performances, drops when dropped/errors)
- Player archetypes per position (playmaker 10, running 10, carrying 8, linking 8, etc.)
- Ego system: star players unhappy on bench, demand starts
- Mentoring: pair veterans with youth for faster development
- Player milestones: 50th/100th cap, scoring records
- Personal chat system with player requests/concerns

## Phase 8: Coaching Staff & Scouting
- Specialist staff hiring: scrum coach, kicking coach, defence coach, analyst, psychologist, nutritionist
- Each staff member provides measurable bonuses to relevant stats
- Coaching philosophy system (Structured/Expansive/Pragmatic/Development)
- Pre-match opposition scouting reports based on analyst quality
- Hidden potential system for young players

## Phase 9: Squad Dynamics & Contracts
- Player agent interference mid-season
- Irish players using French clubs as leverage (country-specific negotiation)
- Cultural fit & integration period for new signings (4-6 weeks reduced effectiveness)
- Team chemistry from same country/province
- Academy pipeline generating prospects based on investment

## Phase 10: Season Narrative & Events
- Dynamic season events (media pressure, board expectations)
- Referee assignment with individual tendencies
- Injury rehabilitation decisions (rush back vs conservative)
- Form & momentum system (rolling 5-match rating)
- Pre-match team talks, half-time adjustments, post-match

## Files to create/modify:
- `src/types/matchEngine.ts` — New comprehensive match types
- `src/types/staff.ts` — Coaching staff types
- `src/types/playerExtended.ts` — Extended player attributes
- `src/engine/matchSimulator.ts` — New match engine
- `src/engine/setPieces.ts` — Scrum/lineout/maul mechanics
- `src/engine/fatigue.ts` — Fatigue & substitution logic
- `src/engine/discipline.ts` — Cards, TMO, penalties
- `src/engine/matchStats.ts` — Live stats calculation
- `src/components/match/MatchStatsPanel.tsx` — Live stats UI
- `src/components/match/BenchManager.tsx` — Substitution UI
- `src/components/match/MatchCommentary.tsx` — Event feed
- `src/components/staff/StaffPanel.tsx` — Coaching staff management
- `src/components/player/PlayerPsychology.tsx` — Psychology/ego UI
- `src/pages/MatchSimulation.tsx` — Complete rewrite
- `src/types/game.ts` — Extend Player, Team, Match interfaces
