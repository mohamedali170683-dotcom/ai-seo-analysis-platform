import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DASHBOARD_COLORS } from '@/lib/theme/colors';

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isExpanded,
  onToggle,
  children,
  icon,
  className = ''
}) => {
  return (
    <div className={`collapsible-section ${isExpanded ? 'expanded' : ''} ${className}`}>
      <button
        className="section-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="section-title-container">
          {icon && <span className="section-icon">{icon}</span>}
          <span className="section-title">{title}</span>
        </div>
        <span className="section-toggle">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </span>
      </button>

      {isExpanded && (
        <div
          className="section-content"
          id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {children}
        </div>
      )}

      <style jsx>{`
        .collapsible-section {
          background: ${DASHBOARD_COLORS.bgPrimary};
          border-radius: 8px;
          border: 1px solid ${DASHBOARD_COLORS.borderLight};
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .collapsible-section.expanded {
          border-color: ${DASHBOARD_COLORS.borderMedium};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .section-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: ${DASHBOARD_COLORS.bgPrimary};
          border: none;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .section-header:hover {
          background: ${DASHBOARD_COLORS.bgSecondary};
        }

        .section-header:focus-visible {
          outline: 2px solid ${DASHBOARD_COLORS.brand};
          outline-offset: -2px;
        }

        .section-title-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-icon {
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: ${DASHBOARD_COLORS.textPrimary};
          text-align: left;
        }

        .section-toggle {
          color: ${DASHBOARD_COLORS.textMuted};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }

        .section-header:hover .section-toggle {
          color: ${DASHBOARD_COLORS.brand};
        }

        .section-content {
          padding: 20px;
          border-top: 1px solid ${DASHBOARD_COLORS.borderLight};
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
