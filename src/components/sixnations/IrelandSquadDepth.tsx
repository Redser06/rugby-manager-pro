import React, { useEffect, useMemo } from 'react';
import {
  POSITIONS,
  PLAYERS,
  SECONDARY,
  ALL_PLAYERS,
  depthScore,
  depthColor,
  depthLabel,
  ratingColor,
  tierBadge,
  rankClass,
  getPlayersByPosition,
  DepthPlayer,
} from '@/data/irelandSquadDepth';

const IrelandSquadDepth: React.FC = () => {
  useEffect(() => {
    // Load the standalone CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/squad-depth/ireland-rugby-depth.css';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const byPos = useMemo(() => getPlayersByPosition(), []);

  const totalPlayers = PLAYERS.length;
  const secPositions = SECONDARY.length;
  const avgRating = Math.round(PLAYERS.reduce((s, p) => s + p.rating, 0) / totalPlayers);
  const worldClass = PLAYERS.filter(p => p.rating >= 90).length;
  const strongPositions = POSITIONS.filter(p => depthScore(byPos[p.id]) >= 80).length;

  const forwards = POSITIONS.filter(p => p.group === 'Forwards');
  const backs = POSITIONS.filter(p => p.group === 'Backs');

  return (
    <div className="ireland-depth">
      {/* Header */}
      <header className="hdr">
        <div className="hdr-badge">Squad Analysis · 2025</div>
        <span className="hdr-shamrock">🍀</span>
        <h1>Ireland Rugby<br /><em>Squad Depth Ratings</em></h1>
        <p className="hdr-sub">Comprehensive player pool assessment across all 15 positions</p>
        <div className="hdr-stats">
          <div className="hdr-stat"><div className="hdr-stat-val">{totalPlayers}</div><div className="hdr-stat-lbl">Players Assessed</div></div>
          <div className="hdr-stat"><div className="hdr-stat-val">{avgRating}</div><div className="hdr-stat-lbl">Avg Player Rating</div></div>
          <div className="hdr-stat"><div className="hdr-stat-val">{worldClass}</div><div className="hdr-stat-lbl">World Class (90+)</div></div>
          <div className="hdr-stat"><div className="hdr-stat-val">{secPositions}</div><div className="hdr-stat-lbl">2nd Position Entries</div></div>
          <div className="hdr-stat"><div className="hdr-stat-val">{strongPositions}/15</div><div className="hdr-stat-lbl">Strong Positions (80+)</div></div>
        </div>
      </header>

      <div className="wrap">
        {/* Legend */}
        <div className="legend">
          <span className="legend-lbl">Rating Scale</span>
          <div className="legend-items">
            <div className="legend-item"><div className="legend-dot" style={{ background: '#047857' }} />90–100 World Class</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#16A34A' }} />80–89 International</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#CA8A04' }} />70–79 Squad Player</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#D97706' }} />60–69 Fringe</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#DC2626' }} />&lt;60 Emerging</div>
          </div>
          <div style={{ borderLeft: '1px solid #E5E7EB', paddingLeft: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="sec-badge" style={{ margin: 0 }}>2nd Pos</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>Secondary position entry</span>
          </div>
        </div>

        {/* Overview Grid */}
        <p className="sec-title" style={{ marginTop: 28 }}>Position Depth Overview — 15 Positions</p>
        <div className="ov-grid">
          {POSITIONS.map(p => {
            const players = byPos[p.id];
            const ds = depthScore(players);
            const col = depthColor(ds);
            const lbl = depthLabel(ds);
            return (
              <a key={p.id} className="ov-card" href={`#pos-${p.id}`}>
                <div className="ov-pos-num">Position {p.num}</div>
                <div className="ov-pos-name">{p.name}</div>
                <div className="ov-bar-row">
                  <div className="ov-bar-bg">
                    <div className="ov-bar-fill" style={{ width: `${ds}%`, background: col }} />
                  </div>
                  <div className="ov-score" style={{ color: col }}>{ds}</div>
                </div>
                <div className="ov-meta">
                  <span className="ov-label" style={{ color: col }}>{lbl}</span>
                  <span>{players.length} players</span>
                </div>
              </a>
            );
          })}
        </div>

        {/* Forwards */}
        <div className="grp-hdr"><h2 className="grp-title">Forwards</h2><span className="grp-pill">8 Positions</span></div>
        <div className="pos-grid">
          {forwards.map(p => <PositionCard key={p.id} position={p} players={byPos[p.id]} />)}
        </div>

        {/* Backs */}
        <div className="grp-hdr"><h2 className="grp-title">Backs</h2><span className="grp-pill">7 Positions</span></div>
        <div className="pos-grid">
          {backs.map(p => <PositionCard key={p.id} position={p} players={byPos[p.id]} />)}
        </div>
      </div>

      <div className="depth-footer">
        <strong>Ireland Rugby Squad Depth Analysis 2025</strong><br />
        Ratings reflect international performance, caps, Lions selection, current form &amp; squad readiness.<br />
        Depth Score = weighted average (35 / 25 / 20 / 13 / 7% decay) across ranked players per position.
      </div>
    </div>
  );
};

function PositionCard({ position, players }: { position: typeof POSITIONS[0]; players: DepthPlayer[] }) {
  const ds = depthScore(players);
  const col = depthColor(ds);
  const lbl = depthLabel(ds);

  return (
    <div className="pos-card" id={`pos-${position.id}`}>
      <div className="pos-card-hdr">
        <div>
          <div className="pos-card-num">Position {position.num}</div>
          <div className="pos-card-title">{position.name}</div>
        </div>
        <div className="pos-depth-row">
          <div className="pos-depth-bar">
            <div className="pos-depth-fill" style={{ width: `${ds}%`, background: col }} />
          </div>
          <div className="pos-depth-score">{ds}</div>
          <div className="pos-depth-lbl">{lbl}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: 42 }}>#</th>
            <th>Player</th>
            <th className="r">Rating</th>
          </tr>
        </thead>
        <tbody>
          {players.map((pl, i) => {
            const rc = ratingColor(pl.rating);
            const [tLbl, tCls] = tierBadge(pl.rating);
            return (
              <tr key={`${pl.name}-${pl.pos}-${i}`} className={pl.secondary ? 'sec-row' : undefined}>
                <td className="rank-cell">
                  <span className={`rank-badge ${rankClass(i)}`}>{i + 1}</span>
                </td>
                <td className="name-cell">
                  <span className="name-txt">{pl.name}</span>
                  <span className={`tier-badge ${tCls}`}>{tLbl}</span>
                  {pl.secondary && <span className="sec-badge">2nd Pos</span>}
                </td>
                <td className="rating-cell">
                  <div className="rating-row">
                    <div className="rating-bar-bg">
                      <div className="rating-bar-fill" style={{ width: `${pl.rating}%`, background: rc }} />
                    </div>
                    <div className="rating-num" style={{ color: rc }}>{pl.rating}</div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default IrelandSquadDepth;
