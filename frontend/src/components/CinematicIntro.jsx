import { useState, useEffect, useRef } from 'react';

/**
 * CinematicIntro Component
 * Professional AAA Game Studio Bumper & Welcome Intro for EQVERSE
 *
 * Sequence (~6.5s total, skippable):
 * - 0.0s–1.5s: Atmospheric void, cosmic embers, and neural telemetry diagnostics
 * - 1.5s–2.5s: Dual 3D clash wings accelerate from wide perspective inward
 * - 2.5s: Hard metallic collision, screen shake, radial energy flash, and clash audio impact
 * - 2.85s: "EQVERSE" wordmark slams in with chromatic bloom
 * - 2.9s–5.5s: Professional game announcer voice speaks:
 *              "Welcome to EQ-VERSE. Master your emotions. Enter the arena."
 *              Tagline and combat telemetry badge unfold
 * - 5.5s–6.4s: Hyperspace laser streak wipe transitions into Arena Roster screen
 */
export default function CinematicIntro({ onComplete }) {
  const [stage, setStage] = useState(0); // 0: init/telemetry, 1: clash-slide, 2: wordmark, 3: welcome-tagline, 4: wipe, 5: done
  const [impacted, setImpacted] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [telemetryText, setTelemetryText] = useState('SYS_INIT: NEURAL COMBAT SIMULATION');
  const audioRef = useRef(null);
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {
        // audio cleanup
      }
    }
    onComplete();
  };

  useEffect(() => {
    // 1. Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setStage(3);
      setImpacted(true);
      const t = setTimeout(() => handleFinish(), 800);
      return () => clearTimeout(t);
    }

    // 2. Play AAA Announcer Voice + Cinematic SFX (6.6s master)
    try {
      const audio = new Audio('/audio/intro-sequence.wav');
      audio.volume = 0.9;
      audioRef.current = audio;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Intro audio autoplay blocked by browser:', err);
        });
      }
    } catch (err) {
      console.warn('Audio initialization error:', err);
    }

    // 3. Orchestrate Visual Sequence Timers (~6.5s)
    const timers = [];

    // Show skip button after 0.5s
    timers.push(setTimeout(() => setShowSkip(true), 500));

    // Telemetry updates in Act 1
    timers.push(setTimeout(() => setTelemetryText('INITIALIZING CONFLICT RESOLUTION MATRIX...'), 700));
    timers.push(setTimeout(() => setTelemetryText('SYNCING COMBAT PROTOCOLS... READY FOR ENGAGEMENT'), 1400));

    // Act 2: Clash wings slide in at 1.5s
    timers.push(setTimeout(() => setStage(1), 1500));

    // Act 2 Impact moment: 2.5s (Wings snap together + screen shake + flash + sound impact)
    timers.push(
      setTimeout(() => {
        setImpacted(true);
      }, 2500)
    );

    // Act 3: Wordmark slams in at 2.85s (sync with voice hit)
    timers.push(setTimeout(() => setStage(2), 2850));

    // Act 3: Welcome tagline and subtitle unfold at 3.7s
    timers.push(setTimeout(() => setStage(3), 3700));

    // Act 4: Hyperspace laser streak wipe transition at 5.5s
    timers.push(setTimeout(() => setStage(4), 5500));

    // Final finish and reveal at 6.45s
    timers.push(setTimeout(() => handleFinish(), 6450));

    return () => {
      timers.forEach((t) => clearTimeout(t));
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#060608] flex flex-col items-center justify-center overflow-hidden select-none ${
        impacted && stage < 4 ? 'animate-intro-shake' : ''
      }`}
    >
      {/* ── Holographic Radar Grid Background ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.15) 0%, transparent 70%), linear-gradient(rgba(34, 211, 238, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.05) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      />

      {/* ── Ambient Floating Embers ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none animate-pulse"
            style={{
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              left: `${(i * 17) % 100}%`,
              top: `${(i * 29) % 100}%`,
              backgroundColor: i % 2 === 0 ? '#22D3EE' : '#A855F7',
              boxShadow: i % 2 === 0 ? '0 0 10px #22D3EE' : '0 0 10px #A855F7',
              opacity: (i % 5) * 0.12 + 0.25,
              animationDuration: `${(i % 4) + 2}s`,
            }}
          />
        ))}
      </div>

      {/* ── Top Telemetry HUD Bar (Act 1: 0.0s - 2.5s) ── */}
      <div
        className={`absolute top-10 left-0 right-0 flex justify-center pointer-events-none transition-all duration-700 ${
          stage < 2 ? 'opacity-75 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0E0E14]/80 border border-[#22D3EE]/30 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-ping" />
          <span className="font-mono text-[10px] text-[#22D3EE] tracking-[0.25em] font-semibold uppercase">
            {telemetryText}
          </span>
        </div>
      </div>

      {/* ── Center Stage Container ── */}
      <div
        className={`relative z-20 flex flex-col items-center justify-center transition-all duration-700 ${
          stage >= 4 ? 'scale-90 opacity-70' : 'scale-100'
        }`}
      >
        {/* ── 3D Clash Motif Assembly (1.5s - 2.5s) ── */}
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
          {/* Ambient Core Aura once snapped */}
          {impacted && (
            <div
              className="absolute -inset-6 rounded-full opacity-70 blur-2xl pointer-events-none animate-pulse"
              style={{
                background:
                  'radial-gradient(circle, rgba(34,211,238,0.65) 0%, rgba(124,58,237,0.45) 45%, transparent 70%)',
              }}
            />
          )}

          {/* Flash burst & shockwave at exact impact (2.5s) */}
          {impacted && (
            <>
              <div
                className="absolute w-32 h-32 rounded-full pointer-events-none animate-intro-flash"
                style={{
                  background:
                    'radial-gradient(circle, #FFFFFF 0%, rgba(34,211,238,0.95) 35%, rgba(124,58,237,0.5) 65%, transparent 100%)',
                  boxShadow: '0 0 60px #22D3EE, 0 0 120px #7C3AED',
                }}
              />
              <div
                className="absolute w-44 h-44 rounded-full border-2 border-[#22D3EE]/80 pointer-events-none animate-ping"
                style={{ animationDuration: '0.8s' }}
              />
            </>
          )}

          {/* Left Clash Wing */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-500 ease-out"
            style={{
              clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
              transform:
                stage === 0
                  ? 'translateX(-120px) rotate(-16deg) scale(0.8)'
                  : impacted
                  ? 'translateX(0) rotate(0deg) scale(1)'
                  : 'translateX(-25px) rotate(-4deg) scale(0.96)',
              opacity: stage === 0 ? 0 : 1,
              filter:
                'drop-shadow(0 16px 24px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 18px rgba(124, 58, 237, 0.65))',
            }}
          >
            <img
              src="/logo-emblem.png"
              alt="Clash Left"
              className="w-full h-full object-contain select-none"
            />
          </div>

          {/* Right Clash Wing */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-500 ease-out"
            style={{
              clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
              transform:
                stage === 0
                  ? 'translateX(120px) rotate(16deg) scale(0.8)'
                  : impacted
                  ? 'translateX(0) rotate(0deg) scale(1)'
                  : 'translateX(25px) rotate(4deg) scale(0.96)',
              opacity: stage === 0 ? 0 : 1,
              filter:
                'drop-shadow(0 16px 24px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 18px rgba(34, 211, 238, 0.65))',
            }}
          >
            <img
              src="/logo-emblem.png"
              alt="Clash Right"
              className="w-full h-full object-contain select-none"
            />
          </div>
        </div>

        {/* ── Wordmark Slam & Welcome (2.85s – 5.5s) ── */}
        <div
          className={`mt-6 flex flex-col items-center transition-all duration-400 ${
            stage >= 2 ? 'opacity-100 animate-intro-wordmark' : 'opacity-0 scale-125'
          }`}
        >
          {/* Main Title Wordmark */}
          <div
            className="flex items-center font-black font-display uppercase italic text-5xl sm:text-6xl tracking-tighter"
            style={{
              filter:
                'drop-shadow(0 4px 14px rgba(34, 211, 238, 0.5)) drop-shadow(0 0 30px rgba(124, 58, 237, 0.4))',
            }}
          >
            <span
              className="text-white"
              style={{
                textShadow:
                  '0 0 14px rgba(34, 211, 238, 0.85), 0 0 30px rgba(34, 211, 238, 0.45)',
              }}
            >
              EQ
            </span>
            <span className="bg-gradient-to-r from-[#C084FC] via-[#7C3AED] to-[#22D3EE] bg-clip-text text-transparent">
              VERSE
            </span>
          </div>

          {/* ── Welcome Tagline & Subtitle (3.7s - 5.5s) ── */}
          <div
            className={`flex flex-col items-center gap-2 mt-3 transform -skew-x-6 transition-all duration-700 ${
              stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="h-[1px] w-6 bg-gradient-to-r from-transparent to-[#22D3EE]" />
              <span className="font-display uppercase font-bold text-sm sm:text-base text-[#D0D0E0] tracking-[0.35em] drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                CONFLICT INTELLIGENCE ARENA
              </span>
              <span className="h-[1px] w-6 bg-gradient-to-l from-transparent to-[#22D3EE]" />
            </div>

            {/* Telemetry Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-[#14141E]/90 border border-[#22D3EE]/30 text-[10px] text-[#22D3EE] font-mono tracking-widest font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span>NEURAL SYNC ESTABLISHED • ARENA COMBAT READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Light Streak Scene Wipe Transition (5.5s - 6.45s) ── */}
      {stage >= 4 && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
          {/* Sweeping Laser Beam */}
          <div
            className="absolute inset-y-0 w-48 animate-intro-wipe"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.4) 30%, #FFFFFF 50%, rgba(124,58,237,0.5) 70%, transparent 100%)',
              boxShadow: '0 0 60px #22D3EE, 0 0 120px #7C3AED',
            }}
          />
          {/* Flash Fade to Arena */}
          <div
            className="absolute inset-0 bg-[#0B0B0E] animate-fade-in"
            style={{ animationDuration: '0.6s' }}
          />
        </div>
      )}

      {/* ── Skip Button (fades in at 0.5s) ── */}
      {showSkip && (
        <button
          onClick={handleFinish}
          className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-[#141418]/90 hover:bg-[#1C1C24] text-[#8E8E98] hover:text-white border border-[#2A2A32] hover:border-[#22D3EE] font-display text-xs uppercase tracking-[0.2em] font-bold transition-all cursor-pointer flex items-center gap-2 backdrop-blur-md shadow-lg group"
        >
          <span>SKIP</span>
          <span className="text-[10px] text-[#22D3EE] group-hover:translate-x-1 transition-transform">
            ❯❯
          </span>
        </button>
      )}
    </div>
  );
}
