import React, { useMemo } from 'react';
import { SensorData } from '../services/ApiService';

export interface GaugeWidgetConfig {
  id: string;
  title: string;
  deviceId: string;
  deviceName: string;
  dataKey: string;
  color: string;
  minValue: number;
  maxValue: number;
  unit: string;
  showTrend: boolean;
}

interface GaugeWidgetProps {
  config: GaugeWidgetConfig;
  data: SensorData[];
  onRemove: (id: string) => void;
  onEdit: (config: GaugeWidgetConfig & { widgetType: 'gauge' }) => void;
}

const GaugeWidget: React.FC<GaugeWidgetProps> = ({ config, data, onRemove, onEdit }) => {
  const latestValue = useMemo(() => {
    if (data.length === 0) return 0;
    const value = data[0]?.data[config.dataKey];
    return typeof value === 'number' ? value : 0;
  }, [data, config.dataKey]);

  const previousValue = useMemo(() => {
    if (data.length < 2) return latestValue;
    const value = data[1]?.data[config.dataKey];
    return typeof value === 'number' ? value : latestValue;
  }, [data, config.dataKey, latestValue]);

  const percentage = useMemo(() => {
    const range = config.maxValue - config.minValue;
    const normalized = latestValue - config.minValue;
    return Math.min(Math.max((normalized / range) * 100, 0), 100);
  }, [latestValue, config.minValue, config.maxValue]);

  const trend = useMemo(() => {
    if (!config.showTrend || data.length < 2) return 'neutral';
    if (latestValue > previousValue) return 'up';
    if (latestValue < previousValue) return 'down';
    return 'neutral';
  }, [latestValue, previousValue, config.showTrend, data.length]);

  const getTrendIcon = () => {
    if (!config.showTrend) return null;
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➖';
    }
  };

  const getTrendClass = () => {
    switch (trend) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      default: return 'trend-neutral';
    }
  };

  return (
    <div className="gauge-widget">
      <div className="widget-header">
        <h3>{config.title}</h3>
        <div className="widget-actions">
          <button 
            className="btn-icon" 
            onClick={() => onEdit({ ...config, widgetType: 'gauge' })}
            title="Edit Widget"
          >
            ✏️
          </button>
          <button 
            className="btn-icon" 
            onClick={() => onRemove(config.id)}
            title="Remove Widget"
          >
            ❌
          </button>
        </div>
      </div>

      <div className="gauge-container">
        <svg viewBox="0 0 200 200" className="gauge-svg">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="20"
          />
          
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke={config.color}
            strokeWidth="20"
            strokeDasharray={`${(percentage / 100) * 502.65} 502.65`}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            className="gauge-progress"
          />
        </svg>

        <div className="gauge-value">
          <div className="value-number">
            {latestValue.toFixed(1)}
            {config.unit && <span className="value-unit">{config.unit}</span>}
          </div>
          <div className="value-percentage">{percentage.toFixed(0)}%</div>
        </div>
      </div>

      <div className="gauge-footer">
        <div className="device-info">
          <span className="device-name">{config.deviceName}</span>
          <span className="data-key">{config.dataKey}</span>
        </div>
        {config.showTrend && (
          <div className={`trend-indicator ${getTrendClass()}`}>
            {getTrendIcon()}
          </div>
        )}
      </div>

      <div className="gauge-range">
        <span>{config.minValue}</span>
        <span>{config.maxValue}</span>
      </div>
    </div>
  );
};

export default GaugeWidget;
