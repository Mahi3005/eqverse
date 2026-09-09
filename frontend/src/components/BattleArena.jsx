/**
 * EQverse - Battle Arena (Visual Novel Dialogue + Fighting-Game HUD)
 *
 * Layout:
 * 1. LEFT: Persona Intel HUD (angular panel, trait chips, defense/trust meters)
 * 2. CENTER: Visual Novel Conversation Arena (anchored portrait, dialogue box, choice chips)
 * 3. RIGHT: Live Tension Gauge + Tactical Coach (segmented HUD meter, coach companion)
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { sendBattleMessage, evaluateBattle } from '../services/api';
import TensionMeter from './TensionMeter';
import BossAvatar from './BossAvatar';

const CATEGORY_COLORS = {
  workplace:  '#F59E0B',
  family:     '#16A34A',
  friendship: '#D946EF',
  romantic:   '#DC2626',
};

// Persona metadata
const PERSONA_CONFIG = {
  riya: {
    openingLine: "Oh, is this about the analytics report again? Because honestly, I was under the impression that was Dave's responsibility.",
    traits: ['Passive-Aggressive', 'Sarcastic Blame', 'Defensive Smile', 'Blame Deflection'],
    quickActions: [
      { label: '🤝 Validate', text: 'I understand you feel blindsided by this, but I want to collaborate so we can deliver on time.' },
      { label: '❓ Clarify', text: 'Could you help me understand where the handoff broke down so we can fix it together?' },
      { label: '🛡 Boundary', text: 'We agreed the analytics were assigned to you, and the team needs them finalized today.' },
    ],
  },
  kabir: {
    openingLine: "Thanks for always treating me like I don't exist. Real nice. Why am I always the last one to know anything in this family?",
    traits: ['High Reactivity', 'Feels Unheard', 'Past Grievances', 'Dramatic Jabs'],
    quickActions: [
      { label: '👂 Listen', text: 'You are right that leaving you out hurts, and I am genuinely sorry for not checking in sooner.' },
      { label: '❤ Reassure', text: 'I value our relationship deeply and it was an honest mistake, not intentional exclusion.' },
      { label: '🗓 Plan', text: "Let's grab lunch together tomorrow just the two of us, so we can talk this through properly." },
    ],
  },
  meera: {
    openingLine: "I know they hated me. I've been overthinking every single answer I gave, and I just know I blew this entire opportunity...",
    traits: ['Catastrophizing', 'Constantly Spiraling', 'Seeks Reassurance', 'Imposter Panic'],
    quickActions: [
      { label: '🧘 Ground', text: 'It has only been 18 hours since the interview. Waiting is hard, but silence does not mean rejection.' },
      { label: '💡 Reflect', text: 'Remember all the thorough preparation you did—you gave them your absolute best.' },
      { label: '🕊 Anchor', text: "Take a deep breath with me. Let's focus only on what you can control right now." },
    ],
  },
  sam: {
    openingLine: "I guess three unread texts in six hours means I'm pretty low on your priority list, right? I won't bother you anymore.",
    traits: ['Anxious Attachment', 'Guilt-Tripping', 'Fears Abandonment', 'Passive Distance'],
    quickActions: [
      { label: '💖 Reassure', text: 'I was in non-stop meetings today, but you are very important to me and I care about you.' },
      { label: '🛡 Boundary', text: 'I love talking with you, but when I am working I cannot always respond immediately.' },
      { label: '🤝 Connect', text: "I am completely free now—let's talk through our day together." },
    ],
  },
  alex: {
    openingLine: "There's nothing to discuss. I'm completely fine, drop it.",
    traits: ['Emotional Stonewalling', 'Guarded Armor', 'Avoids Vulnerability', 'Cold Retreat'],
    quickActions: [
      { label: '🕊 Safety', text: 'I am not here to pressure or criticize you. I just want to hear how you are truly feeling.' },
      { label: '⏱ Space', text: 'If right now is too tense, I respect that. Can we check in after an hour when you feel ready?' },
      { label: '💬 Inquire', text: 'Take your time. Whenever you are ready to share, I am right here to listen without judgment.' },
    ],
  },
  mr_sharma: {
    openingLine: "I don't need excuses, I need results. In my 25 years at this firm, missed targets were never tolerated.",
    traits: ['Authoritarian', 'Ego-Defensive', 'Status Guarded', 'Low Patience'],
    quickActions: [
      { label: '🎯 Acknowledge', text: 'I completely respect the high standards you set for this team, and accountability matters.' },
      { label: '📊 Solution', text: 'Here is the revised action plan and timeline to recover the delay by tomorrow afternoon.' },
      { label: '🛡 Assert', text: 'I accept responsibility for the gap, and I need your sign-off on this revised schedule.' },
    ],
  },
};

function detectSkillUsed(text) {
  const lower = text.toLowerCase();
  if (lower.includes('hear') || lower.includes('listen') || lower.includes('understand') || lower.includes('perspective'))
    return { name: 'Active Listening', emoji: '👂', color: '#06B6D4' };
  if (lower.includes('feel') || lower.includes('frustrat') || lower.includes('sorry') || lower.includes('hurt'))
    return { name: 'Emotional Validation', emoji: '💖', color: '#EC4899' };
  if (lower.includes('boundary') || lower.includes('need') || lower.includes('timeline') || lower.includes('expect'))
    return { name: 'Boundary Setting', emoji: '🛡', color: '#6366F1' };
  if (lower.includes('what') || lower.includes('how') || lower.includes('could') || lower.includes('clarify'))
    return { name: 'Tactful Inquiry', emoji: '❓', color: '#7C3AED' };
  return { name: 'Calm De-escalation', emoji: '🕊', color: '#22C55E' };
}

// Outcome banner config
function getOutcomeBanner(outcomeVal) {
  switch (outcomeVal) {
    case 'RESOLVED':
      return {
        title: '🏆 VICTORY',
        subtitle: 'Conflict successfully de-escalated. Generating EQ report...',
        gradient: 'from-[#22C55E]/15 to-[#06B6D4]/10',
        border: 'border-[#22C55E]/40',
        textColor: 'text-[#22C55E]',
      };
    case 'ESCALATED':
      return {
        title: '💥 DEFEAT',
        subtitle: 'Conflict escalated beyond recovery. Analyzing what went wrong...',
        gradient: 'from-[#EF4444]/15 to-[#F43F5E]/10',
        border: 'border-[#EF4444]/40',
        textColor: 'text-[#EF4444]',
      };
    case 'TIMEOUT':
      return {
        title: '⏱ TIME UP',
        subtitle: 'Turns exhausted. Evaluating your overall performance...',
        gradient: 'from-[#F59E0B]/15 to-[#F97316]/10',
        border: 'border-[#F59E0B]/40',
        textColor: 'text-[#F59E0B]',
      };
    default:
      return {
        title: '⚡ BATTLE OVER',
        subtitle: 'Compiling your EQ report card...',
        gradient: 'from-[#6366F1]/15 to-[#7C3AED]/10',
        border: 'border-[#6366F1]/40',
        textColor: 'text-[#6366F1]',
      };
  }
}

export default function BattleArena({ battleData, onBattleEnd, onForfeit }) {
  const { session, boss, tension: initialTension } = battleData;
  const personaMeta = PERSONA_CONFIG[boss.id] || PERSONA_CONFIG.riya;
  const catColor = CATEGORY_COLORS[boss.category] || '#6366F1';
  const bossAvatar = boss.avatar_img || (boss.id === 'riya' ? '/avatars/riya.png' : null);

  const [messages, setMessages] = useState([
    {
      id: 'opening-1',
      sender: 'BOSS',
      message_text: personaMeta.openingLine,
      tension_delta: 0,
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [tension, setTension] = useState(initialTension);
  const [turns, setTurns] = useState({ current: 0, max: session.max_turns || 10 });
  const [outcome, setOutcome] = useState('IN_PROGRESS');
  const [isTyping, setIsTyping] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [showDossier, setShowDossier] = useState(false);
  const [floatingXp, setFloatingXp] = useState(null);
  const [streak, setStreak] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Dynamic emotional atmosphere
  const emotionAura = useMemo(() => {
    const val = tension.value;
    if (val >= 80) return {
      bgAura: `radial-gradient(ellipse at 50% 10%, rgba(239, 68, 68, 0.12) 0%, transparent 60%)`,
      glowRing: 'ring-1 ring-[#EF4444] shadow-md shadow-[#EF4444]/30',
      moodLabel: '🔥 COMBATIVE', moodColor: '#EF4444',
      moodDesc: 'Extremely defensive. Every perceived attack triggers severe pushback.',
    };
    if (val >= 60) return {
      bgAura: `radial-gradient(ellipse at 50% 10%, rgba(245, 158, 11, 0.10) 0%, transparent 55%)`,
      glowRing: 'ring-1 ring-[#F59E0B] shadow-md shadow-[#F59E0B]/20',
      moodLabel: '⚠ GUARDED', moodColor: '#F59E0B',
      moodDesc: 'Deploying sarcasm and deflection to guard vulnerabilities.',
    };
    if (val >= 35) return {
      bgAura: `radial-gradient(ellipse at 50% 10%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)`,
      glowRing: 'ring-1 ring-[#6366F1] shadow-md shadow-[#6366F1]/20',
      moodLabel: '⚡ TESTING', moodColor: '#6366F1',
      moodDesc: 'Evaluating your intent. Open to genuine, calm dialogue.',
    };
    return {
      bgAura: `radial-gradient(ellipse at 50% 10%, rgba(6, 182, 212, 0.10) 0%, transparent 55%)`,
      glowRing: 'ring-1 ring-[#06B6D4] shadow-md shadow-[#06B6D4]/25',
      moodLabel: '🕊 RECEPTIVE', moodColor: '#06B6D4',
      moodDesc: 'Guards are lowered. Acknowledging collaboration and mutual respect.',
    };
  }, [tension.value]);

  const defensivenessLevel = Math.min(100, Math.max(0, tension.value));
  const trustLevel = Math.min(100, Math.max(0, 100 - tension.value));

  const tacticalHint = useMemo(() => {
    const val = tension.value;
    if (val >= 75) return {
      focus: 'EMERGENCY DE-ESCALATION',
      tip: 'Validate their emotional state first to disarm fight-or-flight.',
      mistakeAlert: 'Avoid "You are overreacting" or "Calm down".',
      opener: 'I can see how deeply frustrating this is for you, and I am not here to fight.',
    };
    if (val >= 50) return {
      focus: 'ACTIVE LISTENING',
      tip: 'Ask open-ended "What" or "How" questions. Let them talk.',
      mistakeAlert: 'Avoid accusatory "You always..." statements.',
      opener: 'Help me understand how you saw this unfolding so we are fully aligned.',
    };
    return {
      focus: 'COLLABORATIVE CLOSURE',
      tip: 'Maintain safe space and propose win-win resolution with clear boundaries.',
      mistakeAlert: 'Do not reopen past grievances now that trust is restored.',
      opener: "Let's lock in a clear path forward together so this never burdens either of us again.",
    };
  }, [tension.value]);

  const handleSendMessage = async (textToSend) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputValue).trim();
    if (!text || sending || outcome !== 'IN_PROGRESS') return;

    const detectedSkill = detectSkillUsed(text);

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      message_text: text,
      skill: detectedSkill,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setSending(true);
    setIsTyping(true);

    try {
      const response = await sendBattleMessage(session.id, text);
      await new Promise((resolve) => setTimeout(resolve, 650));
      setIsTyping(false);

      const deltaVal = response.tension.delta || 0;

      if (deltaVal < 0) {
        const bonusXp = Math.abs(deltaVal) * 5 + 10;
        setFloatingXp(`+${bonusXp} XP`);
        setStreak((prev) => prev + 1);
        setTimeout(() => setFloatingXp(null), 2500);
      } else if (deltaVal > 5) {
        setStreak(0);
      }

      const bossMsg = {
        id: `boss-${Date.now() + 1}`,
        sender: 'BOSS',
        message_text: response.boss_reply,
        tension_delta: deltaVal,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, bossMsg]);
      setTension(response.tension);
      setTurns(response.turns);
      setOutcome(response.outcome);

      if (response.outcome !== 'IN_PROGRESS') {
        handleBattleEnded(response.outcome);
      }
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now() + 1}`,
          sender: 'SYSTEM',
          message_text: err.message || 'Connection lost. Please check backend.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleBattleEnded = async (battleOutcome) => {
    setEvaluating(true);
    try {
      const evalData = await evaluateBattle(session.id);
      onBattleEnd({
        outcome: battleOutcome,
        evaluation: evalData.evaluation,
        boss: boss,
        userXp: evalData.user_xp,
        messages: messages,
      });
    } catch (err) {
      console.error('Evaluation failed:', err);
      onBattleEnd({
        outcome: battleOutcome,
        evaluation: null,
        boss: boss,
        messages: messages,
      });
    } finally {
      setEvaluating(false);
    }
  };

  const handleUseSuggestedOpener = (text) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  return (
    <div
      className="w-full flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col h-[calc(100vh-60px)] transition-all duration-700 relative"
      style={{ backgroundImage: emotionAura.bgAura }}
    >
      {/* ── Floating XP Badge ── */}
      {floatingXp && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-none">
          <div className="px-4 py-2 bg-gradient-to-r from-[#F59E0B] to-[#22C55E] text-black font-black font-mono text-sm shadow-2xl shadow-[#F59E0B]/40 flex items-center gap-2">
            <span>⚡</span>
            <span>{floatingXp} De-escalation Bonus!</span>
          </div>
        </div>
      )}

      {/* ── 3-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">

        {/* ═══ 1. LEFT: PERSONA INTEL HUD ═══ */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-3 overflow-y-auto pr-1">
          <div className="hud-panel p-5 flex flex-col gap-4 relative overflow-hidden">

            {/* Identity Row */}
            <div className="flex items-center gap-3">
              <BossAvatar
                boss={boss}
                className={`w-14 h-14 hud-panel-sm text-xl transition-all duration-500 ${emotionAura.glowRing}`}
                glow={true}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black font-display text-white uppercase tracking-wide truncate">
                    {boss.name}
                  </h2>
                  <span className="text-[9px] font-black font-display px-1.5 py-0.5 uppercase tracking-[0.1em]"
                        style={{ color: catColor, backgroundColor: `${catColor}15`, border: `1px solid ${catColor}30` }}>
                    {boss.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-[#F59E0B] text-xs">
                  {'★'.repeat(boss.difficulty_stars)}
                  <span className="text-[#1C1C22]">{'★'.repeat(Math.max(0, 3 - boss.difficulty_stars))}</span>
                  <span className="text-[#3A3A44] ml-1 text-[10px] font-display uppercase">
                    {boss.difficulty_stars === 1 ? 'EASY' : boss.difficulty_stars === 2 ? 'MEDIUM' : 'HARD'}
                  </span>
                </div>
              </div>
            </div>

            {/* Emotional State Badge */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-[0.15em] font-black text-[#3A3A44] font-display">
                EMOTIONAL STATE
              </span>
              <div className="px-3 py-2 border flex items-center gap-2 transition-all duration-300"
                   style={{ backgroundColor: `${emotionAura.moodColor}10`, borderColor: `${emotionAura.moodColor}30`, color: emotionAura.moodColor }}>
                <span className="text-sm">{emotionAura.moodLabel.split(' ')[0]}</span>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-black font-display block uppercase tracking-wider">{emotionAura.moodLabel}</span>
                  <p className="text-[9px] opacity-70 leading-tight truncate">{emotionAura.moodDesc}</p>
                </div>
              </div>
            </div>

            {/* Trait Tags */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase tracking-[0.15em] font-black text-[#3A3A44] font-display">
                PSYCH TRAITS
              </span>
              <div className="flex flex-wrap gap-1">
                {personaMeta.traits.map((trait) => (
                  <span
                    key={trait}
                    className="text-[10px] font-bold px-2 py-0.5 bg-[#0B0B0E] border border-[#2A2A32] text-[#6E6E78]
                               hover:border-[#3A3A44] hover:text-[#A0A0AA] transition-all"
                  >
                    #{trait}
                  </span>
                ))}
              </div>
            </div>

            {/* Defense / Trust Meters */}
            <div className="space-y-2.5 pt-2 border-t border-[#2A2A32]">
              <div>
                <div className="flex items-center justify-between text-[10px] font-display mb-1">
                  <span className="text-[#6E6E78] font-bold uppercase tracking-wider">🛡 DEFENSE</span>
                  <span className="stat-value text-[#EF4444]">{defensivenessLevel}%</span>
                </div>
                <div className="hud-meter" style={{ height: '8px' }}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="hud-meter-segment"
                      style={{
                        backgroundColor: i < Math.round(defensivenessLevel / 10) ? '#EF4444' : '#1C1C22',
                        opacity: i < Math.round(defensivenessLevel / 10) ? 1 : 0.3,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] font-display mb-1">
                  <span className="text-[#6E6E78] font-bold uppercase tracking-wider">🕊 TRUST</span>
                  <span className="stat-value text-[#22C55E]">{trustLevel}%</span>
                </div>
                <div className="hud-meter" style={{ height: '8px' }}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="hud-meter-segment"
                      style={{
                        backgroundColor: i < Math.round(trustLevel / 10) ? '#22C55E' : '#1C1C22',
                        opacity: i < Math.round(trustLevel / 10) ? 1 : 0.3,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Win Condition */}
            <div className="p-3 border" style={{ backgroundColor: `${catColor}08`, borderColor: `${catColor}25` }}>
              <span className="text-[9px] uppercase font-black font-display block mb-1" style={{ color: catColor }}>
                🎯 WIN CONDITION
              </span>
              <p className="text-[11px] text-[#A0A0AA] leading-relaxed">
                {boss.goal || 'De-escalate tension below 20% before running out of turns.'}
              </p>
            </div>

            {/* Collapsible Dossier */}
            <div className="border border-[#2A2A32] bg-[#0B0B0E] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDossier(!showDossier)}
                className="w-full px-3 py-2 text-[10px] font-black font-display text-[#6E6E78] hover:text-white flex items-center justify-between cursor-pointer transition-colors uppercase tracking-wider"
              >
                <span>MISSION DOSSIER</span>
                <span className="stat-value text-[#06B6D4] text-[9px]">{showDossier ? '▲' : '▼'}</span>
              </button>
              {showDossier && (
                <div className="p-3 pt-0 text-[11px] text-[#6E6E78] leading-relaxed border-t border-[#2A2A32] animate-slide-up">
                  {boss.backstory}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ═══ 2. CENTER: CONVERSATION ARENA ═══ */}
        <section
          className="col-span-1 lg:col-span-6 flex flex-col min-h-0 hud-panel overflow-hidden relative transition-all duration-500"
          style={{
            borderColor: `${catColor}45`,
            boxShadow: `0 0 35px -8px ${catColor}25, 0 0 70px -20px ${catColor}12, inset 0 0 30px -10px ${catColor}08`,
          }}
        >
          {/* Top Neon Laser Accent Strip */}
          <div
            className="h-[2px] w-full shrink-0 relative overflow-hidden"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${catColor}80 25%, #FFFFFF 50%, ${catColor}80 75%, transparent 100%)`,
              boxShadow: `0 0 10px ${catColor}, 0 0 20px ${catColor}90`,
            }}
          />

          {/* Header Bar */}
          <div className="px-4 py-3 bg-[#141418] border-b border-[#2A2A32] flex items-center justify-between gap-3 shrink-0 relative">
            <div className="flex items-center gap-3 min-w-0">
              <BossAvatar
                boss={boss}
                className="w-9 h-9 hud-panel-sm text-xs"
                glow={true}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-white font-display uppercase tracking-wide truncate">
                    {boss.name}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full animate-pulse shrink-0"
                    style={{
                      backgroundColor: '#22C55E',
                      boxShadow: '0 0 8px #22C55E, 0 0 16px #22C55E80',
                    }}
                    title="Active Combatant"
                  />
                  <span
                    className="text-[9px] font-black font-display px-1.5 py-0.5 uppercase tracking-[0.1em] hidden sm:inline-block"
                    style={{
                      color: catColor,
                      backgroundColor: `${catColor}15`,
                      border: `1px solid ${catColor}40`,
                      boxShadow: `0 0 8px ${catColor}25`,
                    }}
                  >
                    {boss.category}
                  </span>
                </div>
                <span className="text-[10px] text-[#4A4A58] block font-display uppercase tracking-wider">
                  {turns.current === 0 ? '⚔ CONFLICT INITIATED' : '⚡ LIVE NEGOTIATION'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {streak >= 2 && (
                <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] font-mono font-bold animate-pulse"
                     style={{ color: '#F59E0B', backgroundColor: '#F59E0B12', borderColor: '#F59E0B35' }}>
                  🔥 {streak}x STREAK
                </div>
              )}

              <div className="text-right hidden sm:block">
                <span className="text-[9px] text-[#3A3A44] uppercase tracking-[0.15em] font-black font-display block">
                  TURN {turns.current}/{turns.max}
                </span>
                <div className="hud-meter mt-0.5" style={{ width: '80px', height: '6px' }}>
                  {Array.from({ length: turns.max }, (_, i) => (
                    <div key={i} className="hud-meter-segment"
                      style={{
                        backgroundColor: i < turns.current ? '#6366F1' : '#1C1C22',
                        opacity: i < turns.current ? 1 : 0.3,
                        boxShadow: i < turns.current ? '0 0 6px #6366F1' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              {outcome === 'IN_PROGRESS' && (
                <button
                  onClick={onForfeit}
                  className="px-2.5 py-1 text-[10px] text-[#3A3A44] hover:text-[#F43F5E] transition-colors cursor-pointer font-black font-display uppercase tracking-wider"
                >
                  DISENGAGE
                </button>
              )}
            </div>
          </div>

          {/* ── Chat Stream ── */}
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 min-h-0 relative"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 20%, ${catColor}08 0%, transparent 65%)`,
            }}
          >
            {messages.map((msg) => {
              if (msg.sender === 'USER') {
                return (
                  <div key={msg.id} className="flex justify-end message-user">
                    <div className="max-w-[82%] flex flex-col items-end">
                      <div
                        className="bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#7C3AED] px-4 py-3 border border-white/20 text-white text-sm"
                        style={{
                          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)',
                          boxShadow: '0 0 20px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 mr-1 text-[9px]">
                        {msg.skill && (
                          <span className="px-1.5 py-0.5 font-bold border"
                                style={{ color: msg.skill.color, backgroundColor: `${msg.skill.color}12`, borderColor: `${msg.skill.color}30` }}>
                            {msg.skill.emoji} {msg.skill.name}
                          </span>
                        )}
                        <span className="text-[#3A3A44]">{msg.timestamp || 'You'}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.sender === 'BOSS') {
                const deltaVal = msg.tension_delta || 0;
                const isGood = deltaVal < 0;
                return (
                  <div key={msg.id} className="flex justify-start message-boss">
                    <div className="flex items-start gap-2.5 max-w-[88%] sm:max-w-[84%]">
                      <BossAvatar
                        boss={boss}
                        className="w-8 h-8 hud-panel-sm text-xs mt-0.5 shrink-0"
                        glow={true}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: catColor, boxShadow: `0 0 6px ${catColor}` }}
                          />
                          <span
                            className="text-[11px] font-black font-display text-white uppercase tracking-wider"
                            style={{ textShadow: `0 0 10px ${catColor}50` }}
                          >
                            {boss.name}
                          </span>
                          <span
                            className="text-[8px] font-black font-display uppercase px-1.5 py-0.2 border"
                            style={{
                              color: catColor,
                              borderColor: `${catColor}40`,
                              backgroundColor: `${catColor}12`,
                              boxShadow: `0 0 6px ${catColor}20`,
                            }}
                          >
                            OPPONENT
                          </span>
                          <span className="text-[9px] text-[#4A4A58] ml-auto font-mono">
                            {msg.timestamp || 'Just now'}
                          </span>
                        </div>

                        {/* Gaming Visual-Novel Dialogue Bubble with Glow */}
                        <div
                          className="px-4 py-3 text-sm text-[#F0F0F6] leading-relaxed relative transition-all duration-300"
                          style={{
                            background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.96) 0%, rgba(11, 11, 15, 0.98) 100%)',
                            border: `1px solid ${catColor}45`,
                            borderLeft: `3.5px solid ${catColor}`,
                            boxShadow: `0 4px 24px -4px ${catColor}30, 0 0 18px ${catColor}18, inset 0 0 25px ${catColor}08`,
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                          }}
                        >
                          {/* Laser Accent Corner Indicator */}
                          <div
                            className="absolute top-0 right-0 w-2.5 h-2.5 pointer-events-none"
                            style={{
                              borderTop: `2px solid ${catColor}`,
                              borderRight: `2px solid ${catColor}`,
                              boxShadow: `0 0 6px ${catColor}`,
                            }}
                          />
                          <p className="whitespace-pre-wrap">{msg.message_text}</p>
                        </div>

                        {deltaVal !== 0 && (
                          <div className="mt-1.5 flex items-center gap-2 animate-slide-up">
                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-mono font-bold border ${
                              isGood
                                ? 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/40 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                                : 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/40 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                            }`}>
                              <span>{isGood ? '▼' : '▲'}</span>
                              <span>{deltaVal > 0 ? `+${deltaVal}` : deltaVal}%</span>
                            </span>
                            <span className="text-[10px] text-[#4A4A58] font-display uppercase tracking-wider font-bold">
                              {isGood ? 'De-escalation!' : 'Trigger hit'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="text-center py-2 animate-fade-in">
                  <span className="text-[10px] text-[#F43F5E] bg-[#F43F5E]/10 border border-[#F43F5E]/20 px-3 py-1 inline-block font-display uppercase tracking-wider">
                    {msg.message_text}
                  </span>
                </div>
              );
            })}

            {/* Typing */}
            {isTyping && (
              <div className="flex items-start gap-2.5 animate-fade-in">
                <BossAvatar
                  boss={boss}
                  className="w-8 h-8 hud-panel-sm text-xs mt-0.5 shrink-0"
                  glow={true}
                />
                <div
                  className="px-4 py-3 border flex items-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.95) 0%, rgba(11, 11, 15, 0.98) 100%)',
                    border: `1px solid ${catColor}40`,
                    borderLeft: `3px solid ${catColor}`,
                    boxShadow: `0 0 18px ${catColor}25, inset 0 0 15px ${catColor}08`,
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full typing-dot" style={{ backgroundColor: catColor, boxShadow: `0 0 8px ${catColor}` }} />
                  <div className="w-1.5 h-1.5 rounded-full typing-dot" style={{ backgroundColor: catColor, boxShadow: `0 0 8px ${catColor}` }} />
                  <div className="w-1.5 h-1.5 rounded-full typing-dot" style={{ backgroundColor: catColor, boxShadow: `0 0 8px ${catColor}` }} />
                  <span className="text-[10px] text-[#A0A0B0] ml-1 font-display uppercase tracking-wider font-bold">
                    {boss.name} is formulating response...
                  </span>
                </div>
              </div>
            )}

            {/* Post-Battle Outcome */}
            {outcome !== 'IN_PROGRESS' && !evaluating && (
              <div className="text-center py-6 animate-scale-in">
                {(() => {
                  const b = getOutcomeBanner(outcome);
                  return (
                    <div className={`inline-block px-8 py-5 bg-gradient-to-r ${b.gradient} border ${b.border} max-w-md`}>
                      <h3 className={`text-2xl font-black font-display uppercase tracking-wide ${b.textColor} mb-2`}>
                        {b.title}
                      </h3>
                      <p className="text-[11px] text-[#6E6E78] leading-relaxed mb-3">{b.subtitle}</p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/40 text-[10px] text-[#3A3A44]">
                        <div className="w-1.5 h-1.5 bg-[#06B6D4] animate-ping" />
                        <span className="font-display uppercase tracking-wider">Compiling EQ Report...</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Evaluation Spinner */}
            {evaluating && (
              <div className="text-center py-6 animate-fade-in">
                <div className="inline-flex items-center gap-3 px-5 py-3 bg-[#0B0B0E] border border-[#7C3AED]/30">
                  <div className="w-4 h-4 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
                  <div className="text-left">
                    <p className="text-[11px] font-black font-display text-[#7C3AED] uppercase tracking-wider">AI ANALYSIS</p>
                    <p className="text-[9px] text-[#3A3A44]">Scoring empathy, regulation & boundary control...</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Actions + Hint ── */}
          {outcome === 'IN_PROGRESS' && (
            <div className="px-4 pt-2.5 pb-2 bg-[#141418] border-t border-[#2A2A32] space-y-1.5 shrink-0">
              <div className="flex items-center gap-2 text-[10px] text-[#4A4A58]">
                <span className="text-[#06B6D4] text-xs" style={{ filter: 'drop-shadow(0 0 6px #06B6D4)' }}>💡</span>
                <span className="truncate font-display uppercase tracking-wider">
                  <span className="text-[#8E8E98]">{tacticalHint.tip}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] uppercase font-black text-[#4A4A58] font-display tracking-wider">QUICK:</span>
                {personaMeta.quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleUseSuggestedOpener(action.text)}
                    className="px-2.5 py-1 text-[10px] font-bold bg-[#0B0B0E] hover:bg-[#1C1C24] text-[#8E8E98] hover:text-white border border-[#2A2A32] hover:border-[#6366F1] hover:shadow-[0_0_12px_rgba(99,102,241,0.4)] transition-all cursor-pointer font-display uppercase tracking-wider"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Chat Input ── */}
          <div className="p-3 sm:p-4 bg-[#141418] border-t border-[#2A2A32] shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex gap-2.5"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={outcome !== 'IN_PROGRESS' ? 'Negotiation concluded...' : `Respond to ${boss.name}...`}
                  disabled={sending || outcome !== 'IN_PROGRESS'}
                  maxLength={1000}
                  className="w-full pl-4 pr-12 py-3 bg-[#0B0B0E] border border-[#2A2A32] text-white text-sm placeholder-[#4A4A58]
                             focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]
                             focus:shadow-[0_0_20px_rgba(99,102,241,0.35),inset_0_0_12px_rgba(99,102,241,0.1)]
                             transition-all disabled:opacity-40"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 stat-value text-[10px] text-[#3A3A44] hidden sm:block">
                  {1000 - inputValue.length}
                </span>
              </div>

              <button
                type="submit"
                disabled={!inputValue.trim() || sending || outcome !== 'IN_PROGRESS'}
                className="btn-primary-gradient px-6 py-3 font-black text-xs text-white cursor-pointer
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[65px] border-none font-display tracking-[0.1em]"
                style={{
                  boxShadow: !inputValue.trim() || sending || outcome !== 'IN_PROGRESS'
                    ? 'none'
                    : '0 0 18px rgba(99, 102, 241, 0.5), 0 0 35px rgba(124, 58, 237, 0.25)',
                }}
              >
                {sending ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>SEND</span>
                    <span className="text-sm font-black text-[#06B6D4] drop-shadow-[0_0_6px_#06B6D4]">↵</span>
                  </span>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* ═══ 3. RIGHT: LIVE FEEDBACK SYSTEM ═══ */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-3 overflow-y-auto pl-1">

          {/* Tension Gauge */}
          <div className="hud-panel p-5 space-y-3">
            <h3 className="text-[10px] uppercase tracking-[0.15em] font-black text-[#6E6E78] font-display flex items-center justify-between">
              <span>LIVE TENSION GAUGE</span>
              <span className="stat-value text-[9px] text-[#3A3A44]">0-100</span>
            </h3>

            <TensionMeter tension={tension.value} delta={tension.delta} />

            <div className="pt-2.5 border-t border-[#2A2A32] space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-[#22C55E]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#22C55E] animate-pulse" />
                  <span className="font-display uppercase tracking-wider">&lt; 20% GOAL</span>
                </span>
                <span className="font-black font-display">🏆 VICTORY</span>
              </div>
              <div className="flex items-center justify-between text-[#EF4444]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#EF4444]" />
                  <span className="font-display uppercase tracking-wider">&gt; 85% ESCALATION</span>
                </span>
                <span className="font-black font-display">💥 DEFEAT</span>
              </div>
            </div>
          </div>

          {/* Live Coach */}
          <div className="hud-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] uppercase tracking-[0.15em] font-black text-[#7C3AED] font-display flex items-center gap-1.5">
                🎓 LIVE COACH
              </h3>
              <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#7C3AED]/15 text-[#7C3AED] border border-[#7C3AED]/30 font-display tracking-wider">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2.5 text-[11px]">
              <div className="bg-[#0B0B0E] p-3 border border-[#2A2A32]">
                <span className="text-[9px] uppercase font-black text-[#3A3A44] block mb-1 font-display tracking-wider">
                  FOCUS: {tacticalHint.focus}
                </span>
                <p className="text-[#A0A0AA] leading-relaxed">{tacticalHint.tip}</p>
              </div>

              <div className="bg-[#EF4444]/8 p-2.5 border border-[#EF4444]/25 text-[#EF4444]">
                <span className="text-[9px] uppercase font-black block mb-0.5 font-display tracking-wider">
                  ⚠ AVOID:
                </span>
                <p className="text-[10px] leading-relaxed opacity-80">{tacticalHint.mistakeAlert}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] uppercase font-black text-[#06B6D4] block font-display tracking-wider">
                  SUGGESTED PHRASING:
                </span>
                <button
                  type="button"
                  onClick={() => handleUseSuggestedOpener(tacticalHint.opener)}
                  className="w-full text-left p-3 bg-[#06B6D4]/8 hover:bg-[#06B6D4]/15 border border-[#06B6D4]/25 hover:border-[#06B6D4]/50
                             text-[#A0A0AA] hover:text-white transition-all cursor-pointer text-[11px] italic group"
                >
                  <span>&quot;{tacticalHint.opener}&quot;</span>
                  <span className="block text-[9px] text-[#06B6D4] font-black not-italic mt-1 font-display uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
                    → INSERT INTO RESPONSE
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Session Stats */}
          <div className="hud-panel p-4">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-[#0B0B0E] p-2.5 border border-[#2A2A32]">
                <span className="text-[9px] text-[#3A3A44] uppercase block font-black font-display tracking-wider">TURNS LEFT</span>
                <span className="stat-value text-xl text-white mt-0.5 block">
                  {Math.max(0, turns.max - turns.current)}
                </span>
              </div>
              <div className="bg-[#0B0B0E] p-2.5 border border-[#2A2A32]">
                <span className="text-[9px] text-[#3A3A44] uppercase block font-black font-display tracking-wider">STREAK</span>
                <span className="stat-value text-xl text-[#F59E0B] mt-0.5 block">
                  {streak}x 🔥
                </span>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
