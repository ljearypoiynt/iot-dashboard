import React from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SensorData } from '../services/ApiService';

export type ChartType = 'line' | 'area' | 'bar';

export interface GraphWidgetConfig {
  id: string;
  title: string;
  deviceId: string;
  deviceName: string;
  dataKey: string;
  chartType: ChartType;
  color: string;
  limit: number;
}

interface GraphWidgetProps {
  config: GraphWidgetConfig;
  data: SensorData[];
  onRemove: (id: string) => void;
  onEdit: (config: GraphWidgetConfig & { widgetType: 'graph' }) => void;
}

const GraphWidget: React.FC<GraphWidgetProps> = ({ config, data, onRemove, onEdit }) => {
  // Transform sensor data for the chart
  const chartData = data
    .slice(0, config.limit)
    .reverse()
    .map(item => ({
      time: new Date(item.receivedAt).toLocaleTimeString(),
      value: item.data[config.dataKey] || 0,
      ...item.data
    }));

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 20, left: 0, bottom: 5 }
    };

    switch (config.chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={config.color} 
              fill={config.color} 
              fillOpacity={0.6}
              name={config.dataKey}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="value" 
              fill={config.color}
              name={config.dataKey}
            />
          </BarChart>
        );
      
      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={config.color} 
              strokeWidth={2}
              name={config.dataKey}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="graph-widget">
      <div className="widget-header">
        <h3>{config.title}</h3>
        <div className="widget-actions">
          <button 
            className="btn-icon" 
            onClick={() => onEdit({ ...config, widgetType: 'graph' })}
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
      <div className="widget-info">
        <span className="device-name">{config.deviceName}</span>
        <span className="data-key">{config.dataKey}</span>
      </div>
      <div className="widget-chart">
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
      <div className="widget-footer">
        <small>Last {chartData.length} readings</small>
      </div>
    </div>
  );
};

export default GraphWidget;
