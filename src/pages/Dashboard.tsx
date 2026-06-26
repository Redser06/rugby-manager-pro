import { useState, useEffect, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { getWeekFixtures, canTeamTrain } from '@/utils/fixtureGenerator';
import { ShareDialog } from '@/components/share/ShareDialog';
import { SeasonEventsPanel } from '@/components/narrative/SeasonEventsPanel';
import { useToast } from '@/hooks/use-toast';
import {
  initSeasonNarrative, processWeeklyNarrative, assignReferee,
  SeasonNarrativeState, MatchReferee,
} from '@/engine/seasonNarrative';
import { Play, Share2, MapPin, CloudRain, Sun, AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/* -------------------------------------------------------------------------- */
/*  Touchline tokens (broadcast palette — matches design doc Direction A)     */
/* -------------------------------------------------------------------------- */
const TL = {
  bg: '#0e1217',
  panel: '#141b22',
  panelDeep: '#0b1015',
  line: '#242e39',
  lineSoft: '#202932',
  text: '#e8edf2',
  textDim: '#cdd6e0',
  muted: '#8a97a6',
  mutedDeep: '#6b7686',
  mutedDeeper: '#5d6b7a',
  blue: '#3d8bff',
  blueDeep: '#1f5fd0',
  green: '#34d17a',
  amber: '#f0a93b',
  red: '#ec5a5a',
};

const SectionTitle = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-3.5">
    <div className="flex items-center gap-2">
      <span className="w-[3px] h-[13px] rounded-sm" style={{ background: TL.blue }} />
      <span
        className="font-barlow-sc font-semibold uppercase"
        style={{ fontSize: 12, letterSpacing: '.12em', color: TL.textDim }}
      >
        {children}
      </span>
    </div>
    {right}
  </div>
);

const FormChip = ({ r }: { r: 'W' | 'D' | 'L' }) => {
  const map = {
    W: { bg: TL.green, fg: '#06140c' },
    D: { bg: TL.amber, fg: '#1a1102' },
    L: { bg: TL.red, fg: '#fff' },
  } as const;
  const c = map[r];
  return (
    <span
      className="font-archivo font-extrabold inline-flex items-center justify-center rounded"
      style={{ width: 17, height: 17, fontSize: 10, background: c.bg, color: c.fg }}
    >
      {r}
    </span>
  );
};

const OverallBadge = ({ value }: { value: number }) => {
  const tier =
    value >= 82
      ? { bg: '#0f3320', border: '#1f5a38', fg: TL.green }
      : value >= 75
      ? { bg: '#13283d', border: '#245078', fg: '#5aa0ff' }
      : { bg: '#1c2530', border: '#2a3540', fg: TL.textDim };
  return (
    <div
      className="font-archivo font-extrabold flex items-center justify-center"
      style={{
        width: 34, height: 34, borderRadius: 8, fontSize: 15,
        background: tier.bg, border: `1px solid ${tier.border}`, color: tier.fg,
      }}
    >
      {value}
    </div>
  );
};

/* -------------------------------------------------------------------------- */

export default function Dashboard() {
  const { gameState, schedule, lastMatchResult, getMyTeam, getMyLeague, advanceWeek } = useGame();
  const { toast } = useToast();
  const team = getMyTeam();
  const league = getMyLeague();

  const [narrativeState, setNarrativeState] = useState<SeasonNarrativeState | null>(null);
  const [upcomingRef, setUpcomingRef] = useState<MatchReferee | undefined>();

  const thisWeekFixture = useMemo(() => {
    if (!schedule || !team) return null;
    const fixtures = getWeekFixtures(schedule, gameState.currentWeek);
    return fixtures.find(f => f.homeTeamId === team.id || f.awayTeamId === team.id) || null;
  }, [schedule, gameState.currentWeek, team]);

  useEffect(() => {
    if (!team || !league) return;
    const position = league.standings.findIndex(s => s.teamId === team.id) + 1 || 1;
    if (!narrativeState) {
      setNarrativeState(initSeasonNarrative(team, league.teams.length));
    } else {
      const fixture = thisWeekFixture;
      const opponentId = fixture ? (fixture.homeTeamId === team.id ? fixture.awayTeamId : fixture.homeTeamId) : undefined;
      const opponentName = fixture ? (fixture.homeTeamId === team.id ? fixture.awayTeamName : fixture.homeTeamName) : undefined;
      const updated = processWeeklyNarrative(narrativeState, team, gameState.currentWeek, position, league.teams.length, opponentId, opponentName);
      setUpcomingRef(fixture && narrativeState.refereePool.length > 0 ? assignReferee(updated.refereePool, team.country) : undefined);
      setNarrativeState(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentWeek, team?.id]);

  const trainingRestricted = useMemo(() => {
    if (!schedule || !team) return false;
    return !canTeamTrain(schedule, team.id, gameState.currentWeek);
  }, [schedule, team, gameState.currentWeek]);

  if (!team) return null;

  const startingXI = team.players.slice(0, 15);
  const avgOverall = Math.round(startingXI.reduce((s, p) => s + p.overall, 0) / Math.max(1, startingXI.length));
  const avgFitness = Math.round(team.players.reduce((s, p) => s + p.fitness, 0) / Math.max(1, team.players.length));
  const availableCount = team.players.filter(p => !p.injured).length;
  const inFormPlayers = [...team.players]
    .sort((a, b) => b.form - a.form || b.overall - a.overall)
    .slice(0, 4);
  const injuredOrSuspended = team.players
    .filter(p => p.injured || (p as any).suspended)
    .slice(0, 4);

  // Opponent meta from the fixture
  const isHome = thisWeekFixture?.homeTeamId === team.id;
  const opponentName = thisWeekFixture
    ? (isHome ? thisWeekFixture.awayTeamName : thisWeekFixture.homeTeamName)
    : null;
  const opponentInitial = opponentName?.charAt(0) ?? '–';

  // Last 5 form for the user's team
  const last5: Array<'W' | 'D' | 'L'> = [];
  if (schedule) {
    const completed = schedule.fixtures
      .filter(f => f.status === 'completed' && (f.homeTeamId === team.id || f.awayTeamId === team.id))
      .sort((a, b) => b.week - a.week)
      .slice(0, 5);
    for (const f of completed) {
      const us = f.homeTeamId === team.id ? f.homeScore ?? 0 : f.awayScore ?? 0;
      const them = f.homeTeamId === team.id ? f.awayScore ?? 0 : f.homeScore ?? 0;
      last5.push(us > them ? 'W' : us === them ? 'D' : 'L');
    }
  }
  while (last5.length < 5) last5.push('D');

  // Top of league snapshot
  const standings = (league?.standings ?? []).slice().sort((a, b) => b.totalPoints - a.totalPoints);
  const teamIndex = standings.findIndex(s => s.teamId === team.id);
  const snapshotStart = Math.max(0, Math.min(teamIndex - 2, Math.max(0, standings.length - 6)));
  const snapshot = standings.slice(snapshotStart, snapshotStart + 6);
  const teamLookup = new Map(league?.teams.map(t => [t.id, t]) ?? []);

  return (
    <div
      className="font-barlow min-h-full"
      style={{ background: TL.bg, color: TL.text }}
    >
      {/* Topbar */}
      <div
        className="flex items-center gap-5 px-5 py-3 border-b"
        style={{ background: TL.panelDeep, borderColor: '#1c242d' }}
      >
        <div>
          <div className="font-barlow-sc uppercase" style={{ fontSize: 11, letterSpacing: '.13em', color: TL.mutedDeep }}>
            {league?.name ?? 'Season'} · Season {gameState.currentSeason}
          </div>
          <div className="font-archivo font-extrabold tracking-tight" style={{ fontSize: 17 }}>
            Round {gameState.currentWeek} · Week {gameState.currentWeek}
          </div>
        </div>
        <div className="flex-1" />
        <div className="text-right pr-4 border-r hidden sm:block" style={{ borderColor: '#1c242d' }}>
          <div className="font-barlow-sc uppercase" style={{ fontSize: 10.5, letterSpacing: '.1em', color: TL.mutedDeep }}>Squad</div>
          <div className="font-archivo font-extrabold" style={{ fontSize: 16, color: TL.text }}>{team.players.length}</div>
        </div>
        <div className="text-right pr-4 border-r hidden md:block" style={{ borderColor: '#1c242d' }}>
          <div className="font-barlow-sc uppercase" style={{ fontSize: 10.5, letterSpacing: '.1em', color: TL.mutedDeep }}>Board</div>
          <div className="font-archivo font-extrabold" style={{ fontSize: 16, color: TL.text }}>Confident</div>
        </div>
        <ShareDialog
          trigger={
            <button
              className="hidden sm:inline-flex items-center gap-2 font-archivo font-semibold px-3 py-2 rounded-md transition-colors"
              style={{ fontSize: 13, color: TL.textDim, background: '#1a212a', border: '1px solid #232c36' }}
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          }
        />
        <button
          onClick={() => {
            advanceWeek();
            if (lastMatchResult) {
              const { won, homeScore, awayScore, opponent, isHome: home } = lastMatchResult;
              toast({
                title: won ? '🏆 Victory!' : homeScore === awayScore ? '🤝 Draw' : '😞 Defeat',
                description: `${home ? team.shortName : opponent} ${homeScore} - ${awayScore} ${home ? opponent : team.shortName}`,
              });
            } else {
              toast({ title: `Week ${gameState.currentWeek + 1} Started`, description: 'Bye week — no fixture.' });
            }
          }}
          className="inline-flex items-center gap-2 font-archivo font-bold px-5 py-2.5 rounded-md transition-transform hover:scale-[1.02]"
          style={{ background: TL.blue, color: '#fff', fontSize: 14, boxShadow: '0 6px 18px -6px rgba(61,139,255,.7)' }}
        >
          <Play className="h-3.5 w-3.5 fill-current" /> Continue
        </button>
      </div>

      {/* Body grid */}
      <div className="p-4 md:p-5 grid gap-4" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_322px]">
          {/* LEFT */}
          <div className="flex flex-col gap-4 min-w-0">
            {/* Next Fixture broadcast strip */}
            {thisWeekFixture ? (
              <Link to="/fixtures" className="block">
                <div className="rounded-xl overflow-hidden" style={{ background: TL.panel, border: `1px solid ${TL.line}` }}>
                  <div
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{ background: 'linear-gradient(90deg,#16202c,#141b22)', borderBottom: `1px solid ${TL.line}` }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full touchline-pulse" style={{ background: TL.amber, boxShadow: `0 0 8px ${TL.amber}` }} />
                      <span className="font-barlow-sc font-semibold uppercase" style={{ fontSize: 12, letterSpacing: '.13em', color: TL.textDim }}>
                        Next Fixture · Round {thisWeekFixture.week}
                      </span>
                    </div>
                    <span className="font-barlow-sc" style={{ fontSize: 12, color: TL.mutedDeep }}>{isHome ? 'Home' : 'Away'}</span>
                  </div>

                  <div className="flex items-center px-4 md:px-5 py-5">
                    {/* Home / left */}
                    <div className="flex-1 flex items-center gap-3.5 min-w-0">
                      <div
                        className="flex items-center justify-center font-archivo font-extrabold"
                        style={{
                          width: 54, height: 54, borderRadius: 10, fontSize: 20, color: '#fff',
                          background: `linear-gradient(150deg,${TL.blueDeep},#0e3a8a)`,
                          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.12)',
                        }}
                      >
                        {team.shortName?.charAt(0) ?? team.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-archivo font-extrabold tracking-tight truncate" style={{ fontSize: 19 }}>{team.name}</div>
                        <div className="flex gap-1 mt-1.5">{last5.map((r, i) => <FormChip key={i} r={r} />)}</div>
                      </div>
                    </div>

                    {/* VS */}
                    <div className="text-center px-3 md:px-5 shrink-0">
                      <div className="font-archivo font-black" style={{ fontSize: 14, color: TL.mutedDeeper, letterSpacing: '.06em' }}>VS</div>
                      <div className="font-barlow-sc mt-1" style={{ fontSize: 11.5, color: TL.muted }}>{thisWeekFixture.venue}</div>
                      {thisWeekFixture.weather && (
                        <div className="font-barlow-sc mt-0.5 inline-flex items-center gap-1" style={{ fontSize: 11, color: TL.mutedDeep }}>
                          {thisWeekFixture.weather.condition === 'clear' ? <Sun className="h-3 w-3" /> : <CloudRain className="h-3 w-3" />}
                          {thisWeekFixture.weather.description}
                        </div>
                      )}
                    </div>

                    {/* Away / right */}
                    <div className="flex-1 flex items-center justify-end gap-3.5 text-right min-w-0">
                      <div className="min-w-0">
                        <div className="font-archivo font-extrabold tracking-tight truncate" style={{ fontSize: 19 }}>{opponentName}</div>
                        <div className="font-barlow-sc mt-1.5 truncate" style={{ fontSize: 11.5, color: TL.muted }}>
                          {isHome ? 'Visitors' : 'Hosts'} · Round {thisWeekFixture.week}
                        </div>
                      </div>
                      <div
                        className="flex items-center justify-center font-archivo font-extrabold shrink-0"
                        style={{
                          width: 54, height: 54, borderRadius: 10, fontSize: 20, color: '#fff',
                          background: 'linear-gradient(150deg,#7a1f2b,#4a0f18)',
                          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.1)',
                        }}
                      >
                        {opponentInitial}
                      </div>
                    </div>
                  </div>

                  <div className="flex font-barlow-sc" style={{ height: 34, borderTop: `1px solid ${TL.line}`, fontSize: 12 }}>
                    <div className="flex-1 flex items-center justify-center gap-1.5 border-r" style={{ borderColor: TL.line, color: TL.muted }}>
                      <span style={{ color: TL.mutedDeeper }}>Status</span>
                      <span style={{ color: thisWeekFixture.status === 'postponed' ? TL.red : TL.text, fontWeight: 600 }}>
                        {thisWeekFixture.status}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-1.5 border-r" style={{ borderColor: TL.line, color: TL.muted }}>
                      <span style={{ color: TL.mutedDeeper }}>Venue</span>
                      <span style={{ color: TL.text, fontWeight: 600 }} className="truncate max-w-[140px]">{isHome ? 'Home' : 'Away'}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-1.5" style={{ color: TL.muted }}>
                      <span style={{ color: TL.mutedDeeper }}>Referee</span>
                      <span style={{ color: TL.text, fontWeight: 600 }}>{upcomingRef?.name ?? 'TBC'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div
                className="rounded-xl p-6 text-center"
                style={{ background: TL.panel, border: `1px solid ${TL.line}` }}
              >
                <div className="font-barlow-sc uppercase mb-1" style={{ fontSize: 12, letterSpacing: '.13em', color: TL.mutedDeep }}>Bye Week</div>
                <div className="font-archivo font-extrabold" style={{ fontSize: 18 }}>No fixture — focus on training</div>
              </div>
            )}

            {/* Two-up: Squad status + this week's training */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl p-4" style={{ background: TL.panel, border: `1px solid ${TL.line}` }}>
                <SectionTitle>Squad Status</SectionTitle>
                <div className="flex gap-5 mb-3.5">
                  <div>
                    <div className="font-archivo font-extrabold leading-none tracking-tight" style={{ fontSize: 30 }}>{avgOverall}</div>
                    <div className="font-barlow-sc uppercase mt-1" style={{ fontSize: 11, letterSpacing: '.06em', color: TL.mutedDeep }}>Avg OVR</div>
                  </div>
                  <div>
                    <div className="font-archivo font-extrabold leading-none tracking-tight" style={{ fontSize: 30, color: TL.green }}>
                      {avgFitness}<span style={{ fontSize: 16 }}>%</span>
                    </div>
                    <div className="font-barlow-sc uppercase mt-1" style={{ fontSize: 11, letterSpacing: '.06em', color: TL.mutedDeep }}>Fitness</div>
                  </div>
                  <div>
                    <div className="font-archivo font-extrabold leading-none tracking-tight" style={{ fontSize: 30, color: TL.amber }}>{team.players.length}</div>
                    <div className="font-barlow-sc uppercase mt-1" style={{ fontSize: 11, letterSpacing: '.06em', color: TL.mutedDeep }}>Players</div>
                  </div>
                </div>
                <div className="pt-3 flex flex-col gap-2.5" style={{ borderTop: `1px solid ${TL.lineSoft}` }}>
                  {injuredOrSuspended.length === 0 && (
                    <div className="font-barlow-sc" style={{ fontSize: 13, color: TL.muted }}>
                      No injuries · {availableCount}/{team.players.length} available
                    </div>
                  )}
                  {injuredOrSuspended.map(p => (
                    <div key={p.id} className="flex items-center justify-between" style={{ fontSize: 13 }}>
                      <span className="flex items-center gap-2" style={{ color: TL.textDim }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.injured ? TL.red : TL.amber }} />
                        {p.lastName} <span style={{ color: TL.mutedDeeper, fontSize: 12 }}>· {p.position}</span>
                      </span>
                      <span className="font-barlow-sc" style={{ fontSize: 12, color: p.injured ? TL.red : TL.amber }}>
                        {p.injured ? `Injury · ${p.injuryWeeks}w` : 'Suspended'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: TL.panel, border: `1px solid ${TL.line}` }}>
                <SectionTitle>This Week&apos;s Training</SectionTitle>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Defensive structure', tag: 'Primary', pct: 72, color: TL.blue },
                    { label: 'Set piece — lineout', tag: 'Secondary', pct: 54, color: TL.blue },
                    { label: 'Conditioning load', tag: 'High', pct: 84, color: TL.amber, tagColor: TL.amber },
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex justify-between mb-1.5" style={{ fontSize: 13 }}>
                        <span style={{ color: TL.textDim, fontWeight: 600 }}>{row.label}</span>
                        <span className="font-barlow-sc" style={{ color: row.tagColor ?? TL.muted }}>{row.tag}</span>
                      </div>
                      <div className="touchline-bar rounded-sm overflow-hidden" style={{ height: 6, background: '#1c2530' }}>
                        <div style={{ height: '100%', width: `${row.pct}%`, background: `linear-gradient(90deg, ${row.color}, ${row.color === TL.amber ? '#f5c163' : '#5aa0ff'})` }} />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between font-barlow-sc pt-0.5" style={{ fontSize: 12, color: TL.mutedDeep }}>
                    <span>{trainingRestricted ? 'Travel day — training restricted' : 'Intensity balanced for matchday'}</span>
                    <Link to="/training" style={{ color: TL.blue, fontWeight: 600 }}>Adjust →</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* In form */}
            <div className="rounded-xl p-4" style={{ background: TL.panel, border: `1px solid ${TL.line}` }}>
              <SectionTitle right={<Link to="/squad" className="font-barlow-sc font-semibold" style={{ fontSize: 12, color: TL.blue }}>Full squad →</Link>}>
                In Form
              </SectionTitle>
              <div className="flex flex-col">
                {inFormPlayers.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/[0.03] transition-colors">
                    <span className="font-archivo-narrow font-bold text-center" style={{ width: 24, fontSize: 14, color: TL.blue }}>
                      {p.positionNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate" style={{ fontSize: 14 }}>{p.firstName.charAt(0)}. {p.lastName}</div>
                      <div className="font-barlow-sc truncate" style={{ fontSize: 11.5, color: TL.mutedDeep }}>{p.position} · {p.age}</div>
                    </div>
                    <div className="text-center" style={{ width: 54 }}>
                      <div className="font-archivo font-bold" style={{ fontSize: 15, color: p.form >= 7.5 ? TL.green : '#7fd9a8' }}>{p.form.toFixed(1)}</div>
                      <div className="font-barlow-sc" style={{ fontSize: 10, color: TL.mutedDeeper, letterSpacing: '.06em' }}>FORM</div>
                    </div>
                    <OverallBadge value={p.overall} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-4 min-w-0">
            {/* League table snapshot */}
            <div className="rounded-xl overflow-hidden" style={{ background: TL.panel, border: `1px solid ${TL.line}` }}>
              <div className="flex items-center justify-between px-3.5 py-3" style={{ borderBottom: `1px solid ${TL.lineSoft}` }}>
                <div className="flex items-center gap-2">
                  <span className="w-[3px] h-[13px] rounded-sm" style={{ background: TL.blue }} />
                  <span className="font-barlow-sc font-semibold uppercase" style={{ fontSize: 12, letterSpacing: '.12em', color: TL.textDim }}>League Table</span>
                </div>
                <Link to="/standings" className="font-barlow-sc" style={{ fontSize: 12, color: TL.blue, fontWeight: 600 }}>Full →</Link>
              </div>
              <div
                className="font-barlow-sc uppercase grid gap-1.5 px-3.5 pt-2 pb-1.5"
                style={{ fontSize: 11, letterSpacing: '.08em', color: TL.mutedDeeper, gridTemplateColumns: '22px 1fr 26px 26px 30px' }}
              >
                <span>#</span><span>Club</span><span className="text-center">P</span><span className="text-center">W</span><span className="text-right">Pts</span>
              </div>
              <div className="px-1.5 pb-2">
                {snapshot.map((s, i) => {
                  const rank = snapshotStart + i + 1;
                  const isMe = s.teamId === team.id;
                  const rankColor = rank === 1 ? TL.green : rank <= 4 ? '#7fd9a8' : TL.muted;
                  return (
                    <div
                      key={s.teamId}
                      className="grid gap-1.5 px-2 py-1.5 items-center rounded-md"
                      style={{
                        gridTemplateColumns: '22px 1fr 26px 26px 30px',
                        fontSize: 13,
                        background: isMe ? '#15202e' : undefined,
                        boxShadow: isMe ? `inset 2px 0 0 ${TL.blue}` : undefined,
                      }}
                    >
                      <span className="font-archivo-narrow font-bold" style={{ color: isMe ? TL.blue : rankColor }}>{rank}</span>
                      <span className="truncate" style={{ fontWeight: isMe ? 700 : 600, color: isMe ? '#fff' : TL.text }}>
                        {teamLookup.get(s.teamId)?.name ?? s.teamId}
                      </span>
                      <span className="text-center" style={{ color: isMe ? TL.textDim : TL.muted }}>{s.played}</span>
                      <span className="text-center" style={{ color: isMe ? TL.textDim : TL.muted }}>{s.won}</span>
                      <span className="text-right font-archivo font-bold" style={{ color: isMe ? TL.blue : TL.text }}>{s.totalPoints}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inbox */}
            <div className="rounded-xl overflow-hidden flex flex-col" style={{ background: TL.panel, border: `1px solid ${TL.line}` }}>
              <div className="flex items-center justify-between px-3.5 py-3" style={{ borderBottom: `1px solid ${TL.lineSoft}` }}>
                <div className="flex items-center gap-2">
                  <span className="w-[3px] h-[13px] rounded-sm" style={{ background: TL.blue }} />
                  <span className="font-barlow-sc font-semibold uppercase" style={{ fontSize: 12, letterSpacing: '.12em', color: TL.textDim }}>Inbox</span>
                </div>
                <span className="font-archivo font-bold rounded-full px-2 py-0.5" style={{ fontSize: 11, background: TL.blue, color: '#fff' }}>
                  {(narrativeState?.events.filter(e => !e.resolved).length ?? 0) || (injuredOrSuspended.length + (thisWeekFixture ? 1 : 0))}
                </span>
              </div>
              <div className="p-1.5 flex flex-col gap-0.5">
                {thisWeekFixture && (
                  <InboxRow color={TL.blue} tag="Board" text={`Top-four finish remains the expectation. Round ${thisWeekFixture.week} ${isHome ? 'at home' : 'away'} this week.`} />
                )}
                {injuredOrSuspended.slice(0, 2).map(p => (
                  <InboxRow
                    key={p.id}
                    color={p.injured ? TL.red : TL.amber}
                    tag={p.injured ? 'Medical' : 'Discipline'}
                    text={`${p.firstName.charAt(0)}. ${p.lastName} (${p.position}) ${p.injured ? `ruled out ${p.injuryWeeks}w` : 'suspended next match'}.`}
                  />
                ))}
                <InboxRow color={TL.green} tag="Scouting" text="Scouting report ready: tighthead prop target with high potential." />
                <InboxRow color={TL.muted} tag="Press" text={`Preview: "${team.shortName} look to consolidate top-four spot."`} />
              </div>
            </div>
          </div>
        </div>

        {/* Season narrative + travel warning */}
        {trainingRestricted && (
          <div
            className="rounded-xl flex items-center gap-3 px-4 py-3"
            style={{ background: '#2c1416', border: `1px solid #4a1f24`, color: TL.red }}
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="font-barlow-sc font-semibold" style={{ fontSize: 13, letterSpacing: '.05em' }}>Travel day this week — training is restricted.</span>
          </div>
        )}

        {narrativeState && (
          <SeasonEventsPanel
            narrativeState={narrativeState}
            currentWeek={gameState.currentWeek}
            upcomingReferee={upcomingRef}
            onEventChoice={(eventId, choiceId) => {
              const updatedEvents = narrativeState.events.map(e =>
                e.id === eventId ? { ...e, chosenOption: choiceId, resolved: true } : e,
              );
              setNarrativeState({ ...narrativeState, events: updatedEvents });
            }}
          />
        )}

        {/* Starting XV strip */}
        <div className="rounded-xl p-4" style={{ background: TL.panel, border: `1px solid ${TL.line}` }}>
          <SectionTitle right={<Link to="/tactics" className="font-barlow-sc font-semibold inline-flex items-center gap-1" style={{ fontSize: 12, color: TL.blue }}>Edit XV <ChevronRight className="h-3 w-3" /></Link>}>
            Starting XV
          </SectionTitle>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5">
            {startingXI.map(p => (
              <div key={p.id} className="text-center p-2 rounded-md" style={{ background: '#1c2530' }}>
                <div className="font-archivo-narrow font-bold" style={{ fontSize: 12, color: TL.blue }}>{p.positionNumber}</div>
                <div className="truncate" style={{ fontSize: 12, color: TL.textDim }}>{p.lastName}</div>
                <div className="font-archivo font-bold" style={{ fontSize: 12, color: TL.mutedDeep }}>{p.overall}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InboxRow({ color, tag, text }: { color: string; tag: string; text: string }) {
  // pick a soft background for the tag chip from the dominant accent color
  const tagBg = color === TL.red ? '#2c1416'
    : color === TL.green ? '#11281b'
    : color === TL.amber ? '#2a1d0b'
    : color === TL.blue ? '#13243a'
    : '#1c2530';
  return (
    <div className="flex gap-2.5 px-2 py-2.5 rounded-md hover:bg-white/[0.03] transition-colors cursor-pointer">
      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
      <div className="min-w-0">
        <div className="flex gap-1.5 items-center mb-0.5">
          <span
            className="font-barlow-sc font-semibold uppercase px-1.5 py-0.5 rounded"
            style={{ fontSize: 10, letterSpacing: '.1em', color, background: tagBg }}
          >
            {tag}
          </span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.35, color: '#dfe8f2' }}>{text}</div>
      </div>
    </div>
  );
}
