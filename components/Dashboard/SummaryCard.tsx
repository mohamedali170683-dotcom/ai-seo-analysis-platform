import React from 'react';
import { DASHBOARD_COLORS, getStatusColor, getStatusLabel } from '@/lib/theme/colors';

type StatusType = 'good' | 'warning' | 'critical';

interface SummaryCardProps {
  title: string;
  score: number;
  maxScore?: number;
  status: StatusType;
  onClick: () => void;
  isExpanded: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  good: { icon: '✓', color: DASHBOARD_COLORS.positive },
  warning: { icon: '⚠', color: DASHBOARD_COLORS.warning },
  critical: { icon: '!', color: DASHBOARD_COLORS.critical },
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  score,
  maxScore = 100,
  status,
  onClick,
  isExpanded,
  className = ''
}) => {
  const statusConfig = STATUS_CONFIG[status];

  return (
    <button
      className={`summary-card ${isExpanded ? 'expanded' : ''} ${className}`}
      onClick={onClick}
      aria-expanded={isExpanded}
      aria-label={`${title}: ${score}% - Click to ${isExpanded ? 'collapse' : 'expand'}`}
    >
      <div className="card-header">
        <span className="card-title">{title}</span>
        <span
          className="card-status"
          style={{ color: statusConfig.color }}
          aria-label={`Status: ${status}`}
        >
          {statusConfig.icon}
        </span>
      </div>

      <div className="card-score">
        <span className="score-value">{score}%</span>
      </div>

      <div className="card-expand-indicator">
        {isExpanded ? '▼' : '▶'} {isExpanded ? 'Hide details' : 'Show details'}
      </div>

      <style jsx>{`
        .summary-card {
          display: flex;
          flex-direction: column;
          padding: 16px;
          background: ${DASHBOARD_COLORS.bgPrimary};
          border: 1px solid ${DASHBOARD_COLORS.borderLight};
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          width: 100%;
        }

        .summary-card:hover {
          border-color: ${DASHBOARD_COLORS.brand};
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
          transform: translateY(-1px);
        }

        .summary-card:focus-visible {
          outline: 2px solid ${DASHBOARD_COLORS.brand};
          outline-offset: 2px;
        }

        .summary-card.expanded {
          border-color: ${DASHBOARD_COLORS.brand};
          background: ${DASHBOARD_COLORS.brandLight};
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .card-title {
          font-size: 14px;
          font-weight: 500;
          color: ${DASHBOARD_COLORS.textSecondary};
        }

        .card-status {
          font-size: 16px;
          font-weight: 700;
        }

        .card-score {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .score-value {
          font-size: 28px;
          font-weight: 700;
          color: ${DASHBOARD_COLORS.textPrimary};
        }

        .card-expand-indicator {
          margin-top: 8px;
          font-size: 10px;
          color: ${DASHBOARD_COLORS.textMuted};
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        @media (max-width: 640px) {
          .score-value {
            font-size: 24px;
          }
        }
      `}</style>
    </button>
  );
};
