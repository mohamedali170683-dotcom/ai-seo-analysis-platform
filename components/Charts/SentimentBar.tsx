import React from 'react';

interface SentimentBarProps {
  positive: number;
  neutral: number;
  negative: number;
  className?: string;
}

export const SentimentBar: React.FC<SentimentBarProps> = ({
  positive,
  neutral,
  negative,
  className = ''
}) => {
  const total = positive + neutral + negative;
  const net = positive - negative;
  const netLabel = net >= 0 ? `+${net}%` : `${net}%`;

  // Calculate percentages for each half of the bar
  const negativeWidth = total > 0 ? (negative / total) * 50 : 0;
  const neutralLeftWidth = total > 0 ? (neutral / total) * 25 : 0; // Half of neutral on left
  const neutralRightWidth = total > 0 ? (neutral / total) * 25 : 0; // Half of neutral on right
  const positiveWidth = total > 0 ? (positive / total) * 50 : 0;

  return (
    <div className={`sentiment-bar-container ${className}`}>
      <div className="sentiment-bar">
        {/* Left side (negative + half neutral) */}
        <div className="sentiment-left">
          <div
            className="sentiment-negative"
            style={{ width: `${negativeWidth * 2}%` }}
            title={`${negative}% Negative`}
          />
          <div
            className="sentiment-neutral-left"
            style={{ width: `${neutralLeftWidth * 2}%` }}
            title={`${neutral}% Neutral`}
          />
        </div>

        {/* Center divider */}
        <div className="sentiment-divider" />

        {/* Right side (half neutral + positive) */}
        <div className="sentiment-right">
          <div
            className="sentiment-neutral-right"
            style={{ width: `${neutralRightWidth * 2}%` }}
            title={`${neutral}% Neutral`}
          />
          <div
            className="sentiment-positive"
            style={{ width: `${positiveWidth * 2}%` }}
            title={`${positive}% Positive`}
          />
        </div>
      </div>

      <div className="sentiment-labels">
        <span className="sentiment-label negative">{negative}% Negative</span>
        <span className="sentiment-net">Net: {netLabel}</span>
        <span className="sentiment-label positive">{positive}% Positive</span>
      </div>

      <style jsx>{`
        .sentiment-bar-container {
          width: 100%;
        }

        .sentiment-bar {
          display: flex;
          height: 24px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
        }

        .sentiment-left {
          display: flex;
          flex: 1;
          justify-content: flex-end;
        }

        .sentiment-right {
          display: flex;
          flex: 1;
        }

        .sentiment-negative {
          background: #fca5a5;
          transition: width 0.3s ease;
        }

        .sentiment-neutral-left,
        .sentiment-neutral-right {
          background: #d1d5db;
          transition: width 0.3s ease;
        }

        .sentiment-divider {
          width: 2px;
          background: #1f2937;
          flex-shrink: 0;
        }

        .sentiment-positive {
          background: #86efac;
          transition: width 0.3s ease;
        }

        .sentiment-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 12px;
        }

        .sentiment-label.negative {
          color: #dc2626;
        }

        .sentiment-label.positive {
          color: #16a34a;
        }

        .sentiment-net {
          font-weight: 600;
          color: #1f2937;
        }
      `}</style>
    </div>
  );
};
