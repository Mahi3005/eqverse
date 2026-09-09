/**
 * EQverse - Arena Home (Character-Select Grid)
 * Fighting-game roster screen with angular HUD panels,
 * category-tabbed filter, segmented stat bars, and card grid.
 */

import { useState, useEffect } from 'react';
import { fetchBosses, startBattle } from '../services/api';
import BossCard from './BossCard';
import BriefingModal from './BriefingModal';

const CATEGORIES = [
  { id: 'all',        label: 'ALL FIGHTERS',  icon: '⚔' },
  { id: 'workplace',  label: 'WORKPLACE',     icon: '💼', color: '#F59E0B' },
  { id: 'family',     label: 'FAMILY',        icon: '🏡', color: '#16A34A' },
  { id: 'friendship', label: 'FRIENDSHIP',    icon: '🤝', color: '#D946EF' },
  { id: 'romantic',   label: 'ROMANTIC',       icon: '💖', color: '#DC2626' },
];

export default function ArenaHome({ user, onStartBattle }) {
  const [bosses, setBosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedBoss, setSelectedBoss] = useState(null);
  const [startingBattle, setStartingBattle] = useState(false);

  // 'all' = All 6 cards open (default for test account)
  // 'locked' = Simulate 0 XP progression (Riya unlocked, others locked in silhouette)
  const [unlockMode, setUnlockMode] = useState('all');
  const [manualUnlockedIds, setManualUnlockedIds] = useState(new Set());
  const [revealingIds, setRevealingIds] = useState(new Set());
  const [isRevealingSequence, setIsRevealingSequence] = useState(false);

  useEffect(() => {
    loadBosses();
  }, []);

  const loadBosses = async () => {
    try {
      setLoading(true);
      const data = await fetchBosses();
      setBosses(data.bosses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isBossUnlocked = (boss) => {
    if (unlockMode === 'all') return true;
    if (manualUnlockedIds.has(boss.id)) return true;
    return boss.unlock_xp_required === 0;
  };

  const filteredBosses = activeCategory === 'all'
    ? bosses
    : bosses.filter((b) => b.category === activeCategory);

  const displayBosses = filteredBosses.map((b) => ({
    ...b,
    is_unlocked: isBossUnlocked(b),
  }));

  const unlockedCount = bosses.filter((b) => isBossUnlocked(b)).length;
  const xp = user?.total_xp || 0;
  const won = user?.battles_won || 0;
  const lost = user?.battles_lost || 0;
  const totalBattles = won + lost;
  const winRate = totalBattles > 0 ? Math.round((won / totalBattles) * 100) : 0;

  // Single card unlock with animation
  const handleUnlockSingle = (bossId) => {
    setRevealingIds((prev) => new Set([...prev, bossId]));
    setManualUnlockedIds((prev) => new Set([...prev, bossId]));

    setTimeout(() => {
      setRevealingIds((prev) => {
        const next = new Set(prev);
        next.delete(bossId);
        return next;
      });
    }, 1200);
  };

  // Cinematic sequential "cards opening up" animation
  const handleWatchOpeningAnimation = () => {
    setIsRevealingSequence(true);
    // 1. Lock the cards so the user sees the transition from locked -> unlocked
    setUnlockMode('locked');
    setManualUnlockedIds(new Set());
    setRevealingIds(new Set());

    // 2. Identify the locked cards
    const lockedBosses = filteredBosses.filter((b) => b.unlock_xp_required > 0);

    // 3. Sequentially open each locked card with a dramatic stagger
    lockedBosses.forEach((boss, idx) => {
      setTimeout(() => {
        setRevealingIds((prev) => new Set([...prev, boss.id]));
        setManualUnlockedIds((prev) => new Set([...prev, boss.id]));
      }, 500 + idx * 450);
    });

    // 4. Complete the sequence and set unlockMode to 'all'
    setTimeout(() => {
      setUnlockMode('all');
      setRevealingIds(new Set());
      setIsRevealingSequence(false);
    }, 500 + lockedBosses.length * 450 + 1200);
  };

  const handleSelectBoss = (boss) => {
    if (!boss.is_unlocked) return;
    setSelectedBoss(boss);
  };

  const handleStartBattle = async () => {
    if (!selectedBoss) return;
    setStartingBattle(true);
    try {
      const data = await startBattle(selectedBoss.id);
      onStartBattle(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setStartingBattle(false);
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6">

      {/* ── 1. Hero / Player HUD Strip ─────────────────────── */}
      <div className="hud-panel p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle corner glow */}
        <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-[#6366F1]/8 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-[#DC2626]/6 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl text-center lg:text-left">
            {/* Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6366F1]/10 border border-[#6366F1]/30 text-[#6366F1] text-[10px] font-black uppercase tracking-[0.2em] mb-3">
              <span className="w-1.5 h-1.5 bg-[#06B6D4] animate-pulse" />
              <span>CONFLICT SIMULATION ACTIVE</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-white tracking-wide uppercase leading-tight mb-2">
              SELECT YOUR <span className="gradient-text">OPPONENT</span>
            </h1>

            <p className="text-[#6E6E78] text-sm leading-relaxed max-w-xl">
              High-stakes AI personas await. Pick your conflict, calibrate your empathy, and prove your emotional intelligence under pressure.
            </p>
          </div>

          {/* ── Stats HUD Cards ── */}
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            {/* XP */}
            <div className="hud-panel p-4 text-center" style={{ borderColor: '#F59E0B25' }}>
              <span className="text-[10px] text-[#6E6E78] uppercase tracking-[0.15em] font-black font-display block mb-1">
                TOTAL XP
              </span>
              <span className="stat-value text-2xl sm:text-3xl text-[#F59E0B] block">
                {xp}
              </span>
              <span className="text-[10px] text-[#3A3A44] font-display uppercase tracking-wider mt-0.5 block">
                TIER {xp >= 500 ? 'S' : xp >= 250 ? 'A' : xp >= 100 ? 'B' : 'C'}
              </span>
            </div>

            {/* Win Rate */}
            <div className="hud-panel p-4 text-center" style={{ borderColor: '#22C55E25' }}>
              <span className="text-[10px] text-[#6E6E78] uppercase tracking-[0.15em] font-black font-display block mb-1">
                WIN RATE
              </span>
              <span className="stat-value text-2xl sm:text-3xl text-[#22C55E] block">
                {winRate}%
              </span>
              <span className="text-[10px] text-[#3A3A44] font-display uppercase tracking-wider mt-0.5 block">
                {won}W / {lost}L
              </span>
            </div>

            {/* Roster */}
            <div className="hud-panel p-4 text-center" style={{ borderColor: '#06B6D425' }}>
              <span className="text-[10px] text-[#6E6E78] uppercase tracking-[0.15em] font-black font-display block mb-1">
                ROSTER
              </span>
              <span className="stat-value text-2xl sm:text-3xl text-[#06B6D4] block">
                {unlockedCount}/{bosses.length || 6}
              </span>
              <span className="text-[10px] text-[#3A3A44] font-display uppercase tracking-wider mt-0.5 block">
                UNLOCKED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Category Tabs (Fighting-Game Style) ─────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#2A2A32] pb-4">
        {CATEGORIES.map((cat) => {
          const count = cat.id === 'all'
            ? bosses.length
            : bosses.filter((b) => b.category === cat.id).length;

          const isActive = activeCategory === cat.id;
          const accentColor = cat.color || '#6366F1';

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="relative px-4 py-2 text-[11px] font-black font-display uppercase tracking-[0.15em] transition-all duration-200 cursor-pointer
                         flex items-center gap-2 border"
              style={{
                background: isActive ? `${accentColor}12` : '#141418',
                borderColor: isActive ? `${accentColor}50` : '#2A2A32',
                color: isActive ? accentColor : '#6E6E78',
              }}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className="stat-value text-[10px] px-1.5 py-0.5"
                style={{
                  backgroundColor: isActive ? accentColor : '#1C1C22',
                  color: isActive ? '#0B0B0E' : '#6E6E78',
                }}
              >
                {count}
              </span>

              {/* Active accent underline */}
              {isActive && (
                <div
                  className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-8 h-[2px]"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── 2b. Testing & Animation Controls ──────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#141418] border border-[#2A2A32] hud-panel-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
          <span className="font-display font-black tracking-wider text-xs text-[#E2E2EA] uppercase">
            ROSTER LAB
          </span>
          <span className="text-[11px] text-[#6E6E78]">
            • {unlockedCount} of {bosses.length} Cards Open ({unlockMode === 'all' ? 'All Unlocked' : 'Locked Preview'})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Mode Selector: All Open vs Preview Locked */}
          <div className="inline-flex items-center bg-[#0B0B0E] p-0.5 border border-[#2A2A32]">
            <button
              onClick={() => {
                setUnlockMode('all');
                setManualUnlockedIds(new Set());
              }}
              className={`px-3 py-1.5 text-[11px] font-black font-display uppercase tracking-wider transition-all cursor-pointer ${
                unlockMode === 'all'
                  ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40'
                  : 'text-[#6E6E78] hover:text-white border border-transparent'
              }`}
            >
              🔓 ALL OPEN
            </button>
            <button
              onClick={() => {
                setUnlockMode('locked');
                setManualUnlockedIds(new Set());
              }}
              className={`px-3 py-1.5 text-[11px] font-black font-display uppercase tracking-wider transition-all cursor-pointer ${
                unlockMode === 'locked'
                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                  : 'text-[#6E6E78] hover:text-white border border-transparent'
              }`}
            >
              🔒 PREVIEW LOCKED
            </button>
          </div>

          {/* Cinematic Watch Opening Animation Button */}
          <button
            onClick={handleWatchOpeningAnimation}
            disabled={isRevealingSequence}
            className="px-4 py-1.5 text-[11px] font-black font-display uppercase tracking-wider bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white hover:brightness-110 shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all cursor-pointer flex items-center gap-1.5 border border-[#6366F1]/50 disabled:opacity-50"
            title="Start from locked silhouettes and watch all cards open up with laser scanlines and avatar bursts"
          >
            <span>▶</span>
            <span>{isRevealingSequence ? 'OPENING CARDS...' : 'WATCH CARDS OPEN UP'}</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────── */}
      {error && (
        <div className="text-center py-3">
          <div className="inline-flex items-center gap-2 px-5 py-3 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ── Loading Skeleton ───────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-2 border-[#06B6D4]/20 border-t-[#06B6D4] rounded-full animate-spin" />
          <p className="text-[#3A3A44] font-bold font-display text-sm tracking-[0.15em] uppercase animate-pulse">
            LOADING COMBATANTS...
          </p>
        </div>
      )}

      {/* ── 3. Character-Select Grid ───────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayBosses.map((boss, index) => (
            <div
              key={boss.id}
              className="animate-scale-in h-full"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <BossCard
                boss={boss}
                isRevealing={revealingIds.has(boss.id)}
                onUnlockSingle={handleUnlockSingle}
                onSelect={() => handleSelectBoss(boss)}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ────────────────────────────────────── */}
      {!loading && filteredBosses.length === 0 && !error && (
        <div className="text-center py-16 hud-panel">
          <p className="text-[#3A3A44] text-sm font-display uppercase tracking-wider">
            NO COMBATANTS IN THIS CATEGORY
          </p>
        </div>
      )}

      {/* ── Briefing Modal ─────────────────────────────────── */}
      {selectedBoss && (
        <BriefingModal
          boss={selectedBoss}
          onStart={handleStartBattle}
          onClose={() => setSelectedBoss(null)}
          loading={startingBattle}
        />
      )}
    </div>
  );
}
