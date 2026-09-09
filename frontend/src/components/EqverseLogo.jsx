/**
 * EQVERSE - Franchise Emblem & Wordmark Component
 * Authentic AAA Fighting / RPG Game Studio Logo
 *
 * Features:
 * - Symmetrical clash-to-resolution emblem: duel shield wings meeting at center diamond spark
 * - Condensed, aggressive esports/fighting-game display typography with italic forward lean
 * - "EQ" in crisp solid white/cyan glow, "VERSE" in violet-to-cyan neon gradient
 * - Multi-tier neon bloom filter mimicking stage/arena rim lighting
 */

export default function EqverseLogo({
  size = 'md',
  layout = 'horizontal',
  showWordmark = true,
  showSubtitle = true,
  subtitle = 'COMBAT ARENA',
  className = '',
  animated = true,
}) {
  // Sizing configurations
  const SIZES = {
    xs: {
      emblem: 'w-6 h-6',
      eq: 'text-sm tracking-tight',
      verse: 'text-sm tracking-tight',
      subtitle: 'text-[7px] tracking-[0.2em]',
      gap: layout === 'vertical' ? 'gap-1.5' : 'gap-2',
    },
    sm: {
      emblem: 'w-8 h-8',
      eq: 'text-base tracking-tight',
      verse: 'text-base tracking-tight',
      subtitle: 'text-[8px] tracking-[0.22em]',
      gap: layout === 'vertical' ? 'gap-2' : 'gap-2.5',
    },
    md: {
      emblem: 'w-10 h-10',
      eq: 'text-xl tracking-tighter',
      verse: 'text-xl tracking-tighter',
      subtitle: 'text-[9px] tracking-[0.25em]',
      gap: layout === 'vertical' ? 'gap-2.5' : 'gap-3',
    },
    lg: {
      emblem: 'w-24 h-24 sm:w-28 sm:h-28',
      eq: 'text-3xl sm:text-4xl tracking-tighter',
      verse: 'text-3xl sm:text-4xl tracking-tighter',
      subtitle: 'text-[11px] sm:text-xs tracking-[0.28em]',
      gap: layout === 'vertical' ? 'gap-3' : 'gap-3.5',
    },
    xl: {
      emblem: 'w-32 h-32 sm:w-36 sm:h-36',
      eq: 'text-5xl sm:text-6xl tracking-tighter',
      verse: 'text-5xl sm:text-6xl tracking-tighter',
      subtitle: 'text-xs tracking-[0.32em]',
      gap: layout === 'vertical' ? 'gap-4' : 'gap-4.5',
    },
  };

  const config = SIZES[size] || SIZES.md;
  const isVertical = layout === 'vertical';

  return (
    <div
      className={`inline-flex ${isVertical ? 'flex-col items-center text-center' : 'items-center'} ${config.gap} select-none group ${className}`}
    >
      {/* ── Franchise Symmetrical 3D Emblem Crest ── */}
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Soft Ambient Neon Glow Behind 3D Emblem */}
        <div
          className={`absolute -inset-2 rounded-full opacity-40 blur-xl pointer-events-none transition-all duration-500 ${
            animated ? 'group-hover:opacity-75 group-hover:scale-125' : ''
          }`}
          style={{
            background: 'radial-gradient(circle, rgba(34,211,238,0.45) 0%, rgba(124,58,237,0.35) 45%, transparent 70%)',
          }}
        />

        {/* 3D Sculpted Emblem with True Volumetric Silhouette Shadows */}
        <img
          src="/logo-emblem.png"
          alt="EQVERSE 3D Emblem"
          className={`${config.emblem} relative z-10 object-contain select-none transition-all duration-400 ease-out ${
            animated ? 'group-hover:-translate-y-1.5 group-hover:scale-108' : ''
          }`}
          style={{
            // 3D perspective tilt and directional contact shadow for tangible depth
            transform: 'perspective(700px) rotateX(5deg)',
            filter: 'drop-shadow(0 14px 22px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 16px rgba(34, 211, 238, 0.45)) drop-shadow(0 0 30px rgba(124, 58, 237, 0.3))',
          }}
        />
      </div>

      {/* ── Esports / Fighting-Game Wordmark Treatment ── */}
      {showWordmark && (
        <div className={`flex flex-col min-w-0 ${isVertical ? 'items-center' : 'justify-center'}`}>
          <div
            className={`flex items-center font-black font-display uppercase italic transform -skew-x-6 leading-none transition-all duration-300 ${
              isVertical ? 'justify-center' : ''
            }`}
            style={{
              letterSpacing: '-0.035em',
              filter: 'drop-shadow(0 2px 8px rgba(34, 211, 238, 0.35)) drop-shadow(0 0 16px rgba(124, 58, 237, 0.3))',
            }}
          >
            {/* "EQ" - Solid crisp white with cyan edge reflection */}
            <span
              className={`${config.eq} text-white transition-colors duration-200`}
              style={{
                textShadow: '0 0 8px rgba(34, 211, 238, 0.6), 0 0 20px rgba(34, 211, 238, 0.3)',
              }}
            >
              EQ
            </span>

            {/* "VERSE" - Deep violet to cyan gradient matching the clash emblem */}
            <span
              className={`${config.verse} bg-gradient-to-r from-[#C084FC] via-[#7C3AED] to-[#22D3EE] bg-clip-text text-transparent`}
              style={{
                filter: 'drop-shadow(0 0 10px rgba(124, 58, 237, 0.45))',
              }}
            >
              VERSE
            </span>
          </div>

          {/* Subtitle / Franchise Tagline */}
          {showSubtitle && (
            <div className={`flex items-center gap-1.5 mt-1 transform -skew-x-6 ${isVertical ? 'justify-center' : ''}`}>
              <div className="w-1 h-1 bg-[#22D3EE] rounded-full shadow-[0_0_6px_#22D3EE]" />
              <span className={`${config.subtitle} font-display uppercase font-bold text-[#8E8E98] tracking-[0.25em] leading-none`}>
                {subtitle}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
