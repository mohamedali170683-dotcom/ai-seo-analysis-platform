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
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="expand-text">{isExpanded ? 'Hide Details' : 'Click to View Details'}</span>
      </div>

      <style jsx>{`
        .summary-card {
          display: flex;
          flex-direction: column;
          padding: 16px;
          background: ${DASHBOARD_COLORS.bgPrimary};
          border: 2px solid ${DASHBOARD_COLORS.borderLight};
          border-radius: 16px;
          cursor: pointer;
          transition: all 150ms ease-out;
          text-align: left;
          width: 100%;
        }

        .summary-card:hover {
          border-color: ${DASHBOARD_COLORS.brandLight};
          box-shadow: 0 8px 32px rgba(6, 33, 33, 0.10), 0 4px 8px rgba(6, 33, 33, 0.06);
          transform: translateY(-1px);
        }

        .summary-card:hover .card-expand-indicator {
          background: ${DASHBOARD_COLORS.brand};
          color: white;
        }

        .summary-card:focus-visible {
          outline: 2px solid #396FFA;
          outline-offset: 2px;
        }

        .summary-card.expanded {
          border-color: ${DASHBOARD_COLORS.brand};
          background: ${DASHBOARD_COLORS.brandLight};
        }

        .summary-card.expanded .card-expand-indicator {
          background: ${DASHBOARD_COLORS.brand};
          color: white;
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 12px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 600;
          color: ${DASHBOARD_COLORS.brand};
          background: rgba(23, 61, 50, 0.08);
          border-radius: 10px;
          text-align: center;
          transition: all 150ms ease-out;
        }

        .expand-icon {
          font-size: 10px;
        }

        .expand-text {
          letter-spacing: 0.02em;
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
