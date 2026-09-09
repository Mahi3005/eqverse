/**
 * EQverse - Tension Meter (Segmented Fighting-Game HUD Bar)
 * 20-segment meter with color transitions, threshold markers,
 * pulse animation at 85%+, and shake on big swings.
 */

import { useEffect, useState } from 'react';

const TOTAL_SEGMENTS = 20;

export default function TensionMeter({ tension = 50, delta = 0 }) {
  const [displayTension, setDisplayTension] = useState(tension);
  const [showDelta, setShowDelta] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    setDisplayTension(tension);

    if (delta !== 0 && delta !== undefined) {
      setShowDelta(true);
      const hideTimeout = setTimeout(() => setShowDelta(false), 2500);

      if (Math.abs(delta) >= 8) {
        setIsShaking(true);
        const shakeTimeout = setTimeout(() => setIsShaking(false), 500);
        return () => {
          clearTimeout(hideTimeout);
          clearTimeout(shakeTimeout);
        };
      }

      return () => clearTimeout(hideTimeout);
    }
  }, [tension, delta]);

  // Determine meter state based on value
  const getMeterState = (val) => {
    if (val >= 80) return { status: 'CRITICAL',      emoji: '🔥', color: '#EF4444', pulse: true };
    if (val >= 60) return { status: 'AT RISK',        emoji: '⚠',  color: '#F59E0B', pulse: false };
    if (val >= 35) return { status: 'EVALUATING',     emoji: '⚡', color: '#6366F1', pulse: false };
    return              { status: 'DE-ESCALATING',  emoji: '🕊',  color: '#22C55E', pulse: false };
  };

  const meter = getMeterState(displayTension);
  const filledSegments = Math.round((displayTension / 100) * TOTAL_SEGMENTS);

  // Color for each segment based on its position
  const getSegmentColor = (index) => {
    const pct = ((index + 1) / TOTAL_SEGMENTS) * 100;
    if (pct >= 85) return '#EF4444';
    if (pct >= 60) return '#F59E0B';
    if (pct >= 35) return '#6366F1';
    return '#22C55E';
  };

  return (
    <div className={`space-y-2.5 ${isShaking ? 'animate-tension-shake' : ''}`}>
      {/* ── Top Status Row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#6E6E78] font-display">
            TENSION
          </span>
          {showDelta && delta !== 0 && (
            <span
              className={`stat-value text-[10px] px-1.5 py-0.5 animate-slide-up flex items-center gap-0.5 ${
                delta < 0
                  ? 'text-[#22C55E] bg-[#22C55E]/15 border border-[#22C55E]/30'
                  : 'text-[#EF4444] bg-[#EF4444]/15 border border-[#EF4444]/30'
              }`}
            >
              <span>{delta < 0 ? '▼' : '▲'}</span>
              <span>{delta > 0 ? `+${delta}` : delta}%</span>
            </span>
          )}
        </div>

        {/* Status Badge */}
        <span
          className={`text-[10px] font-black font-display uppercase tracking-[0.1em] px-2 py-0.5 border ${
            meter.pulse ? 'animate-meter-pulse' : ''
          }`}
          style={{
            color: meter.color,
            backgroundColor: `${meter.color}15`,
            borderColor: `${meter.color}40`,
          }}
        >
          {meter.emoji} {meter.status}
        </span>
      </div>

      {/* ── Segmented HUD Meter Bar ── */}
      <div className="relative">
        <div className="hud-meter">
          {Array.from({ length: TOTAL_SEGMENTS }, (_, i) => {
            const isFilled = i < filledSegments;
            const segColor = getSegmentColor(i);
            return (
              <div
                key={i}
                className={`hud-meter-segment ${meter.pulse && isFilled && i >= TOTAL_SEGMENTS - 4 ? 'animate-meter-pulse' : ''}`}
                style={{
                  backgroundColor: isFilled ? segColor : '#1C1C22',
                  boxShadow: isFilled ? `0 0 6px ${segColor}40` : 'none',
                  opacity: isFilled ? 1 : 0.3,
                }}
              />
            );
          })}
        </div>

        {/* Threshold Markers */}
        <div className="absolute top-0 bottom-0 left-[20%] w-px bg-[#22C55E]/50" title="Victory threshold (< 20%)" />
        <div className="absolute top-0 bottom-0 left-[85%] w-px bg-[#EF4444]/60" title="Escalation threshold (> 85%)" />
      </div>

      {/* ── Bottom Legend ── */}
      <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-wider">
        <span className="text-[#22C55E] font-bold">0% RESOLVED</span>
        <span className="stat-value text-[#6E6E78]">{displayTension}/100</span>
        <span className="text-[#EF4444] font-bold">100% CRITICAL</span>
      </div>
    </div>
  );
}
