"use client";

import React from 'react';
import './ScoreCard.css';

export interface ScoreStatus {
  label: string;
  color: 'green' | 'amber' | 'red';
}

export interface ScoreCardProps {
  title?: string;
  subtitle?: string;
  score: number;
  maxScore?: number;
  status?: ScoreStatus;
  questionsAnalyzed?: number;
  platformsCount?: number;
  responsesCount?: number;
  benchmarkDiff?: number;
  onDetailsClick?: () => void;
  className?: string;
  size?: 'default' | 'large' | 'compact';
}

/**
 * ScoreCard Component - Behavioral Science Optimized
 * 
 * Key features:
 * - Large, monospace score display (JetBrains Mono)
 * - Traffic light status colors (green/amber/red)
 * - Progress bar visualization
 * - Benchmark comparison
 * - Increased padding for comprehension
 */
export const ScoreCard: React.FC<ScoreCardProps> = ({ 
  title = "AI Visibility Score",
  subtitle = "How AI platforms mention your brand",
  score,
  maxScore = 100,
  status,
  questionsAnalyzed,
  platformsCount,
  responsesCount,
  benchmarkDiff,
  onDetailsClick,
  className = '',
  size = 'default',
}) => {
  const percentage = Math.round((score / maxScore) * 100);
  
  const getStatus = (score: number): ScoreStatus => {
    if (score >= 70) return { label: 'GOOD PERFORMANCE', color: 'green' };
    if (score >= 40) return { label: 'NEEDS WORK', color: 'amber' };
    return { label: 'CRITICAL', color: 'red' };
  };
  
  const scoreStatus = status || getStatus(score);
  
  return (
    <div className={`score-card score-card-${size} ${className}`}>
      <div className="score-card-header">
        <div className="score-card-icon" aria-hidden="true">📊</div>
        <div className="score-card-header-text">
          <h3 className="score-card-title">{title}</h3>
          <p className="score-card-subtitle">{subtitle}</p>
        </div>
      </div>
      
      <div className="score-card-body">
        <div className="score-display" aria-label={`Score: ${score} out of ${maxScore}`}>
          <span className="score-value">{score}</span>
          <span className="score-max">/{maxScore}</span>
        </div>
        
        <div 
          className="score-progress" 
          role="progressbar" 
          aria-valuenow={percentage} 
          aria-valuemin={0} 
          aria-valuemax={100}
        >
          <div 
            className={`score-progress-fill score-progress-${scoreStatus.color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className={`score-status score-status-${scoreStatus.color}`}>
          {scoreStatus.label}
        </div>
      </div>
      
      {(questionsAnalyzed || platformsCount || responsesCount) && (
        <div className="score-card-meta">
          {questionsAnalyzed && platformsCount && (
            <span>Based on {questionsAnalyzed} questions • {platformsCount} platforms</span>
          )}
          {responsesCount && (
            <span>Analyzed: {responsesCount} AI responses</span>
          )}
        </div>
      )}
      
      {benchmarkDiff !== undefined && benchmarkDiff !== null && (
        <div className={`score-benchmark ${benchmarkDiff >= 0 ? 'benchmark-positive' : 'benchmark-negative'}`}>
          <span>
            {benchmarkDiff >= 0 ? '↗' : '↘'} {Math.abs(benchmarkDiff)} points{' '}
            {benchmarkDiff >= 0 ? 'higher' : 'lower'} than category average
          </span>
        </div>
      )}
      
      {onDetailsClick && (
        <button 
          className="score-card-action" 
          onClick={onDetailsClick}
          aria-label={`View details for ${title}`}
        >
          View Details →
        </button>
      )}
    </div>
  );
};

/**
 * MetricCard - Smaller variant for secondary metrics
 */
export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = '',
}) => {
  return (
    <div className={`metric-card ${className}`}>
      {icon && <div className="metric-card-icon">{icon}</div>}
      <div className="metric-card-content">
        <p className="metric-card-title">{title}</p>
        <div className="metric-card-value">{value}</div>
        {subtitle && <p className="metric-card-subtitle">{subtitle}</p>}
        {trend && (
          <div className={`metric-card-trend ${trend.isPositive ? 'trend-positive' : 'trend-negative'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreCard;
