/**
 * EQverse - Boss Card (Trading-Card Character Select)
 * Angular panels, category-accent border, HUD-bar stat display,
 * silhouette treatment for locked personas.
 */

import { useState } from 'react';
import BossAvatar from './BossAvatar';

const DIFFICULTY_CONFIG = {
  1: {
    label: 'EASY',
    color: '#22C55E',
    barWidth: '33%',
  },
  2: {
    label: 'MEDIUM',
    color: '#F59E0B',
    barWidth: '66%',
  },
  3: {
    label: 'HARD',
    color: '#F43F5E',
    barWidth: '100%',
  },
};

const CATEGORY_CONFIG = {
  workplace:  { label: 'WORKPLACE',  emoji: '💼', color: '#F59E0B' },
  family:     { label: 'FAMILY',     emoji: '🏡', color: '#16A34A' },
  friendship: { label: 'FRIENDSHIP', emoji: '🤝', color: '#D946EF' },
  romantic:   { label: 'ROMANTIC',   emoji: '💖', color: '#DC2626' },
};

export default function BossCard({ boss, onSelect, isRevealing = false, onUnlockSingle }) {
  const [lockedShake, setLockedShake] = useState(false);
  const [lockedNotice, setLockedNotice] = useState(false);

  const cat = CATEGORY_CONFIG[boss.category] || { label: boss.category?.toUpperCase(), emoji: '🎮', color: '#6366F1' };
  const diff = DIFFICULTY_CONFIG[boss.difficulty_stars] || DIFFICULTY_CONFIG[2];
  const isLocked = !boss.is_unlocked;

  const handleCardClick = () => {
    if (isLocked) {
      setLockedShake(true);
      setLockedNotice(true);
      setTimeout(() => setLockedShake(false), 500);
      setTimeout(() => setLockedNotice(false), 2500);
      return;
    }
    onSelect();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative overflow-hidden flex flex-col h-full transition-all duration-300 ${
        isLocked
          ? 'opacity-75 cursor-pointer select-none'
          : 'cursor-pointer hover:-translate-y-2'
      } ${lockedShake ? 'animate-shake-lock' : ''} ${isRevealing ? 'animate-card-flip' : ''}`}
    >
      {/* ── Card Frame (Angular Cut-Corner) ── */}
      <div
        className="flex-1 flex flex-col hud-panel relative overflow-hidden"
        style={{
          borderColor: isRevealing
            ? cat.color
            : isLocked
            ? (lockedShake ? '#EF4444' : '#2A2A32')
            : `${cat.color}30`,
          boxShadow: isRevealing
            ? `0 0 35px ${cat.color}80, inset 0 0 15px ${cat.color}30`
            : undefined,
        }}
      >
        {/* Holographic Laser Scanline Sweep (on reveal) */}
        {isRevealing && (
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            <div
              className="w-full h-24 absolute -top-24 left-0 animate-scanline"
              style={{
                background: `linear-gradient(to bottom, transparent, ${cat.color}60, #ffffff 85%, transparent)`,
                boxShadow: `0 0 25px ${cat.color}`,
              }}
            />
          </div>
        )}

        {/* Top accent strip — category color */}
        <div
          className="h-1 w-full shrink-0 transition-all duration-500"
          style={{ background: isLocked ? '#1C1C22' : cat.color }}
        />

        {/* Hover glow overlay */}
        {!isLocked && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${cat.color}12 0%, transparent 70%)`,
            }}
          />
        )}

        {/* ── 1. Hero Character Portrait Canvas (Trading Card Style) ── */}
        <div className="relative w-full h-52 sm:h-56 bg-[#0B0B0E] overflow-hidden border-b border-[#2A2A32] flex items-center justify-center shrink-0">
          {/* Portrait Image */}
          <BossAvatar
            boss={boss}
            isLocked={isLocked}
            className={`w-full h-full transition-transform duration-500 ${
              !isLocked ? 'group-hover:scale-105' : ''
            } ${isRevealing ? 'animate-unlock-burst' : ''}`}
            style={{
              clipPath: 'none',
              borderRadius: '0',
            }}
          />

          {/* Vignette & Gradient Blend into lower panel */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#141418] via-[#141418]/25 to-transparent" />

          {/* Ambient Category Glow at top */}
          {!isLocked && (
            <div
              className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-20 rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity duration-500"
              style={{ backgroundColor: cat.color }}
            />
          )}

          {/* Top Overlay Badges: Category (Left) + Difficulty (Right) */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
            {/* Category Tag (Glassmorphic) */}
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 backdrop-blur-md"
              style={{
                color: cat.color,
                backgroundColor: 'rgba(11, 11, 14, 0.85)',
                border: `1px solid ${cat.color}60`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </span>

            {/* Difficulty Badge (Glassmorphic) */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 backdrop-blur-md"
              style={{
                backgroundColor: 'rgba(11, 11, 14, 0.85)',
                border: `1px solid ${diff.color}60`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            >
              <div className="flex gap-0.5 text-xs" style={{ color: diff.color }}>
                {'★'.repeat(boss.difficulty_stars)}
                <span className="text-[#3A3A44]">{'★'.repeat(Math.max(0, 3 - boss.difficulty_stars))}</span>
              </div>
              <span
                className="text-[10px] font-black font-display uppercase tracking-[0.15em]"
                style={{ color: diff.color }}
              >
                {diff.label}
              </span>
            </div>
          </div>

          {/* Bottom Overlay: Combatant Name */}
          <div className="absolute bottom-2.5 left-3.5 right-3.5 z-10 pointer-events-none">
            <span className="text-[9px] font-black font-display uppercase tracking-[0.2em] text-[#8E8E98] block drop-shadow">
              {isLocked ? 'ENCRYPTED INTEL' : 'OPPONENT'}
            </span>
            <h3
              className={`text-xl font-black font-display uppercase tracking-wide truncate drop-shadow-lg transition-colors ${
                isLocked ? 'text-[#6E6E78]' : 'text-white group-hover:text-[var(--accent)]'
              }`}
              style={{ '--accent': cat.color }}
            >
              {isLocked ? '????' : boss.name}
            </h3>
          </div>
        </div>

        {/* ── 2. Card Body Content ── */}
        <div className="p-4 flex flex-col flex-1 gap-3.5 relative z-10">

          {/* ── Communication Archetype ── */}
          {!isLocked && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#6E6E78] font-display">
                ARCHETYPE
              </span>
              <div className="bg-[#0B0B0E] p-3 border border-[#2A2A32] min-h-[52px] flex items-center">
                <p className="text-xs text-[#A0A0AA] leading-relaxed line-clamp-2 font-medium">
                  {boss.personality_pattern}
                </p>
              </div>
            </div>
          )}

          {/* ── Skill Focus (HUD bar style) ── */}
          {!isLocked && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#6E6E78] font-display shrink-0">
                SKILL
              </span>
              <div className="flex-1 h-px bg-[#2A2A32]" />
              <span className="stat-value text-[11px]" style={{ color: cat.color }}>
                {boss.core_skill}
              </span>
            </div>
          )}

          {/* ── Difficulty HUD Meter Bar ── */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#6E6E78] font-display">
              THREAT LEVEL
            </span>
            <div className="hud-meter">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((seg) => {
                const threshold = boss.difficulty_stars * 3 + 1;
                const filled = seg <= threshold;
                return (
                  <div
                    key={seg}
                    className="hud-meter-segment"
                    style={{
                      backgroundColor: filled && !isLocked ? diff.color : '#1C1C22',
                      opacity: filled && !isLocked ? (seg <= threshold - 2 ? 1 : 0.6) : 0.3,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="p-4 pt-0">
          {isLocked ? (
            <div
              className={`flex items-center justify-between p-2.5 bg-[#0B0B0E] border transition-all text-xs gap-2 ${
                lockedNotice ? 'border-[#EF4444]/60 bg-[#EF4444]/10' : 'border-[#2A2A32]'
              }`}
            >
              <span
                className={`flex items-center gap-1.5 font-semibold transition-colors truncate ${
                  lockedNotice ? 'text-[#EF4444]' : 'text-[#6E6E78]'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-display uppercase tracking-wider text-[11px] truncate">
                  {lockedNotice ? `NEED ${boss.unlock_xp_required} XP` : `${boss.unlock_xp_required} XP`}
                </span>
              </span>

              {onUnlockSingle && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnlockSingle(boss.id);
                  }}
                  className="shrink-0 px-2.5 py-1 text-[10px] font-black font-display uppercase tracking-wider bg-[#06B6D4]/15 border border-[#06B6D4]/50 text-[#06B6D4] hover:bg-[#06B6D4]/30 hover:text-white transition-all cursor-pointer"
                  title="Unlock and open this card with animation"
                >
                  ⚡ UNLOCK
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onSelect}
              className="btn-primary-gradient w-full py-3 px-4 font-black text-xs text-white cursor-pointer
                         flex items-center justify-center gap-2 border-none"
            >
              <span className="font-display tracking-[0.15em]">ENTER BATTLE</span>
              <span className="text-sm font-black">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
