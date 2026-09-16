/**
 * EQverse - Battle Report (Full-Screen Cinematic Post-Game)
 * Phase 3: Report Card, Interactive Chart.js Radar Analytics & Quote Analysis Breakdown
 */

import { useState } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import BossAvatar from './BossAvatar';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const OUTCOME_CONFIG = {
  RESOLVED: {
    label: '🏆 VICTORY — CONFLICT RESOLVED',
    badge: 'RESOLVED',
    className: 'badge-resolved',
    description: 'Masterful de-escalation! You disarmed psychological resistance and built common ground.',
    accent: '#22C55E',
    secondaryAccent: '#06B6D4',
  },
  PARTIAL: {
    label: '⚡ DRAW — PARTIAL RESOLUTION',
    badge: 'PARTIAL RESOLUTION',
    className: 'badge-partial',
    description: 'Valuable progress achieved! Tensions leveled, though key emotional grievances remain open.',
    accent: '#F59E0B',
    secondaryAccent: '#F97316',
  },
  ESCALATED: {
    label: '💥 DEFEAT — CONFLICT ESCALATED',
    badge: 'ESCALATED',
    className: 'badge-escalated',
    description: 'Conversation became heated. Study the quote analysis breakdown below to isolate escalation triggers.',
    accent: '#EF4444',
    secondaryAccent: '#F43F5E',
  },
};

const DIMENSION_INTEL = {
  'Empathy': {
    icon: '💖',
    color: '#EC4899',
    description: 'Acknowledging and validating counterpart feelings without necessarily agreeing with their premise.',
    masteryTip: 'Validate the emotion before presenting solutions. People cannot negotiate logically until they feel heard.',
  },
  'Self-Regulation': {
    icon: '🧘',
    color: '#8B5CF6',
    description: 'Maintaining physiological poise, resisting impulsive sarcasm, and steering clear of defensive traps.',
    masteryTip: 'Pause before answering accusations. A 2-second breath prevents reactive counter-attacks.',
  },
  'Active Listening': {
    icon: '👂',
    color: '#06B6D4',
    description: 'Reflecting counterpart concerns in your own words and asking high-yield clarifying inquiries.',
    masteryTip: 'Use open-ended "How" or "What" questions instead of defensive "Why did you..." statements.',
  },
  'Clarity': {
    icon: '💬',
    color: '#3B82F6',
    description: 'Articulating observations, requirements, and next steps with zero passive-aggressive ambiguity.',
    masteryTip: 'State facts and impacts clearly. Avoid hedging or leaving timeline commitments vague.',
  },
  'Boundaries': {
    icon: '🛡',
    color: '#10B981',
    description: 'Holding firm ethical limits and professional ground without retaliating or surrendering.',
    masteryTip: 'Pair empathy with boundaries: "I care about our relationship, and I cannot accept this tone."',
  },
};

export default function BattleReport({ result, onBackToArena, onRematch }) {
  const { outcome, evaluation, boss, userXp, messages = [] } = result || {};
  const outcomeConfig = OUTCOME_CONFIG[outcome] || OUTCOME_CONFIG.PARTIAL;

  // Interactive states
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [quoteFilter, setQuoteFilter] = useState('all'); // 'all' | 'positive' | 'improvement'
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  // If evaluation is missing, provide fallback so the screen never breaks
  const safeEval = evaluation || {
    empathy_score: 6,
    self_regulation_score: 6,
    active_listening_score: 6,
    clarity_score: 6,
    boundary_score: 6,
    highlight_moments: [],
    coach_tip: 'Focus on validating counterpart feelings first to disarm defensive fight-or-flight triggers.',
    overall_summary: 'Solid communicative attempt. Consistent active listening will dramatically raise resolution rates.',
    xp_awarded: 30,
  };

  const scores = [
    { key: 'Empathy',          label: 'EMPATHY',          value: safeEval.empathy_score,          icon: '💖', color: '#EC4899' },
    { key: 'Self-Regulation',  label: 'SELF-REGULATION',  value: safeEval.self_regulation_score,  icon: '🧘', color: '#8B5CF6' },
    { key: 'Active Listening', label: 'ACTIVE LISTENING', value: safeEval.active_listening_score, icon: '👂', color: '#06B6D4' },
    { key: 'Clarity',          label: 'CLARITY',          value: safeEval.clarity_score,          icon: '💬', color: '#3B82F6' },
    { key: 'Boundaries',       label: 'BOUNDARIES',       value: safeEval.boundary_score,        icon: '🛡', color: '#10B981' },
  ];

  const avgScore = Math.round(scores.reduce((sum, s) => sum + s.value, 0) / scores.length * 10) / 10;

  // Chart.js Radar Data
  const radarDatasets = [
    {
      label: 'Your EQ Performance',
      data: [
        safeEval.empathy_score,
        safeEval.self_regulation_score,
        safeEval.active_listening_score,
        safeEval.clarity_score,
        safeEval.boundary_score,
      ],
      backgroundColor: `${outcomeConfig.accent}25`,
      borderColor: outcomeConfig.accent,
      borderWidth: 2.5,
      pointBackgroundColor: outcomeConfig.accent,
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 1.5,
      pointHoverBackgroundColor: '#FFFFFF',
      pointHoverBorderColor: outcomeConfig.accent,
      pointRadius: 5,
      pointHoverRadius: 8,
    },
  ];

  if (showBenchmark) {
    radarDatasets.push({
      label: 'Master Diplomat Target (8.0)',
      data: [8, 8, 8, 8, 8],
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.75)',
      borderWidth: 1.5,
      borderDash: [5, 5],
      pointBackgroundColor: '#F59E0B',
      pointBorderColor: '#0B0B0E',
      pointRadius: 3,
      pointHoverRadius: 5,
    });
  }

  const radarData = {
    labels: ['Empathy', 'Self-Regulation', 'Active Listening', 'Clarity', 'Boundaries'],
    datasets: radarDatasets,
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    onClick: (event, elements) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const dimensionKeys = ['Empathy', 'Self-Regulation', 'Active Listening', 'Clarity', 'Boundaries'];
        setSelectedDimension(dimensionKeys[index]);
      }
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        pointLabels: {
          color: (ctx) => {
            const label = ctx.label;
            return label === selectedDimension ? outcomeConfig.accent : '#A0A0AA';
          },
          font: { size: 11, family: 'Rajdhani', weight: '700' },
        },
        ticks: {
          display: true,
          stepSize: 2,
          color: 'rgba(255, 255, 255, 0.25)',
          backdropColor: 'transparent',
          font: { size: 9 },
        },
        suggestedMin: 0,
        suggestedMax: 10,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#8E8E98',
          font: { size: 10, family: 'Rajdhani', weight: '600' },
          boxWidth: 12,
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(11, 11, 14, 0.95)',
        titleColor: outcomeConfig.accent,
        bodyColor: '#E2E2EA',
        borderColor: `${outcomeConfig.accent}50`,
        borderWidth: 1,
        cornerRadius: 4,
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} / 10`,
          afterLabel: (ctx) => {
            const val = ctx.raw;
            if (val >= 9) return '⭐ Mastery Level';
            if (val >= 7) return '✓ Proficient Competency';
            if (val >= 5) return '⚠ Developing Skill';
            return '⚡ High-Priority Growth Area';
          },
        },
      },
    },
  };

  // Filter Highlight Moments
  const rawMoments = safeEval.highlight_moments || [];
  const filteredMoments = rawMoments.filter((m) => {
    if (quoteFilter === 'all') return true;
    return m.type === quoteFilter;
  });

  const positiveCount = rawMoments.filter((m) => m.type === 'positive').length;
  const improvementCount = rawMoments.filter((m) => m.type === 'improvement').length;

  const getScoreColor = (val) => {
    if (val >= 8) return '#22C55E';
    if (val >= 6) return '#06B6D4';
    if (val >= 4) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreRatingBadge = (val) => {
    if (val >= 9) return { label: 'EXEMPLARY', color: '#22C55E' };
    if (val >= 7) return { label: 'PROFICIENT', color: '#06B6D4' };
    if (val >= 5) return { label: 'DEVELOPING', color: '#F59E0B' };
    return { label: 'GROWTH NEEDED', color: '#EF4444' };
  };

  const handleExportSummary = () => {
    const summaryText = `EQVERSE BATTLE EVALUATION REPORT
Opponent: ${boss?.name || 'AI Persona'} (${boss?.category?.toUpperCase() || 'UNKNOWN'})
Outcome: ${outcomeConfig.label}
Average EQ: ${avgScore}/10 | XP Earned: +${safeEval.xp_awarded} XP

DIMENSION SCORES:
- Empathy: ${safeEval.empathy_score}/10
- Self-Regulation: ${safeEval.self_regulation_score}/10
- Active Listening: ${safeEval.active_listening_score}/10
- Clarity: ${safeEval.clarity_score}/10
- Boundaries: ${safeEval.boundary_score}/10

COACH TIP:
${safeEval.coach_tip}

OVERALL SUMMARY:
${safeEval.overall_summary}`;

    navigator.clipboard?.writeText(summaryText);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in flex flex-col gap-6">

      {/* ── Toast Notification ── */}
      {copyToast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-up">
          <div className="px-4 py-2.5 bg-[#22C55E] text-black font-black text-xs font-display uppercase tracking-wider shadow-2xl flex items-center gap-2">
            <span>✓</span>
            <span>Report Summary Copied to Clipboard!</span>
          </div>
        </div>
      )}

      {/* ═══ 1. CINEMATIC OUTCOME BANNER ═══ */}
      <div
        className="hud-panel p-6 sm:p-8 relative overflow-hidden transition-all border"
        style={{
          borderColor: `${outcomeConfig.accent}40`,
          boxShadow: `0 0 45px -10px ${outcomeConfig.accent}20, inset 0 0 25px -10px ${outcomeConfig.accent}10`,
        }}
      >
        {/* Ambient background glow */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-[90px] pointer-events-none opacity-20"
          style={{ backgroundColor: outcomeConfig.accent }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left: Outcome status */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0B0B0E] border text-[10px] font-black uppercase tracking-[0.2em] font-display"
                 style={{ borderColor: `${outcomeConfig.accent}50`, color: outcomeConfig.accent }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: outcomeConfig.accent }} />
              <span>PHASE 3 EVALUATION CARD • {outcomeConfig.badge}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display uppercase tracking-wide"
                style={{ color: outcomeConfig.accent }}>
              {outcomeConfig.label}
            </h1>

            <p className="text-sm text-[#A0A0AA] max-w-xl leading-relaxed">
              {outcomeConfig.description}
            </p>
          </div>

          {/* Right: Opponent & Award Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
            {/* Boss combatant pill */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0B0B0E] border border-[#2A2A32] hud-panel-sm">
              <BossAvatar
                boss={boss}
                className="w-10 h-10 hud-panel-sm text-sm"
                glow={true}
              />
              <div className="text-left">
                <span className="text-[9px] text-[#6E6E78] font-bold font-display uppercase tracking-wider block">OPPONENT</span>
                <span className="text-sm font-black text-white font-display uppercase">{boss?.name || 'Opponent'}</span>
              </div>
            </div>

            {/* XP Award Pill */}
            <div className="px-5 py-3 bg-[#F59E0B]/10 border border-[#F59E0B]/40 text-center hud-panel-sm">
              <span className="text-[9px] text-[#F59E0B] font-black uppercase tracking-wider block font-display">XP EARNED</span>
              <span className="stat-value text-2xl text-[#F59E0B] block">+{safeEval.xp_awarded} XP</span>
            </div>

            {/* Overall EQ Score Pill */}
            <div className="px-5 py-3 bg-[#06B6D4]/10 border border-[#06B6D4]/40 text-center hud-panel-sm">
              <span className="text-[9px] text-[#06B6D4] font-black uppercase tracking-wider block font-display">OVERALL EQ</span>
              <span className="stat-value text-2xl text-[#06B6D4] block">{avgScore} <span className="text-xs text-[#6E6E78]">/ 10</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 2. INTERACTIVE RADAR & SCORE BREAKDOWN GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── LEFT: INTERACTIVE CHART.JS RADAR HUD (7 Cols) ── */}
        <div className="lg:col-span-7 hud-panel p-6 flex flex-col gap-4 relative">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2A32] pb-3">
            <div>
              <h2 className="text-base font-black font-display text-white uppercase tracking-[0.15em] flex items-center gap-2">
                <span>📡</span>
                <span>INTERACTIVE EQ RADAR ANALYTICS</span>
              </h2>
              <span className="text-[11px] text-[#6E6E78]">
                Click any radar point or dimension below to inspect tactical breakdown.
              </span>
            </div>

            {/* Benchmark Toggle Button */}
            <button
              onClick={() => setShowBenchmark(!showBenchmark)}
              className={`px-3 py-1.5 text-[10px] font-black font-display uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 ${
                showBenchmark
                  ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40'
                  : 'bg-[#141418] text-[#6E6E78] border-[#2A2A32] hover:text-white'
              }`}
              title="Toggle target benchmark comparison overlay"
            >
              <span>{showBenchmark ? '⚖ BENCHMARK: ACTIVE' : '⚖ COMPARE BENCHMARK'}</span>
            </button>
          </div>

          {/* Radar Canvas Container */}
          <div className="w-full max-w-sm sm:max-w-md mx-auto py-2 relative flex items-center justify-center min-h-[300px]">
            <Radar data={radarData} options={radarOptions} />
          </div>

          {/* Interactive Dimension Inspector Card */}
          {selectedDimension && DIMENSION_INTEL[selectedDimension] && (
            <div className="p-4 bg-[#0B0B0E] border animate-slide-up mt-2"
                 style={{ borderColor: `${DIMENSION_INTEL[selectedDimension].color}50` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{DIMENSION_INTEL[selectedDimension].icon}</span>
                  <span className="text-sm font-black font-display uppercase tracking-wider text-white">
                    {selectedDimension} Deep Dive
                  </span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-none font-display uppercase"
                        style={{
                          backgroundColor: `${DIMENSION_INTEL[selectedDimension].color}20`,
                          color: DIMENSION_INTEL[selectedDimension].color,
                        }}>
                    {getScoreRatingBadge(scores.find(s => s.key === selectedDimension)?.value || 5).label}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDimension(null)}
                  className="text-xs text-[#6E6E78] hover:text-white cursor-pointer px-1.5"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#A0A0AA] mb-2 leading-relaxed">
                {DIMENSION_INTEL[selectedDimension].description}
              </p>
              <div className="p-2.5 bg-[#141418] border border-[#2A2A32] text-[11px] text-[#E2E2EA]">
                <span className="text-[#F59E0B] font-bold block mb-0.5 font-display uppercase tracking-wider text-[9px]">
                  💡 TACTICAL MASTERY TIP:
                </span>
                {DIMENSION_INTEL[selectedDimension].masteryTip}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: 5-DIMENSION SCORE METERS (5 Cols) ── */}
        <div className="lg:col-span-5 hud-panel p-6 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#2A2A32] pb-3 mb-4">
              <h3 className="text-base font-black font-display text-white uppercase tracking-[0.15em]">
                DIMENSIONAL SCORING
              </h3>
              <span className="text-[10px] text-[#6E6E78] font-mono">1-10 SCALE</span>
            </div>

            <div className="space-y-4">
              {scores.map((score) => {
                const color = score.color;
                const isSelected = selectedDimension === score.key;

                return (
                  <div
                    key={score.key}
                    onClick={() => setSelectedDimension(isSelected ? null : score.key)}
                    className={`p-2.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1C1C24] border-[#6366F1]/60 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-[#0B0B0E]/60 border-[#2A2A32] hover:border-[#3A3A44]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black font-display uppercase tracking-wider text-[#E2E2EA] flex items-center gap-2">
                        <span>{score.icon}</span>
                        <span>{score.label}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase font-display" style={{ color: getScoreColor(score.value) }}>
                          {getScoreRatingBadge(score.value).label}
                        </span>
                        <span className="stat-value text-base font-black" style={{ color: getScoreColor(score.value) }}>
                          {score.value}/10
                        </span>
                      </div>
                    </div>

                    {/* 10-Segment HUD Bar */}
                    <div className="hud-meter" style={{ height: '8px' }}>
                      {Array.from({ length: 10 }, (_, i) => {
                        const filled = i < score.value;
                        return (
                          <div
                            key={i}
                            className="hud-meter-segment"
                            style={{
                              backgroundColor: filled ? color : '#1C1C22',
                              opacity: filled ? (i < score.value - 2 ? 1 : 0.75) : 0.25,
                              boxShadow: filled ? `0 0 6px ${color}40` : 'none',
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-[#0B0B0E] border border-[#2A2A32] flex items-center justify-between text-xs text-[#8E8E98]">
            <span>Average EQ Index:</span>
            <span className="stat-value text-lg gradient-text font-black">{avgScore} / 10</span>
          </div>
        </div>
      </div>

      {/* ═══ 3. QUOTE ANALYSIS BREAKDOWN ═══ */}
      <div className="hud-panel p-6 sm:p-7 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A32] pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black font-display text-white uppercase tracking-[0.15em] flex items-center gap-2">
              <span>💬</span>
              <span>QUOTE ANALYSIS BREAKDOWN</span>
            </h2>
            <p className="text-xs text-[#6E6E78]">
              AI verbal autopsy: pinpointing high-EQ disarming maneuvers and critical escalation triggers.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setQuoteFilter('all')}
              className={`px-3 py-1 text-[11px] font-black font-display uppercase tracking-wider transition-all cursor-pointer border ${
                quoteFilter === 'all'
                  ? 'bg-[#6366F1]/20 text-[#6366F1] border-[#6366F1]/50'
                  : 'bg-[#141418] text-[#6E6E78] border-[#2A2A32] hover:text-white'
              }`}
            >
              ALL QUOTES ({rawMoments.length})
            </button>
            <button
              onClick={() => setQuoteFilter('positive')}
              className={`px-3 py-1 text-[11px] font-black font-display uppercase tracking-wider transition-all cursor-pointer border ${
                quoteFilter === 'positive'
                  ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/50'
                  : 'bg-[#141418] text-[#6E6E78] border-[#2A2A32] hover:text-white'
              }`}
            >
              🟢 HIGH-EQ MOVES ({positiveCount})
            </button>
            <button
              onClick={() => setQuoteFilter('improvement')}
              className={`px-3 py-1 text-[11px] font-black font-display uppercase tracking-wider transition-all cursor-pointer border ${
                quoteFilter === 'improvement'
                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50'
                  : 'bg-[#141418] text-[#6E6E78] border-[#2A2A32] hover:text-white'
              }`}
            >
              ⚠ GROWTH AREAS ({improvementCount})
            </button>
          </div>
        </div>

        {/* Highlight Quote Cards */}
        {filteredMoments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMoments.map((moment, idx) => {
              const isPositive = moment.type === 'positive';
              const accent = isPositive ? '#22C55E' : '#F59E0B';
              const dimensionName = moment.dimension || (isPositive ? 'Active Listening' : 'Boundary Setting');

              return (
                <div
                  key={idx}
                  className="p-5 bg-[#0B0B0E] border flex flex-col justify-between gap-3.5 relative overflow-hidden transition-all duration-300"
                  style={{
                    borderColor: `${accent}40`,
                    boxShadow: `0 0 20px -5px ${accent}15`,
                  }}
                >
                  {/* Left accent indicator strip */}
                  <div
                    className="absolute top-0 left-0 bottom-0 w-1"
                    style={{ backgroundColor: accent }}
                  />

                  {/* Top Metadata row */}
                  <div className="flex items-center justify-between gap-2 pl-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 font-display"
                          style={{ color: accent, backgroundColor: `${accent}15`, border: `1px solid ${accent}35` }}>
                      {isPositive ? '🏆 HIGH-EQ DISARMING MOVE' : '⚠ ESCALATION TRIGGER'}
                    </span>
                    <span className="text-[10px] text-[#6E6E78] font-bold uppercase font-display">
                      #{dimensionName}
                    </span>
                  </div>

                  {/* Exact Quote */}
                  <div className="pl-2">
                    <span className="text-[9px] uppercase font-black tracking-wider text-[#4A4A58] block mb-1 font-display">
                      YOUR VERBATIM QUOTE:
                    </span>
                    <blockquote className="text-sm font-medium text-white italic border-l-2 pl-3 py-0.5 leading-relaxed"
                                style={{ borderColor: `${accent}80` }}>
                      &ldquo;{moment.quote}&rdquo;
                    </blockquote>
                  </div>

                  {/* AI Psychological Feedback */}
                  <div className="pl-2 pt-2 border-t border-[#1C1C22]">
                    <span className="text-[9px] uppercase font-black tracking-wider text-[#6E6E78] block mb-0.5 font-display">
                      PSYCHOLOGICAL IMPACT:
                    </span>
                    <p className="text-xs text-[#A0A0AA] leading-relaxed">
                      {moment.feedback}
                    </p>
                  </div>

                  {/* Better Alternative Box (if improvement moment) */}
                  {!isPositive && moment.better_alternative && (
                    <div className="ml-2 p-3 bg-[#6366F1]/10 border border-[#6366F1]/30">
                      <span className="text-[9px] uppercase font-black tracking-wider text-[#06B6D4] block mb-1 font-display">
                        ✨ AI COACH RECOMMENDED ALTERNATIVE:
                      </span>
                      <p className="text-xs text-[#E2E2EA] font-medium italic">
                        &ldquo;{moment.better_alternative}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#0B0B0E] border border-[#2A2A32] text-xs text-[#6E6E78]">
            No quote highlights found matching this category filter.
          </div>
        )}

        {/* ── Expandable Full Conversation Timeline ── */}
        {messages && messages.length > 0 && (
          <div className="pt-2 border-t border-[#2A2A32]">
            <button
              onClick={() => setShowFullTranscript(!showFullTranscript)}
              className="w-full py-3 px-4 bg-[#141418] hover:bg-[#1C1C22] border border-[#2A2A32] text-xs font-black font-display uppercase tracking-wider text-[#A0A0AA] hover:text-white transition-all cursor-pointer flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span>📜</span>
                <span>{showFullTranscript ? 'HIDE' : 'EXPAND'} FULL CHRONOLOGICAL TRANSCRIPT ({messages.length} MESSAGES)</span>
              </span>
              <span>{showFullTranscript ? '▲ COLLAPSE' : '▼ VIEW ALL TURNS'}</span>
            </button>

            {showFullTranscript && (
              <div className="mt-3 space-y-3 p-4 bg-[#0B0B0E] border border-[#2A2A32] max-h-96 overflow-y-auto animate-slide-up">
                {messages.map((msg, idx) => {
                  const isUser = msg.sender === 'USER';
                  const delta = msg.tension_delta || 0;

                  return (
                    <div
                      key={msg.id || idx}
                      className={`p-3 border text-xs flex flex-col gap-1.5 ${
                        isUser
                          ? 'bg-[#141418] border-[#6366F1]/30 ml-4'
                          : 'bg-[#0E0E12] border-[#2A2A32] mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-display uppercase text-[10px]"
                              style={{ color: isUser ? '#06B6D4' : '#F59E0B' }}>
                          {isUser ? 'YOU (USER)' : boss?.name || 'OPPONENT'}
                        </span>
                        {isUser && delta !== 0 && (
                          <span className={`text-[10px] font-mono font-bold ${delta < 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                            {delta < 0 ? `▼ ${delta} Tension` : `▲ +${delta} Tension`}
                          </span>
                        )}
                      </div>
                      <p className="text-[#D1D1DB] leading-relaxed">
                        {msg.message_text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ 4. COACH SUMMARY & ACTIONABLE TACTICAL TIP ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="hud-panel p-6 border-l-4 border-l-[#7C3AED]">
          <h3 className="text-xs font-black font-display uppercase tracking-[0.15em] text-[#7C3AED] mb-2 flex items-center gap-2">
            <span>🎓</span>
            <span>TACTICAL COACHING TIP</span>
          </h3>
          <p className="text-sm text-[#E2E2EA] leading-relaxed">
            {safeEval.coach_tip}
          </p>
        </div>

        <div className="hud-panel p-6 border-l-4 border-l-[#06B6D4]">
          <h3 className="text-xs font-black font-display uppercase tracking-[0.15em] text-[#06B6D4] mb-2 flex items-center gap-2">
            <span>📋</span>
            <span>OVERALL PERFORMANCE SUMMARY</span>
          </h3>
          <p className="text-sm text-[#E2E2EA] leading-relaxed">
            {safeEval.overall_summary}
          </p>
        </div>
      </div>

      {/* ═══ 5. FOOTER CTAs ═══ */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-4 mb-8">
        <button
          onClick={onBackToArena}
          className="btn-primary-gradient px-8 py-3.5 font-black text-xs text-white cursor-pointer font-display tracking-[0.15em] border-none flex items-center gap-2"
        >
          <span>⚔</span>
          <span>RETURN TO ARENA</span>
        </button>

        {onRematch && boss && (
          <button
            onClick={() => onRematch(boss.id)}
            className="px-8 py-3.5 bg-[#141418] hover:bg-[#1C1C22] border border-[#6366F1]/50 hover:border-[#6366F1] text-white font-black text-xs cursor-pointer font-display tracking-[0.15em] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          >
            <span>🔄</span>
            <span>REMATCH WITH {boss.name.toUpperCase()}</span>
          </button>
        )}

        <button
          onClick={handleExportSummary}
          className="px-6 py-3.5 bg-[#0B0B0E] hover:bg-[#141418] border border-[#2A2A32] hover:border-[#3A3A44] text-[#A0A0AA] hover:text-white font-black text-xs cursor-pointer font-display tracking-[0.15em] transition-all flex items-center gap-2"
        >
          <span>📋</span>
          <span>COPY SUMMARY</span>
        </button>
      </div>

    </div>
  );
}
