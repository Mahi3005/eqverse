import { useState } from 'react';

const BOSS_AVATARS = {
  riya: '/avatars/riya.png',
  kabir: '/avatars/kabir.png',
  meera: '/avatars/meera.png',
  sam: '/avatars/sam.png',
  alex: '/avatars/alex.png',
  mr_sharma: '/avatars/mr_sharma.png',
};

const CATEGORY_GLOWS = {
  workplace:  '#F59E0B',
  family:     '#16A34A',
  friendship: '#D946EF',
  romantic:   '#DC2626',
};

export function getBossAvatarUrl(boss) {
  if (!boss) return null;
  return boss.avatar_img || BOSS_AVATARS[boss.id] || null;
}

/**
 * BossAvatar Component
 * Renders the boss's portrait with gaming neon aura glow,
 * graceful fallback to initial letter on error,
 * and maintains locked silhouette styling when isLocked is true.
 */
export default function BossAvatar({
  boss,
  className = 'w-12 h-12 hud-panel-sm',
  style = {},
  isLocked = false,
  glow = true,
  glowColor: customGlow,
  alt,
}) {
  const [imgError, setImgError] = useState(false);

  if (!boss) return null;

  const avatarUrl = getBossAvatarUrl(boss);
  const initial = boss.name?.charAt(0) || '?';
  const glowColor = customGlow || CATEGORY_GLOWS[boss.category] || boss.avatar_color || '#6366F1';

  if (isLocked) {
    return (
      <div
        className={`${className} flex items-center justify-center font-black text-white shrink-0 locked-silhouette relative overflow-hidden select-none`}
        style={{
          background: 'radial-gradient(circle at 50% 40%, #1C1C24 0%, #0E0E12 70%, #070709 100%)',
          boxShadow: 'none',
          ...style,
        }}
      >
        <div className="flex flex-col items-center justify-center gap-1 opacity-50">
          <span className="text-4xl sm:text-5xl text-[#4A4A58] font-black">?</span>
          <span className="text-[9px] uppercase tracking-[0.2em] font-black font-display text-[#3A3A44]">
            LOCKED
          </span>
        </div>
      </div>
    );
  }

  const hasImage = avatarUrl && !imgError;
  const shouldGlow = glow && !isLocked;

  return (
    <div
      className={`${className} flex items-center justify-center font-black text-white shrink-0 overflow-hidden relative transition-all duration-300 ${
        shouldGlow ? 'animate-avatar-glow' : ''
      }`}
      style={{
        '--avatar-glow': `${glowColor}60`,
        '--avatar-border': glowColor,
        background: hasImage
          ? '#0B0B0E'
          : `linear-gradient(135deg, ${boss.avatar_color || '#4F46E5'}, ${boss.avatar_color || '#7C3AED'}99)`,
        border: shouldGlow ? `1.5px solid ${glowColor}` : '1px solid #2A2A32',
        boxShadow: shouldGlow
          ? `0 0 14px ${glowColor}80, 0 0 28px ${glowColor}35, inset 0 0 10px ${glowColor}25`
          : undefined,
        ...style,
        // Ensure glowing border and boxShadow are prioritized if shouldGlow is true
        ...(shouldGlow ? {
          border: `1.5px solid ${glowColor}`,
          boxShadow: `0 0 14px ${glowColor}80, 0 0 28px ${glowColor}35, inset 0 0 10px ${glowColor}25`,
        } : {}),
      }}
    >
      {hasImage ? (
        <img
          src={avatarUrl}
          alt={alt || boss.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <span className="select-none">{initial}</span>
      )}

      {/* High-Tech Gaming Glass Sheen Overlay */}
      {shouldGlow && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%)',
          }}
        />
      )}
    </div>
  );
}
