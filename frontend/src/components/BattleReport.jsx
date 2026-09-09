/**
 * EQverse - Battle Report (Full-Screen Cinematic Post-Game)
 * Fighting-game result screen with animated XP feedback,
 * HUD panels, radar chart, and score breakdown bars.
 */

import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import BossAvatar from './BossAvatar';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

const OUTCOME_CONFIG = {
  RESOLVED: {
    label: '🏆 VICTORY — CONFLICT RESOLVED',
    className: 'badge-resolved',
    description: 'You successfully de-escalated the situation!',
    accent: '#22C55E',
  },
  PARTIAL: {
    label: '⚡ DRAW — PARTIAL RESOLUTION',
    className: 'badge-partial',
    description: 'Progress was made, but there\'s room for improvement.',
    accent: '#F59E0B',
  },
  ESCALATED: {
    label: '💥 DEFEAT — CONFLICT ESCALATED',
    className: 'badge-escalated',
    description: 'The conversation became heated. Let\'s learn from this.',
    accent: '#EF4444',
  },
};

export default function BattleReport({ result, onBackToArena }) {
  const { outcome, evaluation, boss } = result;
  const outcomeConfig = OUTCOME_CONFIG[outcome] || OUTCOME_CONFIG.PARTIAL;

  const radarData = evaluation
    ? {
        labels: ['Empathy', 'Self-Regulation', 'Active Listening', 'Clarity', 'Boundaries'],
        datasets: [
          {
            label: 'Your EQ Score',
            data: [
              evaluation.empathy_score,
              evaluation.self_regulation_score,
              evaluation.active_listening_score,
              evaluation.clarity_score,
              evaluation.boundary_score,
            ],
            backgroundColor: `${outcomeConfig.accent}20`,
            borderColor: outcomeConfig.accent,
            borderWidth: 2,
            pointBackgroundColor: outcomeConfig.accent,
            pointBorderColor: outcomeConfig.accent,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: outcomeConfig.accent,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      }
    : null;

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.04)' },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        pointLabels: {
          color: '#6E6E78',
          font: { size: 11, family: 'Rajdhani', weight: '700' },
        },
        ticks: { display: false, stepSize: 2 },
        suggestedMin: 0,
        suggestedMax: 10,
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(11, 11, 14, 0.95)',
        titleColor: outcomeConfig.accent,
        bodyColor: '#E2E2EA',
        borderColor: `${outcomeConfig.accent}40`,
        borderWidth: 1,
        cornerRadius: 4,
        padding: 10,
        callbacks: { label: (ctx) => `Score: ${ctx.raw}/10` },
      },
    },
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#22C55E';
    if (score >= 6) return '#06B6D4';
    if (score >= 4) return '#F59E0B';
    return '#EF4444';
  };

  if (!evaluation) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="hud-panel p-10">
          <h2 className="text-2xl font-black font-display text-white uppercase tracking-wide mb-4">
            BATTLE COMPLETE
          </h2>
          <p className="text-[#6E6E78] mb-6 text-sm">
            Unable to generate evaluation. Please try again.
          </p>
          <button
            onClick={onBackToArena}
            className="btn-primary-gradient px-7 py-3.5 font-black text-sm text-white cursor-pointer font-display tracking-[0.15em] border-none"
          >
            RETURN TO ARENA
          </button>
        </div>
      </div>
    );
  }

  const scores = [
    { label: 'EMPATHY',          value: evaluation.empathy_score,          icon: '💖' },
    { label: 'SELF-REGULATION',  value: evaluation.self_regulation_score,  icon: '🧘' },
    { label: 'ACTIVE LISTENING', value: evaluation.active_listening_score, icon: '👂' },
    { label: 'CLARITY',          value: evaluation.clarity_score,          icon: '💬' },
    { label: 'BOUNDARIES',       value: evaluation.boundary_score,        icon: '🛡' },
  ];

  const avgScore = Math.round(scores.reduce((sum, s) => sum + s.value, 0) / scores.length);

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* ── Outcome Banner (Full-Width) ── */}
      <div className="text-center mb-8 animate-scale-in">
        <div
          className="inline-block px-8 py-5 border"
          style={{
            background: `linear-gradient(135deg, ${outcomeConfig.accent}12, transparent)`,
            borderColor: `${outcomeConfig.accent}40`,
          }}
        >
          <h2 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-wide mb-1"
              style={{ color: outcomeConfig.accent }}>
            {outcomeConfig.label}
          </h2>
          <p className="text-sm text-[#6E6E78]">{outcomeConfig.description}</p>
        </div>
      </div>

      {/* ── Boss + XP Bar ── */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <BossAvatar
          boss={boss}
          className="w-10 h-10 hud-panel-sm text-sm"
          glow={true}
        />
        <span className="text-[#6E6E78] text-sm font-display uppercase tracking-wider">
          VS <span className="text-white font-black">{boss.name}</span>
        </span>
        {evaluation.xp_awarded > 0 && (
          <span className="stat-value text-sm px-3 py-1 border"
                style={{ color: '#F59E0B', backgroundColor: '#F59E0B12', borderColor: '#F59E0B35' }}>
            +{evaluation.xp_awarded} XP
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Radar Chart ── */}
        <div className="hud-panel p-6 animate-slide-up">
          <h3 className="text-sm font-black font-display text-white uppercase tracking-[0.15em] mb-4 text-center">
            EQ RADAR PROFILE
          </h3>
          <div className="w-full max-w-xs mx-auto">
            {radarData && <Radar data={radarData} options={radarOptions} />}
          </div>
          <div className="text-center mt-4">
            <span className="stat-value text-3xl gradient-text">{avgScore}</span>
            <span className="text-[#3A3A44] text-sm font-display">/10 AVG</span>
          </div>
        </div>

        {/* ── Score Breakdown ── */}
        <div className="hud-panel p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-sm font-black font-display text-white uppercase tracking-[0.15em] mb-5">
            SCORE BREAKDOWN
          </h3>
          <div className="space-y-4">
            {scores.map((score) => {
              const color = getScoreColor(score.value);
              return (
                <div key={score.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#A0A0AA] flex items-center gap-2 font-display uppercase tracking-wider">
                      <span>{score.icon}</span>
                      {score.label}
                    </span>
                    <span className="stat-value text-base" style={{ color }}>{score.value}</span>
                  </div>
                  {/* Segmented Bar */}
                  <div className="hud-meter" style={{ height: '10px' }}>
                    {Array.from({ length: 10 }, (_, i) => (
                      <div
                        key={i}
                        className="hud-meter-segment"
                        style={{
                          backgroundColor: i < score.value ? color : '#1C1C22',
                          opacity: i < score.value ? 1 : 0.3,
                          boxShadow: i < score.value ? `0 0 4px ${color}30` : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Highlight Moments ── */}
      {evaluation.highlight_moments && evaluation.highlight_moments.length > 0 && (
        <div className="hud-panel p-6 mt-5 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-sm font-black font-display text-white uppercase tracking-[0.15em] mb-5">
            💡 KEY MOMENTS
          </h3>
          <div className="space-y-3">
            {evaluation.highlight_moments.map((moment, index) => (
              <div
                key={index}
                className="p-4 border"
                style={{
                  backgroundColor: moment.type === 'positive' ? '#22C55E08' : '#F59E0B08',
                  borderColor: moment.type === 'positive' ? '#22C55E30' : '#F59E0B30',
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-base mt-0.5 shrink-0">
                    {moment.type === 'positive' ? '✅' : '💡'}
                  </span>
                  <div>
                    <p className="text-sm text-[#A0A0AA] italic mb-1.5 font-medium">
                      &quot;{moment.quote}&quot;
                    </p>
                    <p className="text-xs text-[#6E6E78]">{moment.feedback}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Coach Tip & Summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        {evaluation.coach_tip && (
          <div className="hud-panel p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <h3 className="text-[10px] font-black font-display uppercase tracking-[0.15em] text-[#7C3AED] mb-3 flex items-center gap-2">
              🎓 COACH'S TIP
            </h3>
            <p className="text-sm text-[#A0A0AA] leading-relaxed">{evaluation.coach_tip}</p>
          </div>
        )}

        {evaluation.overall_summary && (
          <div className="hud-panel p-6 animate-slide-up" style={{ animationDelay: '350ms' }}>
            <h3 className="text-[10px] font-black font-display uppercase tracking-[0.15em] text-[#06B6D4] mb-3 flex items-center gap-2">
              📋 OVERALL SUMMARY
            </h3>
            <p className="text-sm text-[#A0A0AA] leading-relaxed">{evaluation.overall_summary}</p>
          </div>
        )}
      </div>

      {/* ── Back to Arena CTA ── */}
      <div className="text-center mt-8 mb-4">
        <button
          onClick={onBackToArena}
          className="btn-primary-gradient px-10 py-4 font-black text-sm text-white cursor-pointer font-display tracking-[0.15em] border-none"
        >
          ⚔ RETURN TO ARENA — FIGHT AGAIN
        </button>
      </div>
    </div>
  );
}
