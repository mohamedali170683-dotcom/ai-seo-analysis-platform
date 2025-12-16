"use client";

import React from 'react';
import './FormField.css';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
}

/**
 * FormField Component - Behavioral Science Optimized
 * 
 * Key features:
 * - Labels ABOVE fields (better comprehension per Nielsen Norman)
 * - 48px minimum input height for touch targets
 * - Clear error states with aria attributes
 * - Helper text for guidance
 * - 16px font on mobile to prevent iOS zoom
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helperText,
  disabled = false,
  autoComplete,
  className = '',
  ...props
}) => {
  const id = `field-${name}`;
  const hasError = Boolean(error);
  
  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="form-required" aria-label="required">*</span>}
      </label>
      
      {helperText && !hasError && (
        <p className="form-helper-text" id={`${id}-helper`}>
          {helperText}
        </p>
      )}
      
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`form-input ${hasError ? 'form-input-error' : ''}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        {...props}
      />
      
      {hasError && (
        <p className="form-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Select Field variant
 */
export interface SelectFieldProps extends Omit<FormFieldProps, 'type'> {
  options: { value: string; label: string }[];
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  error,
  helperText,
  disabled = false,
  className = '',
  ...props
}) => {
  const id = `field-${name}`;
  const hasError = Boolean(error);
  
  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="form-required" aria-label="required">*</span>}
      </label>
      
      {helperText && !hasError && (
        <p className="form-helper-text" id={`${id}-helper`}>
          {helperText}
        </p>
      )}
      
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`form-input ${hasError ? 'form-input-error' : ''}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {hasError && (
        <p className="form-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * TextArea Field variant
 */
export interface TextAreaFieldProps extends Omit<FormFieldProps, 'type'> {
  rows?: number;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helperText,
  disabled = false,
  rows = 4,
  className = '',
  ...props
}) => {
  const id = `field-${name}`;
  const hasError = Boolean(error);
  
  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="form-required" aria-label="required">*</span>}
      </label>
      
      {helperText && !hasError && (
        <p className="form-helper-text" id={`${id}-helper`}>
          {helperText}
        </p>
      )}
      
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className={`form-input form-textarea ${hasError ? 'form-input-error' : ''}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        {...props}
      />
      
      {hasError && (
        <p className="form-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
