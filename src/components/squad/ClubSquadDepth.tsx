import React, { useEffect, useMemo } from 'react';
import { Player } from '@/types/game';
import {
  POSITIONS,
  depthScore as calcDepthScore,
  depthColor,
  depthLabel,
  ratingColor,
  tierBadge,
  rankClass,
  DepthPlayer,
} from '@/data/irelandSquadDepth';

// Map game positionNumber to depth position ID
const POS_NUM_TO_DEPTH_ID: Record<number, number> = {
  1: 1,   // Loosehead Prop
  2: 2,   // Hooker
  3: 3,   // Tighthead Prop
  4: 4,   // Lock (L4)
  5: 5,   // Lock (L5)
  6: 6,   // Blindside Flanker
  7: 7,   // Openside Flanker
  8: 8,   // Number Eight
  9: 9,   // Scrum-Half
  10: 10,  // Fly-Half
  11: 11,  // Left Wing
  12: 12,  // Inside Centre
  13: 13,  // Outside Centre
  14: 14,  // Right Wing
  15: 15,  // Fullback
};

interface ClubSquadDepthProps {
  players: Player[];
  teamName: string;
  primaryColor?: string;
}

const ClubSquadDepth: React.FC<ClubSquadDepthProps> = ({ players, teamName, primaryColor }) => {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/squad-depth/ireland-rugby-depth.css';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const byPos = useMemo(() => {
    const map: Record<number, DepthPlayer[]> = {};
    POSITIONS.forEach(p => { map[p.id] = []; });

    players.forEach(pl => {
      const depthId = POS_NUM_TO_DEPTH_ID[pl.positionNumber];
      if (depthId && map[depthId]) {
        map[depthId].push({
          name: `${pl.firstName} ${pl.lastName}`,
          pos: depthId,
          rating: pl.overall,
          secondary: false,
        });
      }
    });

    // Sort each position by rating
    Object.values(map).forEach(arr => arr.sort((a, b) => b.rating - a.rating));
    return map;
  }, [players]);

  const totalPlayers = players.length;
  const avgRating = totalPlayers > 0 ? Math.round(players.reduce((s, p) => s + p.overall, 0) / totalPlayers) : 0;
  const worldClass = players.filter(p => p.overall >= 90).length;
  const strongPositions = POSITIONS.filter(p => calcDepthScore(byPos[p.id]) >= 80).length;

  const forwards = POSITIONS.filter(p => p.group === 'Forwards');
  const backs = POSITIONS.filter(p => p.group === 'Backs');

  return (
    <div className="ireland-depth">
      {/* Header */}
      <header className="hdr">
        <div className="hdr-badge">Squad Depth Analysis</div>
        <h1>{teamName}<br /><em>Squad Depth Ratings</em></h1>
        <p className="hdr-sub">Position-by-position squad depth assessment</p>
        <div className="hdr-stats">
          <div className="hdr-stat"><div className="hdr-stat-val">{totalPlayers}</div><div className="hdr-stat-lbl">Squad Size</div></div>
          <div className="hdr-stat"><div className="hdr-stat-val">{avgRating}</div><div className="hdr-stat-lbl">Avg Rating</div></div>
          <div className="hdr-stat"><div className="hdr-stat-val">{worldClass}</div><div className="hdr-stat-lbl">World Class (90+)</div></div>
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
        </div>

        {/* Overview Grid */}
        <p className="sec-title" style={{ marginTop: 28 }}>Position Depth Overview — 15 Positions</p>
        <div className="ov-grid">
          {POSITIONS.map(p => {
            const posPlayers = byPos[p.id];
            const ds = calcDepthScore(posPlayers);
            const col = depthColor(ds);
            const lbl = depthLabel(ds);
            return (
              <a key={p.id} className="ov-card" href={`#club-pos-${p.id}`}>
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
                  <span>{posPlayers.length} players</span>
                </div>
              </a>
            );
          })}
        </div>

        {/* Forwards */}
        <div className="grp-hdr"><h2 className="grp-title">Forwards</h2><span className="grp-pill">8 Positions</span></div>
        <div className="pos-grid">
          {forwards.map(p => <PositionCard key={p.id} position={p} players={byPos[p.id]} idPrefix="club-" />)}
        </div>

        {/* Backs */}
        <div className="grp-hdr"><h2 className="grp-title">Backs</h2><span className="grp-pill">7 Positions</span></div>
        <div className="pos-grid">
          {backs.map(p => <PositionCard key={p.id} position={p} players={byPos[p.id]} idPrefix="club-" />)}
        </div>
      </div>

      <div className="depth-footer">
        <strong>{teamName} — Squad Depth Analysis</strong><br />
        Depth Score = weighted average (35 / 25 / 20 / 13 / 7% decay) across ranked players per position.
      </div>
    </div>
  );
};

function PositionCard({ position, players, idPrefix = '' }: { position: typeof POSITIONS[0]; players: DepthPlayer[]; idPrefix?: string }) {
  const ds = calcDepthScore(players);
  const col = depthColor(ds);
  const lbl = depthLabel(ds);

  return (
    <div className="pos-card" id={`${idPrefix}pos-${position.id}`}>
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
      {players.length === 0 ? (
        <div style={{ padding: '24px 18px', textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
          No players in this position
        </div>
      ) : (
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
                <tr key={`${pl.name}-${pl.pos}-${i}`}>
                  <td className="rank-cell">
                    <span className={`rank-badge ${rankClass(i)}`}>{i + 1}</span>
                  </td>
                  <td className="name-cell">
                    <span className="name-txt">{pl.name}</span>
                    <span className={`tier-badge ${tCls}`}>{tLbl}</span>
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
      )}
    </div>
  );
}

export default ClubSquadDepth;
