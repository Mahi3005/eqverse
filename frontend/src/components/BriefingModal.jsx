/**
 * EQverse - Briefing Modal (VS Screen)
 * Fighting-game VS splash with angular panels,
 * persona dossier, and battle-start CTA.
 */

import BossAvatar from './BossAvatar';

const CATEGORY_COLORS = {
  workplace:  '#F59E0B',
  family:     '#16A34A',
  friendship: '#D946EF',
  romantic:   '#DC2626',
};

export default function BriefingModal({ boss, onStart, onClose, loading }) {
  const catColor = CATEGORY_COLORS[boss.category] || '#6366F1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg animate-scale-in">
        <div className="hud-panel overflow-hidden" style={{ borderColor: `${catColor}30` }}>

          {/* ── VS Header Strip ── */}
          <div className="relative px-6 pt-5 pb-4" style={{ background: `linear-gradient(135deg, ${catColor}10, transparent)` }}>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center
                         text-[#3A3A44] hover:text-white bg-[#0B0B0E]/60 hover:bg-[#0B0B0E] transition-all cursor-pointer text-xs font-bold"
            >
              ✕
            </button>

            {/* VS Layout */}
            <div className="flex items-center gap-4">
              {/* Persona Avatar */}
              <BossAvatar
                boss={boss}
                className="w-16 h-16 hud-panel-sm text-3xl"
                glow={true}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* VS Badge */}
                  <span className="text-[10px] font-black font-display px-2 py-0.5 bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] tracking-[0.2em]">
                    VS
                  </span>
                </div>
                <h2 className="text-2xl font-black font-display text-white uppercase tracking-wide truncate">
                  {boss.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {/* Difficulty Stars */}
                  <div className="flex gap-0.5 text-xs" style={{ color: '#F59E0B' }}>
                    {'★'.repeat(boss.difficulty_stars)}
                    <span className="text-[#1C1C22]">{'★'.repeat(Math.max(0, 3 - boss.difficulty_stars))}</span>
                  </div>
                  <span className="text-[10px] text-[#3A3A44]">•</span>
                  <span className="text-[10px] text-[#6E6E78] font-display uppercase tracking-wider">{boss.personality_pattern}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Body Content ── */}
          <div className="px-6 py-5 space-y-4">
            {/* Situation Brief */}
            <div>
              <h3 className="text-[10px] font-black font-display uppercase tracking-[0.15em] mb-2 flex items-center gap-2"
                  style={{ color: catColor }}>
                <span className="w-4 h-px" style={{ backgroundColor: `${catColor}50` }} />
                SITUATION BRIEF
              </h3>
              <p className="text-sm text-[#A0A0AA] leading-relaxed">
                {boss.backstory}
              </p>
            </div>

            {/* Objective */}
            <div className="p-4 bg-[#0B0B0E] border border-[#2A2A32]">
              <h3 className="text-[10px] font-black font-display uppercase tracking-[0.15em] text-[#F59E0B] mb-2 flex items-center gap-2">
                <span>🎯</span>
                YOUR OBJECTIVE
              </h3>
              <p className="text-sm text-[#E2E2EA] leading-relaxed font-medium">
                {boss.goal}
              </p>
            </div>

            {/* Core Skill */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[10px] font-black font-display uppercase tracking-[0.15em] text-[#6E6E78]">SKILL FOCUS</span>
              <div className="flex-1 h-px bg-[#2A2A32]" />
              <span
                className="text-xs font-bold font-display px-2.5 py-0.5 uppercase tracking-wider"
                style={{
                  color: catColor,
                  borderColor: `${catColor}35`,
                  backgroundColor: `${catColor}12`,
                  border: `1px solid ${catColor}35`,
                }}
              >
                {boss.core_skill}
              </span>
            </div>
          </div>

          {/* ── Footer CTA ── */}
          <div className="px-6 pb-5">
            <button
              onClick={onStart}
              disabled={loading}
              className="btn-primary-gradient w-full py-4 font-black text-base text-white cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all font-display tracking-[0.15em] border-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  ENTERING ARENA...
                </span>
              ) : (
                '⚔ COMMENCE BATTLE'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
