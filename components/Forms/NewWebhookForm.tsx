import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface NewWebhookFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (webhookData: NewWebhookData) => Promise<void>;
}

export interface NewWebhookData {
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
}

const WEBHOOK_EVENTS = [
  {
    value: 'analysis.started',
    label: 'Analysis Started',
    description: 'When a new analysis begins',
    category: 'Analysis'
  },
  {
    value: 'analysis.completed',
    label: 'Analysis Completed',
    description: 'When an analysis finishes successfully',
    category: 'Analysis'
  },
  {
    value: 'analysis.failed',
    label: 'Analysis Failed',
    description: 'When an analysis encounters an error',
    category: 'Analysis'
  },
  {
    value: 'alert.triggered',
    label: 'Alert Triggered',
    description: 'When an alert condition is met',
    category: 'Alerts'
  },
  {
    value: 'hallucination.detected',
    label: 'Brand Misrepresentation Detected',
    description: 'When AI generates inaccurate brand information',
    category: 'Quality'
  },
  {
    value: 'scan.scheduled',
    label: 'Scan Scheduled',
    description: 'When a scheduled scan is queued',
    category: 'Automation'
  },
  {
    value: '*',
    label: 'All Events',
    description: 'Subscribe to all webhook events',
    category: 'All'
  },
];

export const NewWebhookForm: React.FC<NewWebhookFormProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<NewWebhookData>({
    name: '',
    url: '',
    events: ['analysis.completed'],
    enabled: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate URL
    try {
      new URL(formData.url);
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        name: '',
        url: '',
        events: ['analysis.completed'],
        enabled: true
      });
      onClose();
    } catch (error) {
      console.error('Error creating webhook:', error);
      alert('Failed to create webhook. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEvent = (eventValue: string) => {
    if (eventValue === '*') {
      // If "All Events" is selected, clear all other selections
      setFormData({
        ...formData,
        events: formData.events.includes('*') ? [] : ['*']
      });
    } else {
      // If any specific event is selected, remove "All Events" if it's there
      const isCurrentlySelected = formData.events.includes(eventValue);
      let newEvents = isCurrentlySelected
        ? formData.events.filter(e => e !== eventValue)
        : [...formData.events.filter(e => e !== '*'), eventValue];

      setFormData({ ...formData, events: newEvents });
    }
  };

  if (!isOpen) return null;

  const eventsByCategory = WEBHOOK_EVENTS.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof WEBHOOK_EVENTS>);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Webhook</h2>
          <button onClick={onClose} className="modal-close" aria-label="Close dialog">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>

            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Webhook Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Analysis Complete Hook"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="url" className="form-label">
                Webhook URL <span className="required">*</span>
              </label>
              <input
                type="url"
                id="url"
                className="form-input"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://api.example.com/webhooks/endpoint"
                required
              />
              <p className="form-hint">
                Enter the HTTPS URL where webhook payloads will be sent
              </p>
            </div>
          </div>

          {/* Events */}
          <div className="form-section">
            <h3 className="section-title">Events to Subscribe</h3>
            <p className="section-description">
              Select which events should trigger this webhook
            </p>

            {Object.entries(eventsByCategory).map(([category, events]) => (
              <div key={category} className="event-category">
                <h4 className="category-label">{category}</h4>
                <div className="events-list">
                  {events.map(event => (
                    <label key={event.value} className="event-option">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                      />
                      <div className="event-info">
                        <span className="event-label">{event.label}</span>
                        <span className="event-description">{event.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {formData.events.length === 0 && (
              <div className="warning-box">
                <AlertCircle className="w-5 h-5" />
                <span>Please select at least one event</span>
              </div>
            )}
          </div>

          {/* Security Info */}
          <div className="form-section">
            <div className="info-box">
              <h4 className="info-title">🔒 Webhook Security</h4>
              <ul className="info-list">
                <li>A signing secret will be automatically generated for this webhook</li>
                <li>All payloads will be signed with HMAC-SHA256</li>
                <li>Use the secret to verify webhook signatures on your server</li>
                <li>The secret will be shown after creation and can be regenerated if needed</li>
              </ul>
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
              disabled={isSubmitting || formData.events.length === 0}
            >
              {isSubmitting ? 'Creating...' : 'Create Webhook'}
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
          max-width: 650px;
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
          margin-bottom: 8px;
        }

        .section-description {
          font-size: 13px;
          color: #6b7280;
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
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-hint {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .event-category {
          margin-bottom: 20px;
        }

        .category-label {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .event-option {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .event-option:hover {
          border-color: #6366f1;
          background: #f5f3ff;
        }

        .event-option input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .event-option input[type="checkbox"]:checked ~ .event-info .event-label {
          color: #5b21b6;
          font-weight: 600;
        }

        .event-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .event-label {
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }

        .event-description {
          font-size: 12px;
          color: #6b7280;
        }

        .warning-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          color: #92400e;
          font-size: 14px;
          margin-top: 12px;
        }

        .info-box {
          padding: 16px;
          background: #eff6ff;
          border: 1px solid #93c5fd;
          border-radius: 8px;
        }

        .info-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 8px;
        }

        .info-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-list li {
          font-size: 13px;
          color: #1e40af;
          padding-left: 20px;
          position: relative;
          margin-bottom: 6px;
        }

        .info-list li:before {
          content: "•";
          position: absolute;
          left: 8px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-primary,
        .btn-cancel {
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
      `}</style>
    </div>
  );
};
