/**
 * EQverse - Navbar (Fighting-Game HUD Top Bar)
 * Angular cut-corner bar with XP meter, rank badge, and category-accent brand.
 */

import EqverseLogo from './EqverseLogo';

export default function Navbar({ user, onLogout, onHome }) {
  const xp = user?.total_xp || 0;

  const getRank = (xpVal) => {
    if (xpVal >= 500) return { title: 'MASTER DIPLOMAT', color: '#F43F5E', tier: 'S' };
    if (xpVal >= 250) return { title: 'SENIOR NEGOTIATOR', color: '#7C3AED', tier: 'A' };
    if (xpVal >= 100) return { title: 'EQ TACTICIAN', color: '#06B6D4', tier: 'B' };
    return { title: 'ROOKIE', color: '#F59E0B', tier: 'C' };
  };

  const rank = getRank(xp);

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0B0B0E]/95 backdrop-blur-md border-b border-[#2A2A32]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* ── Brand / Logo ── */}
          <div className="flex items-center gap-4">
            <button
              onClick={onHome}
              className="flex items-center group cursor-pointer focus:outline-none"
              title="Return to Arena Home"
            >
              <EqverseLogo size="sm" subtitle="COMBAT ARENA" />
            </button>

            <button
              onClick={onHome}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-[#6E6E78] hover:text-white
                         hud-panel-sm hover:border-[#3A3A44] transition-all cursor-pointer uppercase tracking-wider"
            >
              <span>⚔</span>
              <span>Roster</span>
            </button>
          </div>

          {/* ── Player HUD ── */}
          {user && (
            <div className="flex items-center gap-3">

              {/* Rank Badge (Angular) */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 hud-panel-sm"
                   style={{ borderColor: `${rank.color}40` }}>
                <span className="w-5 h-5 flex items-center justify-center text-[10px] font-black font-mono rounded-sm"
                      style={{ backgroundColor: `${rank.color}20`, color: rank.color }}>
                  {rank.tier}
                </span>
                <span className="text-[11px] font-bold font-display uppercase tracking-wider"
                      style={{ color: rank.color }}>
                  {rank.title}
                </span>
              </div>

              {/* XP Counter (Monospace Tabular) */}
              <div className="flex items-center gap-2 px-3 py-1.5 hud-panel-sm" style={{ borderColor: '#F59E0B30' }}>
                <span className="text-xs">⚡</span>
                <span className="stat-value text-xs text-[#F59E0B]">{xp} XP</span>
              </div>

              {/* Player Avatar */}
              <div className="flex items-center gap-2 pl-3 border-l border-[#2A2A32]">
                <div className="w-8 h-8 hud-panel-sm flex items-center justify-center bg-gradient-to-br from-[#7C3AED] to-[#EC4899]">
                  <span className="text-white text-xs font-black uppercase">
                    {user.username?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="hidden sm:block text-xs font-bold text-white max-w-[120px] truncate font-display uppercase tracking-wide">
                  {user.username}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={onLogout}
                className="text-[#3A3A44] hover:text-[#F43F5E] p-2 transition-colors cursor-pointer"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
