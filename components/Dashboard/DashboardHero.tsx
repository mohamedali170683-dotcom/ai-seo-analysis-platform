import React from 'react';
import { Sparkline } from '../Charts';
import { SEMANTIC_COLORS } from '@/lib/theme/colors';

interface DashboardHeroProps {
  score: number;
  maxScore?: number;
  trend: number[];
  change: number;
  changeLabel?: string;
  alertCount?: number;
  lastUpdated?: Date | string;
  className?: string;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  score,
  maxScore = 100,
  trend,
  change,
  changeLabel = 'this week',
  alertCount = 0,
  lastUpdated,
  className = ''
}) => {
  const changeDirection = change >= 0 ? 'positive' : 'negative';

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section className={`dashboard-hero ${className}`}>
      {/* Primary Score */}
      <div className="hero-score-container">
        <div className="hero-score">
          <span className="score-number">{score}</span>
          <span className="score-max">/{maxScore}</span>
        </div>

        <div className="score-context">
          <Sparkline
            data={trend}
            height={32}
            width={120}
            color={SEMANTIC_COLORS.neutral}
          />
          <span className={`score-change ${changeDirection}`}>
            {change >= 0 ? '+' : ''}{change} {changeLabel}
          </span>
        </div>

        <div className="score-label">
          AI Visibility Score
        </div>
      </div>

      {/* Alerts (only show if count > 0) */}
      {alertCount > 0 && (
        <div className="hero-alerts">
          <span className="alert-badge">{alertCount}</span>
          <span className="alert-label">items need attention</span>
        </div>
      )}

      {/* Last updated timestamp */}
      {lastUpdated && (
        <div className="hero-meta">
          Last updated: {formatDate(lastUpdated)}
        </div>
      )}

      <style jsx>{`
        .dashboard-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 32px;
          background: ${SEMANTIC_COLORS.bgPrimary};
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 24px;
        }

        .hero-score-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hero-score {
          display: flex;
          align-items: baseline;
        }

        .score-number {
          font-size: 64px;
          font-weight: 700;
          line-height: 1;
          color: ${SEMANTIC_COLORS.textPrimary};
        }

        .score-max {
          font-size: 24px;
          font-weight: 400;
          color: ${SEMANTIC_COLORS.muted};
          margin-left: 4px;
        }

        .score-context {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .score-change {
          font-size: 14px;
          font-weight: 600;
        }

        .score-change.positive {
          color: ${SEMANTIC_COLORS.positive};
        }

        .score-change.negative {
          color: ${SEMANTIC_COLORS.critical};
        }

        .score-label {
          font-size: 14px;
          color: ${SEMANTIC_COLORS.textSecondary};
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hero-alerts {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #fef3c7;
          border-radius: 8px;
        }

        .alert-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 28px;
          padding: 0 8px;
          background: ${SEMANTIC_COLORS.warning};
          color: white;
          font-weight: 700;
          font-size: 14px;
          border-radius: 14px;
        }

        .alert-label {
          font-size: 14px;
          color: #92400e;
          font-weight: 500;
        }

        .hero-meta {
          font-size: 12px;
          color: ${SEMANTIC_COLORS.textMuted};
          margin-left: auto;
        }

        @media (max-width: 768px) {
          .dashboard-hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .score-number {
            font-size: 48px;
          }

          .hero-meta {
            margin-left: 0;
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
};
