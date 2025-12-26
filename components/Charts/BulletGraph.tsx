import React from 'react';

interface QualitativeRange {
  max: number;
  label: string;
}

interface BulletGraphProps {
  actual: number;
  target: number;
  ranges: QualitativeRange[];
  label: string;
  unit?: string;
  className?: string;
}

export const BulletGraph: React.FC<BulletGraphProps> = ({
  actual,
  target,
  ranges,
  label,
  unit = '%',
  className = ''
}) => {
  const maxRange = ranges[ranges.length - 1]?.max || 100;

  return (
    <div className={`bullet-graph ${className}`}>
      <span className="bullet-label">{label}</span>

      <div className="bullet-chart">
        {/* Background ranges */}
        <div className="bullet-ranges">
          {ranges.map((range, i) => (
            <div
              key={i}
              className={`bullet-range bullet-range-${i}`}
              style={{ width: `${(range.max / maxRange) * 100}%` }}
              title={range.label}
            />
          ))}
        </div>

        {/* Actual value bar */}
        <div
          className="bullet-actual"
          style={{ width: `${(actual / maxRange) * 100}%` }}
          title={`Actual: ${actual}${unit}`}
        />

        {/* Target marker */}
        <div
          className="bullet-target"
          style={{ left: `${(target / maxRange) * 100}%` }}
          title={`Target: ${target}${unit}`}
        />
      </div>

      <span className="bullet-value">{actual}{unit}</span>

      <style jsx>{`
        .bullet-graph {
          display: flex;
          align-items: center;
          gap: 12px;
          height: 24px;
          width: 100%;
        }

        .bullet-label {
          width: 120px;
          font-size: 14px;
          color: #374151;
          flex-shrink: 0;
        }

        .bullet-chart {
          flex: 1;
          height: 16px;
          position: relative;
          background: #f3f4f6;
          border-radius: 2px;
        }

        .bullet-ranges {
          position: absolute;
          inset: 0;
          display: flex;
        }

        .bullet-range {
          height: 100%;
        }

        .bullet-range-0 {
          background: #fee2e2;
        }

        .bullet-range-1 {
          background: #fef3c7;
        }

        .bullet-range-2 {
          background: #d1fae5;
        }

        .bullet-actual {
          position: absolute;
          height: 8px;
          top: 4px;
          left: 0;
          background: #1f2937;
          border-radius: 1px;
          z-index: 1;
        }

        .bullet-target {
          position: absolute;
          width: 3px;
          height: 16px;
          top: 0;
          background: #ef4444;
          transform: translateX(-50%);
          z-index: 2;
        }

        .bullet-value {
          width: 48px;
          text-align: right;
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};
