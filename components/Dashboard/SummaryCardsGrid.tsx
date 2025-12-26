import React from 'react';
import { SummaryCard } from './SummaryCard';
import { getStatusLabel } from '@/lib/theme/colors';

interface StageData {
  id: string;
  name: string;
  score: number;
  trend: number[];
}

interface SummaryCardsGridProps {
  stages: StageData[];
  expandedStage: string | null;
  onStageToggle: (stageId: string) => void;
  className?: string;
}

export const SummaryCardsGrid: React.FC<SummaryCardsGridProps> = ({
  stages,
  expandedStage,
  onStageToggle,
  className = ''
}) => {
  return (
    <div className={`summary-cards-grid ${className}`}>
      {stages.map(stage => (
        <SummaryCard
          key={stage.id}
          title={stage.name}
          score={stage.score}
          trend={stage.trend}
          status={getStatusLabel(stage.score)}
          onClick={() => onStageToggle(stage.id)}
          isExpanded={expandedStage === stage.id}
        />
      ))}

      <style jsx>{`
        .summary-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (min-width: 768px) {
          .summary-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .summary-cards-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
