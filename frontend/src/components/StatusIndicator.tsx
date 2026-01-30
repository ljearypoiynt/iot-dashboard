import React from 'react';
import './StatusIndicator.css';

export type StatusType = 'online' | 'offline' | 'error' | 'warning' | 'provisioning';

interface StatusIndicatorProps {
  status: StatusType;
  pulse?: boolean;
  pulseRing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  pulse = false,
  pulseRing = false,
  size = 'md',
  showLabel = false,
  label,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const statusLabels: Record<StatusType, string> = {
    online: 'Online',
    offline: 'Offline',
    error: 'Error',
    warning: 'Warning',
    provisioning: 'Provisioning',
  };

  const displayLabel = label || statusLabels[status];

  const classes = [
    'status-indicator',
    status,
    pulse && 'pulse',
    pulseRing && 'pulse-ring',
    className
  ]
    .filter(Boolean)
    .join(' ');

  if (showLabel) {
    return (
      <div className={`status-with-label ${status}`}>
        <span className={classes} role="img" aria-label={displayLabel}>
          <span className="status-sr-only">{displayLabel}</span>
        </span>
        <span className="status-label">{displayLabel}</span>
      </div>
    );
  }

  return (
    <span className={classes} role="img" aria-label={displayLabel}>
      <span className="status-sr-only">{displayLabel}</span>
    </span>
  );
};

interface StatusDotProps {
  status: StatusType;
  pulse?: boolean;
  pulseRing?: boolean;
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  pulse = false,
  pulseRing = false,
  className = '',
}) => {
  const classes = [
    'status-dot',
    status,
    pulse && 'pulse',
    pulseRing && 'pulse-ring',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const statusLabels: Record<StatusType, string> = {
    online: 'Online',
    offline: 'Offline',
    error: 'Error',
    warning: 'Warning',
    provisioning: 'Provisioning',
  };

  return (
    <span className={classes} role="img" aria-label={statusLabels[status]}>
      <span className="status-sr-only">{statusLabels[status]}</span>
    </span>
  );
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showDot = true,
  className = '',
}) => {
  const statusLabels: Record<StatusType, string> = {
    online: 'Online',
    offline: 'Offline',
    error: 'Error',
    warning: 'Warning',
    provisioning: 'Provisioning',
  };

  const displayLabel = label || statusLabels[status];

  return (
    <span className={`status-badge ${status} ${className}`}>
      {showDot && <span className={`status-dot ${status}`} />}
      {displayLabel}
    </span>
  );
};

interface ConnectionStatusProps {
  connected: boolean;
  pulse?: boolean;
  label?: string;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connected,
  pulse = false,
  label,
  className = '',
}) => {
  const status = connected ? 'online' : 'offline';
  const defaultLabel = connected ? 'Connected' : 'Disconnected';
  const displayLabel = label || defaultLabel;

  return (
    <div className={`connection-status ${connected ? 'connected' : 'disconnected'} ${className}`}>
      <span className={`status-dot ${status} ${pulse ? 'pulse-ring' : ''}`} />
      <span>{displayLabel}</span>
    </div>
  );
};

export default StatusIndicator;
