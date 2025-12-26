import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NewScanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (scanData: NewScanData) => Promise<void>;
}

export interface NewScanData {
  name: string;
  brandOrKeyword: string;
  domain?: string;
  competitors: string[];
  description?: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  hour?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timezone: string;
}

export const NewScanForm: React.FC<NewScanFormProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<NewScanData>({
    name: '',
    brandOrKeyword: '',
    domain: '',
    competitors: [],
    description: '',
    frequency: 'weekly',
    hour: 9,
    dayOfWeek: 1,
    timezone: 'UTC'
  });

  const [competitorInput, setCompetitorInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        name: '',
        brandOrKeyword: '',
        domain: '',
        competitors: [],
        description: '',
        frequency: 'weekly',
        hour: 9,
        dayOfWeek: 1,
        timezone: 'UTC'
      });
      setCompetitorInput('');
      onClose();
    } catch (error) {
      console.error('Error creating scan:', error);
      alert('Failed to create scan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCompetitor = () => {
    if (competitorInput.trim() && !formData.competitors.includes(competitorInput.trim())) {
      setFormData({
        ...formData,
        competitors: [...formData.competitors, competitorInput.trim()]
      });
      setCompetitorInput('');
    }
  };

  const removeCompetitor = (competitor: string) => {
    setFormData({
      ...formData,
      competitors: formData.competitors.filter(c => c !== competitor)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Scheduled Scan</h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>

            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Scan Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Weekly Brand Visibility Check"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="brandOrKeyword" className="form-label">
                Brand/Keyword <span className="required">*</span>
              </label>
              <input
                type="text"
                id="brandOrKeyword"
                className="form-input"
                value={formData.brandOrKeyword}
                onChange={(e) => setFormData({ ...formData, brandOrKeyword: e.target.value })}
                placeholder="e.g., Nike, Running Shoes"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="domain" className="form-label">
                Domain (Optional)
              </label>
              <input
                type="text"
                id="domain"
                className="form-input"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="e.g., nike.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description (Optional)
              </label>
              <textarea
                id="description"
                className="form-input"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this scan for?"
              />
            </div>
          </div>

          {/* Competitors */}
          <div className="form-section">
            <h3 className="section-title">Competitors (Optional)</h3>
            <div className="form-group">
              <div className="competitor-input-group">
                <input
                  type="text"
                  className="form-input"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                  placeholder="Enter competitor name"
                />
                <button
                  type="button"
                  onClick={addCompetitor}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>

              {formData.competitors.length > 0 && (
                <div className="competitors-list">
                  {formData.competitors.map((competitor) => (
                    <span key={competitor} className="competitor-tag">
                      {competitor}
                      <button
                        type="button"
                        onClick={() => removeCompetitor(competitor)}
                        className="competitor-remove"
                        aria-label={`Remove ${competitor}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="form-section">
            <h3 className="section-title">Schedule</h3>

            <div className="form-group">
              <label htmlFor="frequency" className="form-label">
                Frequency <span className="required">*</span>
              </label>
              <select
                id="frequency"
                className="form-input"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                required
              >
                <option value="hourly">Every Hour</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {formData.frequency !== 'hourly' && (
              <div className="form-group">
                <label htmlFor="hour" className="form-label">
                  Time of Day
                </label>
                <select
                  id="hour"
                  className="form-input"
                  value={formData.hour}
                  onChange={(e) => setFormData({ ...formData, hour: parseInt(e.target.value) })}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.frequency === 'weekly' && (
              <div className="form-group">
                <label htmlFor="dayOfWeek" className="form-label">
                  Day of Week
                </label>
                <select
                  id="dayOfWeek"
                  className="form-input"
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>
            )}

            {formData.frequency === 'monthly' && (
              <div className="form-group">
                <label htmlFor="dayOfMonth" className="form-label">
                  Day of Month
                </label>
                <select
                  id="dayOfMonth"
                  className="form-input"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="timezone" className="form-label">
                Timezone
              </label>
              <select
                id="timezone"
                className="form-input"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Scan'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 24px 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }

        .modal-close {
          padding: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #6b7280;
          border-radius: 4px;
          transition: all 0.15s;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .modal-form {
          padding: 24px;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .required {
          color: #dc2626;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.15s;
        }

        .form-input:focus {
          outline: none;
          border-color: #6366f1;
          ring: 2px;
          ring-color: rgba(99, 102, 241, 0.2);
        }

        .competitor-input-group {
          display: flex;
          gap: 8px;
        }

        .competitors-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .competitor-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #ede9fe;
          color: #5b21b6;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 500;
        }

        .competitor-remove {
          padding: 0;
          border: none;
          background: transparent;
          color: #7c3aed;
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
          font-weight: 700;
        }

        .competitor-remove:hover {
          color: #5b21b6;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-primary,
        .btn-cancel,
        .btn-secondary {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #4f46e5;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-cancel {
          background: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #f9fafb;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          flex-shrink: 0;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
};
