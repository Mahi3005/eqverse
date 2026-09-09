/**
 * EQverse - Auth Screen (Arena Gate)
 * Authentic AAA Fighting-Game / Esports Login Screen
 *
 * Features:
 * - 3D floating EQVERSE franchise crest with volumetric drop shadow
 * - Full 6-character combatant roster showcase flanking the login terminal
 * - Angular cut-corner HUD panels, category neon rim auras, and difficulty badges
 * - Holographic radar grid, ambient cosmic embers, and neural telemetry diagnostics
 */

import { useState } from 'react';
import { registerUser, loginUser } from '../services/api';
import EqverseLogo from './EqverseLogo';

const COMBAT_PERSONAS = [
  {
    id: 'kabir',
    name: 'Kabir',
    category: 'family',
    categoryLabel: 'FAMILY',
    archetype: 'Volatile Younger Sibling',
    tagline: '"Thanks for treating me like I don\'t exist."',
    trait: '#EmotionalSpiraling',
    difficulty: 2,
    diffLabel: 'MEDIUM',
    color: '#EF4444',
    avatar: '/avatars/kabir.png',
    fullbody: '/avatars/fullbody/kabir.png',
    sector: 'left',
    isForeground: false,
  },
  {
    id: 'riya',
    name: 'Riya',
    category: 'workplace',
    categoryLabel: 'WORKPLACE',
    archetype: 'Passive-Aggressive Colleague',
    tagline: '"I thought someone else was handling that..."',
    trait: '#SarcasmDefense',
    difficulty: 1,
    diffLabel: 'EASY',
    color: '#F59E0B',
    avatar: '/avatars/riya.png',
    fullbody: '/avatars/fullbody/riya.png',
    sector: 'left',
    isForeground: true,
  },
  {
    id: 'sam',
    name: 'Sam',
    category: 'romantic',
    categoryLabel: 'ROMANTIC',
    archetype: 'Guilt-Tripping Partner',
    tagline: '"You\'d know if you actually prioritized us."',
    trait: '#GuiltTripping',
    difficulty: 2,
    diffLabel: 'MEDIUM',
    color: '#F43F5E',
    avatar: '/avatars/sam.png',
    fullbody: '/avatars/fullbody/sam.png',
    sector: 'right',
    isForeground: true,
  },
  {
    id: 'meera',
    name: 'Meera',
    category: 'friendship',
    categoryLabel: 'FRIENDSHIP',
    archetype: 'Anxious Overthinker',
    tagline: '"I know they hated me. I blew this entire thing..."',
    trait: '#Catastrophizing',
    difficulty: 2,
    diffLabel: 'MEDIUM',
    color: '#D946EF',
    avatar: '/avatars/meera.png',
    fullbody: '/avatars/fullbody/meera.png',
    sector: 'right',
    isForeground: false,
  },
];

export default function AuthScreen({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredPersona, setHoveredPersona] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await loginUser(formData.email, formData.password);
      } else {
        data = await registerUser(formData.username, formData.email, formData.password);
      }
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setFormData({ username: 'Dhruv@test', email: 'dhruv123@gmail.com', password: 'password123' });
    setError('');
    setLoading(true);
    try {
      const data = await loginUser('dhruv123@gmail.com', 'password123');
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const leftPersonas = COMBAT_PERSONAS.filter((p) => p.sector === 'left');
  const rightPersonas = COMBAT_PERSONAS.filter((p) => p.sector === 'right');

  // Helper to render fighting game standing lineup
  const renderCharacterLineup = (personas) => {
    return (
      <div className="flex flex-col h-full justify-end select-none relative">
        {/* 2-Character Lineup Flank with generous spacing */}
        <div className="relative flex items-end justify-center gap-8 sm:gap-10 lg:gap-10 xl:gap-14 2xl:gap-16 w-full h-[520px] xl:h-[580px] 2xl:h-[640px] mt-auto">
          {personas.map((persona) => {
            const isFront = persona.isForeground;
            const isHovered = hoveredPersona === persona.id;

            return (
              <div
                key={persona.id}
                onMouseEnter={() => setHoveredPersona(persona.id)}
                onMouseLeave={() => setHoveredPersona(null)}
                className={`relative flex flex-col items-center justify-end h-full cursor-pointer transition-all duration-300 ${
                  isHovered ? 'z-30' : isFront ? 'z-20' : 'z-10'
                }`}
                style={{
                  width: isFront ? '210px' : '190px',
                  transform: isHovered
                    ? `translateY(-10px) scale(${isFront ? 1.08 : 1.02})`
                    : `translateY(0) scale(${isFront ? 1.04 : 0.95})`,
                }}
              >
                {/* Floating Holographic Tooltip on Hover (Positioned safely above head) */}
                <div
                  className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 z-40 transition-all duration-300 pointer-events-none ${
                    isHovered
                      ? 'opacity-100 translate-y-0 scale-100'
                      : 'opacity-0 translate-y-3 scale-95'
                  }`}
                >
                  <div
                    className="p-3 bg-[#0B0B10]/95 backdrop-blur-md border rounded-xs shadow-2xl relative"
                    style={{
                      borderColor: persona.color,
                      boxShadow: `0 0 25px -4px ${persona.color}60, inset 0 0 15px -3px ${persona.color}20`,
                      clipPath:
                        'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                    }}
                  >
                    {/* Top neon indicator */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{
                        backgroundColor: persona.color,
                        boxShadow: `0 0 8px ${persona.color}`,
                      }}
                    />

                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="font-black text-xs text-white font-display uppercase tracking-wider">
                        {persona.name}
                      </h4>
                      <span
                        className="text-[8px] font-black font-display px-1.5 py-0.2 uppercase tracking-wider"
                        style={{
                          color: persona.color,
                          backgroundColor: `${persona.color}18`,
                          border: `1px solid ${persona.color}40`,
                        }}
                      >
                        {persona.categoryLabel}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#A0A0AA] font-display font-medium leading-tight mb-1.5">
                      {persona.archetype}
                    </p>

                    <p
                      className="text-[9.5px] font-mono text-[#D4D4D8] italic leading-snug mb-2 bg-[#121218] p-1.5 rounded-xs border-l-2"
                      style={{ borderLeftColor: persona.color }}
                    >
                      {persona.tagline}
                    </p>

                    <div className="flex items-center justify-between text-[9px] pt-1 border-t border-[#22222A]">
                      <span className="font-mono text-[#71717A]">{persona.trait}</span>
                      <span className="font-bold tracking-widest" style={{ color: persona.color }}>
                        {'★'.repeat(persona.difficulty)}
                        <span className="text-[#2A2A35]">
                          {'★'.repeat(Math.max(0, 3 - persona.difficulty))}
                        </span>
                      </span>
                    </div>

                    {/* Bottom arrow */}
                    <div
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0B0B10] border-r border-b rotate-45"
                      style={{ borderColor: persona.color }}
                    />
                  </div>
                </div>

                {/* Ground Shadow Ellipse */}
                <div
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-[100%] pointer-events-none bg-black/75 blur-[6px]"
                  style={{
                    width: isFront ? '150px' : '130px',
                    height: '14px',
                  }}
                />

                {/* Colored Ground Spotlight Glow */}
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-[100%] pointer-events-none transition-all duration-500 blur-[8px]"
                  style={{
                    width: isFront ? (isHovered ? '220px' : '190px') : (isHovered ? '180px' : '150px'),
                    height: '26px',
                    background: `radial-gradient(ellipse at center, ${persona.color}${isHovered ? '95' : '45'} 0%, ${persona.color}15 45%, transparent 75%)`,
                    boxShadow: isHovered
                      ? `0 0 25px 4px ${persona.color}60, 0 0 50px 8px ${persona.color}25`
                      : `0 0 14px 2px ${persona.color}25`,
                  }}
                />

                {/* Full Body Character Cutout Image */}
                <img
                  src={persona.fullbody}
                  alt={persona.name}
                  className="h-full w-auto max-w-none object-contain object-bottom pointer-events-auto transition-all duration-300 filter"
                  style={{
                    filter: isHovered
                      ? `brightness(1.18) drop-shadow(0 0 20px ${persona.color}95) drop-shadow(0 0 40px ${persona.color}45)`
                      : isFront
                      ? `brightness(1.02) drop-shadow(0 0 12px ${persona.color}35)`
                      : `brightness(0.92) drop-shadow(0 0 8px ${persona.color}20)`,
                  }}
                  loading="eager"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper to render a character combat card for mobile fallback
  const renderPersonaCard = (persona) => {
    const isHovered = hoveredPersona === persona.id;
    return (
      <div
        key={persona.id}
        onMouseEnter={() => setHoveredPersona(persona.id)}
        onMouseLeave={() => setHoveredPersona(null)}
        className="group relative overflow-hidden transition-all duration-300 cursor-pointer select-none"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        }}
      >
        <div
          className="p-3 bg-[#111116] border transition-all duration-300 flex items-center gap-3 relative overflow-hidden"
          style={{
            borderColor: isHovered ? persona.color : `${persona.color}35`,
            boxShadow: isHovered
              ? `0 0 20px -2px ${persona.color}60, inset 0 0 15px -3px ${persona.color}25`
              : `0 4px 14px rgba(0,0,0,0.6)`,
            transform: isHovered ? 'translateY(-2px)' : 'none',
          }}
        >
          {/* Left Category Accent Strip */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300"
            style={{
              backgroundColor: persona.color,
              boxShadow: isHovered ? `0 0 10px ${persona.color}` : 'none',
            }}
          />

          {/* Persona Avatar Portrait with Gaming Glow */}
          <div
            className="w-14 h-14 shrink-0 rounded-sm overflow-hidden relative border transition-transform duration-300 group-hover:scale-105"
            style={{
              borderColor: persona.color,
              boxShadow: isHovered ? `0 0 14px ${persona.color}80` : `0 0 8px ${persona.color}40`,
            }}
          >
            <img
              src={persona.avatar}
              alt={persona.name}
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
            {/* Gloss sheen overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%)',
              }}
            />
          </div>

          {/* Persona Meta Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <h4 className="font-black text-sm text-white font-display uppercase tracking-wide truncate group-hover:text-white transition-colors">
                {persona.name}
              </h4>
              <span
                className="text-[8px] font-black font-display px-1.5 py-0.2 uppercase tracking-wider shrink-0"
                style={{
                  color: persona.color,
                  backgroundColor: `${persona.color}15`,
                  border: `1px solid ${persona.color}40`,
                }}
              >
                {persona.categoryLabel}
              </span>
            </div>

            <p className="text-[10px] text-[#A0A0AA] font-display font-medium truncate leading-tight">
              {persona.archetype}
            </p>

            {/* Quote / Tagline or Trait Badge */}
            <div className="flex items-center justify-between gap-1 mt-1 text-[9px]">
              <span className="font-mono text-[#6E6E78] truncate italic">
                {persona.tagline}
              </span>
              <span className="font-bold shrink-0" style={{ color: persona.color }}>
                {'★'.repeat(persona.difficulty)}
                <span className="text-[#2A2A35]">{'★'.repeat(Math.max(0, 3 - persona.difficulty))}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-6 arena-bg relative overflow-x-hidden select-none">
      {/* ── Background Cyber Radar Matrix ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.2) 0%, transparent 70%), linear-gradient(rgba(34, 211, 238, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.04) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 48px 48px, 48px 48px',
        }}
      />

      {/* ── Ambient Corner Light Blooms ── */}
      <div className="absolute top-0 left-10 w-96 h-96 bg-[#6366F1]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-10 w-96 h-96 bg-[#DC2626]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-[#22D3EE]/8 rounded-full blur-[140px] pointer-events-none" />

      {/* ── Top Header Brand & Telemetry ── */}
      <header className="relative z-10 flex flex-col items-center justify-center text-center mb-4">
        {/* Floating 3D Franchise Emblem */}
        <EqverseLogo
          layout="vertical"
          size="lg"
          showSubtitle={false}
          className="transform hover:scale-105 transition-transform duration-500"
        />

        {/* Live Simulation Status Banner */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 mt-3 bg-[#0B0B10]/80 border border-[#22D3EE]/30 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.2)]">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="font-mono text-[10px] text-[#22D3EE] tracking-[0.25em] font-bold uppercase">
            ACTIVE ARENA GATE • 4 COMBATANTS ONLINE
          </span>
        </div>
      </header>

      {/* ── Main Arena Gate Grid (Fighting Game Flanking Lineups) ── */}
      <div className="w-full max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-6 items-end relative z-10 flex-1 my-auto">

        {/* ═══ LEFT ROSTER FLANK (2 Standing Combatants) ═══ */}
        <div className="hidden lg:flex lg:col-span-3 xl:col-span-4 flex-col justify-end h-full">
          {renderCharacterLineup(leftPersonas)}
        </div>

        {/* ═══ CENTER: AUTH ACCESS TERMINAL (Elevated upside towards logo) ═══ */}
        <div className="col-span-1 lg:col-span-6 xl:col-span-4 flex justify-center items-center self-center -translate-y-6 lg:-translate-y-12 xl:-translate-y-18">
          <div className="w-full max-w-md relative">
            {/* Terminal Top Laser Beam */}
            <div
              className="h-[2px] w-full rounded-t relative overflow-hidden"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, #22D3EE 30%, #FFFFFF 50%, #7C3AED 70%, transparent 100%)',
                boxShadow: '0 0 12px #22D3EE, 0 0 24px #7C3AED',
              }}
            />

            {/* Terminal Main Panel */}
            <div
              className="hud-panel p-6 sm:p-8 relative overflow-hidden border border-[#2A2A35]"
              style={{
                background: 'linear-gradient(180deg, #14141A 0%, #0B0B0E 100%)',
                boxShadow:
                  '0 15px 40px -10px rgba(0, 0, 0, 0.9), 0 0 25px -5px rgba(34, 211, 238, 0.15)',
              }}
            >
              {/* Corner Cyber Accents */}
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#22D3EE] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#7C3AED] pointer-events-none" />

              {/* Mode Tabs (Sign In / Register) */}
              <div className="flex gap-1.5 mb-6 bg-[#08080B] p-1.5 border border-[#2A2A32] rounded-sm">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className={`flex-1 py-2.5 text-xs font-black font-display uppercase tracking-[0.18em] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    isLogin
                      ? 'bg-[#1C1C26] text-white border border-[#22D3EE]/50 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                      : 'text-[#5A5A68] hover:text-[#8E8E98] border border-transparent'
                  }`}
                >
                  <span>⚔</span>
                  <span>SIGN IN</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className={`flex-1 py-2.5 text-xs font-black font-display uppercase tracking-[0.18em] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    !isLogin
                      ? 'bg-[#1C1C26] text-white border border-[#7C3AED]/50 shadow-[0_0_12px_rgba(124,58,237,0.25)]'
                      : 'text-[#5A5A68] hover:text-[#8E8E98] border border-transparent'
                  }`}
                >
                  <span>🛡</span>
                  <span>REGISTER</span>
                </button>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-5 p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs animate-slide-up flex items-center gap-2 font-medium">
                  <span>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="animate-slide-up">
                    <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#8E8E98] mb-1.5 font-display flex items-center justify-between">
                      <span>CALLSIGN / OPERATIVE NAME</span>
                      <span className="text-[#22D3EE] font-mono text-[9px]">[REQ]</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g. TacticianAlex"
                      required={!isLogin}
                      className="w-full px-4 py-3 bg-[#08080B] border border-[#2A2A35] text-white text-sm
                                 placeholder-[#3A3A48] focus:outline-none focus:border-[#22D3EE] focus:ring-1
                                 focus:ring-[#22D3EE] focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#8E8E98] mb-1.5 font-display flex items-center justify-between">
                    <span>SECURITY CREDENTIAL / EMAIL</span>
                    <span className="text-[#22D3EE] font-mono text-[9px]">[LOGIN ID]</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@domain.com"
                    required
                    className="w-full px-4 py-3 bg-[#08080B] border border-[#2A2A35] text-white text-sm
                               placeholder-[#3A3A48] focus:outline-none focus:border-[#22D3EE] focus:ring-1
                               focus:ring-[#22D3EE] focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#8E8E98] mb-1.5 font-display flex items-center justify-between">
                    <span>ACCESS CIPHER / PASSWORD</span>
                    <span className="text-[#6E6E78] font-mono text-[9px]">ENCRYPTED</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-[#08080B] border border-[#2A2A35] text-white text-sm
                               placeholder-[#3A3A48] focus:outline-none focus:border-[#22D3EE] focus:ring-1
                               focus:ring-[#22D3EE] focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all font-mono"
                  />
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-gradient w-full py-3.5 font-black text-xs sm:text-sm text-white cursor-pointer
                             disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2 font-display tracking-[0.18em] uppercase
                             hover:shadow-[0_0_25px_rgba(99,102,241,0.6),0_0_40px_rgba(34,211,238,0.35)]"
                  style={{
                    boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.4), 0 0 25px rgba(34, 211, 238, 0.25)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{isLogin ? 'VERIFYING CREDENTIALS...' : 'REGISTERING COMBATANT...'}</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>{isLogin ? '⚔ ENTER THE ARENA' : '🚀 INITIALIZE COMBAT ACCOUNT'}</span>
                      <span className="text-sm font-black text-[#22D3EE]">↵</span>
                    </span>
                  )}
                </button>
              </form>

              {/* Quick Demo Login Pill */}
              <div className="mt-5 pt-4 border-t border-[#2A2A35] flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0B0B10] border border-[#22D3EE]/30 hover:border-[#22D3EE] text-xs font-bold text-[#8E8E98] hover:text-white transition-all cursor-pointer group rounded-sm"
                  title="One-click test account"
                >
                  <span className="text-[#22D3EE] group-hover:animate-ping">⚡</span>
                  <span className="font-display tracking-wider">QUICK DEMO:</span>
                  <span className="stat-value text-[#22D3EE] underline">dhruv123@gmail.com</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT ROSTER FLANK (2 Standing Combatants) ═══ */}
        <div className="hidden lg:flex lg:col-span-3 xl:col-span-4 flex-col justify-end h-full">
          {renderCharacterLineup(rightPersonas)}
        </div>
      </div>

      {/* ── Mobile/Tablet Combatants Showcase (< lg screens) ── */}
      <div className="lg:hidden mt-8 w-full max-w-md mx-auto space-y-3 relative z-10">
        <div className="flex items-center justify-between pb-1 border-b border-[#2A2A32]">
          <span className="font-display font-black text-xs text-[#8E8E98] uppercase tracking-[0.2em] flex items-center gap-1.5">
            <span>⚔</span>
            <span>CHALLENGER ROSTER (4 AI COMBATANTS)</span>
          </span>
          <span className="text-[9px] font-mono text-[#22D3EE]">READY</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {COMBAT_PERSONAS.map(renderPersonaCard)}
        </div>
      </div>

      {/* ── Footer Telemetry Bar ── */}
      <footer className="relative z-10 text-center mt-6 pt-4 border-t border-[#1C1C24] flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#4A4A58] font-display uppercase tracking-[0.2em] max-w-[1400px] mx-auto w-full">
        <span>EQVERSE SIMULATION CORE • V2.4</span>
        <span className="text-[#6E6E78] my-1 sm:my-0">TRAIN EMOTIONAL INTELLIGENCE UNDER HIGH-STAKES CONFLICT</span>
        <span className="text-[#22D3EE] font-mono">ENCRYPTION: AES-256</span>
      </footer>
    </div>
  );
}
