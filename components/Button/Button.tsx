"use client";

import React from 'react';
import './Button.css';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'large' | 'small';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full-width',
    loading && 'btn-loading',
    disabled && 'btn-disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      <span className={`btn-text ${loading ? 'btn-text-hidden' : ''}`}>
        {children}
      </span>
    </button>
  );
};

/**
 * CRITICAL: First-person CTA text (90% CTR increase per research)
 * 
 * Research from ContentVerve, Unbounce, and HubSpot shows that
 * first-person CTAs ("Start My Analysis") outperform second-person
 * CTAs ("Start Your Analysis") by up to 90%.
 */
export const CTA_TEXT = {
  START_ANALYSIS: 'Start My Analysis',
  NEW_ANALYSIS: 'Run My Next Audit',
  VIEW_REPORT: 'Show My Report',
  EXPORT_REPORT: 'Export My Report',
  DISCOVER_QUESTIONS: "Find My Brand's Questions",
  TALK_TO_TEAM: 'Talk to Our Team',
  START_TRIAL: 'Start My Free Trial',
  BOOK_DEMO: 'Book My Demo',
  UPGRADE: 'Upgrade My Plan',
  SAVE_RESULTS: 'Save My Results',
} as const;

export default Button;
