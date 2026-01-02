import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface NewAlertFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (alertData: NewAlertData) => Promise<void>;
}

export interface NewAlertData {
  name: string;
  type: string;
  enabled: boolean;
  conditions: Array<{
    metric: string;
    operator: string;
    threshold: number;
  }>;
  channels: Array<{
    type: string;
    enabled: boolean;
  }>;
  throttleEnabled: boolean;
  throttleWindow?: number;
  maxAlertsPerWindow?: number;
}

const ALERT_TYPES = [
  { value: 'visibility_drop', label: 'Visibility Drop', description: 'Alert when visibility score drops' },
  { value: 'visibility_spike', label: 'Visibility Spike', description: 'Alert when visibility increases significantly' },
  { value: 'competitor_takeover', label: 'Competitor Overtake', description: 'Alert when competitors gain advantage' },
  { value: 'hallucination_detected', label: 'Brand Misrepresentation', description: 'Alert when AI generates inaccurate brand information' },
  { value: 'citation_lost', label: 'Citation Lost', description: 'Alert when content is no longer cited' },
  { value: 'citation_gained', label: 'Citation Gained', description: 'Alert when new citations appear' },
];

const METRICS = [
  { value: 'overall_visibility', label: 'Overall Visibility Score' },
  { value: 'brand_mentions', label: 'Brand Mention Rate' },
  { value: 'competitor_mentions', label: 'Competitor Mention Rate' },
  { value: 'sentiment_score', label: 'Sentiment Score' },
  { value: 'citation_rate', label: 'Citation Rate' },
  { value: 'hallucination_count', label: 'Inaccuracy Count' },
];

const OPERATORS = [
  { value: '>', label: 'Greater than (>)' },
  { value: '>=', label: 'Greater than or equal (≥)' },
  { value: '<', label: 'Less than (<)' },
  { value: '<=', label: 'Less than or equal (≤)' },
  { value: '==', label: 'Equals (=)' },
];

const CHANNEL_TYPES = [
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'slack', label: 'Slack', icon: '💬' },
  { value: 'webhook', label: 'Webhook', icon: '🔗' },
  { value: 'discord', label: 'Discord', icon: '🎮' },
  { value: 'teams', label: 'Microsoft Teams', icon: '👥' },
];

export const NewAlertForm: React.FC<NewAlertFormProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<NewAlertData>({
    name: '',
    type: 'visibility_drop',
    enabled: true,
    conditions: [{ metric: 'overall_visibility', operator: '<', threshold: 50 }],
    channels: [{ type: 'email', enabled: true }],
    throttleEnabled: true,
    throttleWindow: 60,
    maxAlertsPerWindow: 3
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        name: '',
        type: 'visibility_drop',
        enabled: true,
        conditions: [{ metric: 'overall_visibility', operator: '<', threshold: 50 }],
        channels: [{ type: 'email', enabled: true }],
        throttleEnabled: true,
        throttleWindow: 60,
        maxAlertsPerWindow: 3
      });
      onClose();
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { metric: 'overall_visibility', operator: '<', threshold: 50 }]
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    });
  };

  const updateCondition = (index: number, field: string, value: any) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({ ...formData, conditions: newConditions });
  };

  const toggleChannel = (channelType: string) => {
    const existingChannel = formData.channels.find(c => c.type === channelType);
    if (existingChannel) {
      setFormData({
        ...formData,
        channels: formData.channels.filter(c => c.type !== channelType)
      });
    } else {
      setFormData({
        ...formData,
        channels: [...formData.channels, { type: channelType, enabled: true }]
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Alert</h2>
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
                Alert Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Low Visibility Alert"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type" className="form-label">
                Alert Type <span className="required">*</span>
              </label>
              <select
                id="type"
                className="form-input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                {ALERT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditions */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">Conditions</h3>
              <button type="button" onClick={addCondition} className="btn-add">
                <Plus className="w-4 h-4" /> Add Condition
              </button>
            </div>

            {formData.conditions.map((condition, index) => (
              <div key={index} className="condition-group">
                <div className="condition-row">
                  <select
                    className="form-input"
                    value={condition.metric}
                    onChange={(e) => updateCondition(index, 'metric', e.target.value)}
                  >
                    {METRICS.map(metric => (
                      <option key={metric.value} value={metric.value}>
                        {metric.label}
                      </option>
                    ))}
                  </select>

                  <select
                    className="form-input"
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                  >
                    {OPERATORS.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    className="form-input"
                    value={condition.threshold}
                    onChange={(e) => updateCondition(index, 'threshold', parseFloat(e.target.value))}
                    placeholder="Value"
                  />

                  {formData.conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="btn-remove"
                      aria-label="Remove condition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Notification Channels */}
          <div className="form-section">
            <h3 className="section-title">Notification Channels</h3>
            <div className="channels-grid">
              {CHANNEL_TYPES.map(channel => (
                <label key={channel.value} className="channel-option">
                  <input
                    type="checkbox"
                    checked={formData.channels.some(c => c.type === channel.value)}
                    onChange={() => toggleChannel(channel.value)}
                  />
                  <span className="channel-label">
                    <span className="channel-icon">{channel.icon}</span>
                    {channel.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Throttling */}
          <div className="form-section">
            <h3 className="section-title">Throttling (Optional)</h3>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.throttleEnabled}
                  onChange={(e) => setFormData({ ...formData, throttleEnabled: e.target.checked })}
                />
                <span>Enable alert throttling to prevent notification fatigue</span>
              </label>
            </div>

            {formData.throttleEnabled && (
              <div className="throttle-config">
                <div className="form-group">
                  <label htmlFor="maxAlerts" className="form-label">
                    Max Alerts
                  </label>
                  <input
                    type="number"
                    id="maxAlerts"
                    className="form-input"
                    value={formData.maxAlertsPerWindow}
                    onChange={(e) => setFormData({ ...formData, maxAlertsPerWindow: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="throttleWindow" className="form-label">
                    Per (minutes)
                  </label>
                  <input
                    type="number"
                    id="throttleWindow"
                    className="form-input"
                    value={formData.throttleWindow}
                    onChange={(e) => setFormData({ ...formData, throttleWindow: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Alert'}
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
          max-width: 700px;
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

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
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
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .condition-group {
          margin-bottom: 12px;
        }

        .condition-row {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1fr auto;
          gap: 8px;
          align-items: center;
        }

        .btn-add {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-add:hover {
          background: #e5e7eb;
        }

        .btn-remove {
          padding: 8px;
          background: #fee2e2;
          border: none;
          border-radius: 6px;
          color: #dc2626;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-remove:hover {
          background: #fecaca;
        }

        .channels-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }

        .channel-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .channel-option:hover {
          border-color: #6366f1;
          background: #f5f3ff;
        }

        .channel-option input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .channel-option input[type="checkbox"]:checked + .channel-label {
          color: #5b21b6;
          font-weight: 600;
        }

        .channel-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #374151;
        }

        .channel-icon {
          font-size: 18px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .throttle-config {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 12px;
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
