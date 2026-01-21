import React, { useState, useEffect } from 'react';
import { apiService, IoTDevice, SensorData } from '../services/ApiService';
import GraphWidget, { GraphWidgetConfig, ChartType } from './GraphWidget';
import GaugeWidget, { GaugeWidgetConfig } from './GaugeWidget';
import './Dashboard.css';

type WidgetType = 'graph' | 'gauge';
type AnyWidgetConfig = (GraphWidgetConfig & { widgetType: 'graph' }) | (GaugeWidgetConfig & { widgetType: 'gauge' });

interface WidgetForm {
  widgetType: WidgetType;
  title: string;
  deviceId: string;
  dataKey: string;
  chartType: ChartType;
  color: string;
  limit: number;
  minValue: number;
  maxValue: number;
  unit: string;
  showTrend: boolean;
}

const Dashboard: React.FC = () => {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [sensorDataMap, setSensorDataMap] = useState<Map<string, SensorData[]>>(new Map());
  const [widgets, setWidgets] = useState<AnyWidgetConfig[]>([]);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [editingWidget, setEditingWidget] = useState<AnyWidgetConfig | null>(null);
  const [formData, setFormData] = useState<WidgetForm>({
    widgetType: 'graph',
    title: '',
    deviceId: '',
    dataKey: '',
    chartType: 'line',
    color: '#8884d8',
    limit: 20,
    minValue: 0,
    maxValue: 100,
    unit: '',
    showTrend: true
  });
  const [availableDataKeys, setAvailableDataKeys] = useState<string[]>([]);

  // Load devices on mount
  useEffect(() => {
    loadDevices();
  }, []);

  // Auto-refresh sensor data every 10 seconds
  useEffect(() => {
    if (widgets.length > 0) {
      loadSensorData();
      const interval = setInterval(loadSensorData, 10000);
      return () => clearInterval(interval);
    }
  }, [widgets]);

  const loadDevices = async () => {
    try {
      const allDevices = await apiService.getDevices();
      // Filter to only show sensor nodes
      const sensorDevices = allDevices.filter(d => 
        d.deviceType === 'SensorNode' || d.deviceType === 'Sensor'
      );
      setDevices(sensorDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const loadSensorData = async () => {
    const dataMap = new Map<string, SensorData[]>();
    
    for (const widget of widgets) {
      try {
        const limit = widget.widgetType === 'graph' ? widget.limit : 10;
        const data = await apiService.getSensorDataByDevice(widget.deviceId, limit);
        dataMap.set(widget.deviceId, data);
      } catch (error) {
        console.error(`Failed to load data for device ${widget.deviceId}:`, error);
      }
    }
    
    setSensorDataMap(dataMap);
  };

  const handleDeviceChange = async (deviceId: string) => {
    setFormData({ ...formData, deviceId, dataKey: '' });
    setAvailableDataKeys([]);
    
    if (!deviceId) return;
    
    // Load sample data to get available keys
    try {
      const data = await apiService.getSensorDataByDevice(deviceId, 1);
      if (data.length > 0 && data[0].data) {
        const keys = Object.keys(data[0].data);
        setAvailableDataKeys(keys);
        if (keys.length > 0) {
          setFormData(prev => ({ ...prev, deviceId, dataKey: keys[0] }));
        }
      }
    } catch (error) {
      console.error('Failed to load data keys:', error);
    }
  };

  const handleAddWidget = () => {
    if (!formData.deviceId || !formData.dataKey || !formData.title) {
      alert('Please fill in all required fields');
      return;
    }

    const device = devices.find(d => d.id === formData.deviceId);
    if (!device) return;

    if (editingWidget) {
      // Update existing widget
      setWidgets(widgets.map(w => {
        if (w.id !== editingWidget.id) return w;
        
        if (formData.widgetType === 'gauge') {
          return {
            id: w.id,
            widgetType: 'gauge' as const,
            title: formData.title,
            deviceId: formData.deviceId,
            deviceName: device.name,
            dataKey: formData.dataKey,
            color: formData.color,
            minValue: formData.minValue,
            maxValue: formData.maxValue,
            unit: formData.unit,
            showTrend: formData.showTrend
          };
        } else {
          return {
            id: w.id,
            widgetType: 'graph' as const,
            title: formData.title,
            deviceId: formData.deviceId,
            deviceName: device.name,
            dataKey: formData.dataKey,
            chartType: formData.chartType,
            color: formData.color,
            limit: formData.limit
          };
        }
      }));
      setEditingWidget(null);
    } else {
      // Add new widget
      if (formData.widgetType === 'gauge') {
        const newWidget: GaugeWidgetConfig & { widgetType: 'gauge' } = {
          id: Date.now().toString(),
          widgetType: 'gauge',
          title: formData.title,
          deviceId: formData.deviceId,
          deviceName: device.name,
          dataKey: formData.dataKey,
          color: formData.color,
          minValue: formData.minValue,
          maxValue: formData.maxValue,
          unit: formData.unit,
          showTrend: formData.showTrend
        };
        setWidgets([...widgets, newWidget]);
      } else {
        const newWidget: GraphWidgetConfig & { widgetType: 'graph' } = {
          id: Date.now().toString(),
          widgetType: 'graph',
          title: formData.title,
          deviceId: formData.deviceId,
          deviceName: device.name,
          dataKey: formData.dataKey,
          chartType: formData.chartType,
          color: formData.color,
          limit: formData.limit
        };
        setWidgets([...widgets, newWidget]);
      }
    }

    // Reset form
    setFormData({
      widgetType: 'graph',
      title: '',
      deviceId: '',
      dataKey: '',
      chartType: 'line',
      color: '#8884d8',
      limit: 20,
      minValue: 0,
      maxValue: 100,
      unit: '',
      showTrend: true
    });
    setAvailableDataKeys([]);
    setShowAddWidget(false);
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const handleEditWidget = (widget: AnyWidgetConfig) => {
    setEditingWidget(widget);
    
    if (widget.widgetType === 'gauge') {
      setFormData({
        widgetType: 'gauge',
        title: widget.title,
        deviceId: widget.deviceId,
        dataKey: widget.dataKey,
        color: widget.color,
        chartType: 'line',
        limit: 20,
        minValue: widget.minValue,
        maxValue: widget.maxValue,
        unit: widget.unit,
        showTrend: widget.showTrend
      });
    } else {
      setFormData({
        widgetType: 'graph',
        title: widget.title,
        deviceId: widget.deviceId,
        dataKey: widget.dataKey,
        chartType: widget.chartType,
        color: widget.color,
        limit: widget.limit,
        minValue: 0,
        maxValue: 100,
        unit: '',
        showTrend: true
      });
    }
    
    handleDeviceChange(widget.deviceId);
    setShowAddWidget(true);
  };

  const cancelEdit = () => {
    setEditingWidget(null);
    setFormData({
      widgetType: 'graph',
      title: '',
      deviceId: '',
      dataKey: '',
      chartType: 'line',
      color: '#8884d8',
      limit: 20,
      minValue: 0,
      maxValue: 100,
      unit: '',
      showTrend: true
    });
    setAvailableDataKeys([]);
    setShowAddWidget(false);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📊 IoT Dashboard</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddWidget(!showAddWidget)}
        >
          {showAddWidget ? '✕ Cancel' : '+ Add Widget'}
        </button>
      </div>

      {showAddWidget && (
        <div className="add-widget-form">
          <h2>{editingWidget ? 'Edit Widget' : 'Add New Widget'}</h2>
          
          <div className="form-group">
            <label>Widget Type *</label>
            <select
              value={formData.widgetType}
              onChange={(e) => setFormData({ ...formData, widgetType: e.target.value as WidgetType })}
            >
              <option value="graph">Graph (Line/Area/Bar Chart)</option>
              <option value="gauge">Gauge (Circular Progress)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Widget Title *</label>
            <input
              type="text"
              placeholder="e.g., Temperature Monitor"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Select Device *</label>
            <select
              value={formData.deviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
            >
              <option value="">-- Select a device --</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.status})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Data Field *</label>
            {availableDataKeys.length > 0 ? (
              <select
                value={formData.dataKey}
                onChange={(e) => setFormData({ ...formData, dataKey: e.target.value })}
              >
                <option value="">-- Select data field --</option>
                {availableDataKeys.map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="e.g., temperature, humidity, pressure"
                  value={formData.dataKey}
                  onChange={(e) => setFormData({ ...formData, dataKey: e.target.value })}
                />
                <small style={{ color: '#9ca3af', display: 'block', marginTop: '5px' }}>
                  {formData.deviceId 
                    ? 'No data found for this device yet. Enter the field name manually (e.g., temperature)'
                    : 'Select a device first'}
                </small>
              </>
            )}
          </div>

          {formData.widgetType === 'graph' && (
            <>
              <div className="form-group">
                <label>Chart Type</label>
                <select
                  value={formData.chartType}
                  onChange={(e) => setFormData({ ...formData, chartType: e.target.value as ChartType })}
                >
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="bar">Bar Chart</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Data Points Limit</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}

          {formData.widgetType === 'gauge' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Min Value</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.minValue}
                    onChange={(e) => setFormData({ ...formData, minValue: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Max Value</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.maxValue}
                    onChange={(e) => setFormData({ ...formData, maxValue: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Unit (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., °C, %, m"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formData.showTrend}
                    onChange={(e) => setFormData({ ...formData, showTrend: e.target.checked })}
                  />
                  Show Trend Indicator
                </label>
              </div>
            </>
          )}

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={cancelEdit}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddWidget}>
              {editingWidget ? 'Update Widget' : 'Add Widget'}
            </button>
          </div>
        </div>
      )}

      <div className="widgets-container">
        {widgets.length === 0 ? (
          <div className="empty-state">
            <p>📈 No widgets yet. Click "Add Widget" to create your first visualization!</p>
          </div>
        ) : (
          widgets.map(widget => {
            if (widget.widgetType === 'gauge') {
              return (
                <GaugeWidget
                  key={widget.id}
                  config={widget}
                  data={sensorDataMap.get(widget.deviceId) || []}
                  onRemove={handleRemoveWidget}
                  onEdit={handleEditWidget}
                />
              );
            } else {
              return (
                <GraphWidget
                  key={widget.id}
                  config={widget}
                  data={sensorDataMap.get(widget.deviceId) || []}
                  onRemove={handleRemoveWidget}
                  onEdit={handleEditWidget}
                />
              );
            }
          })
        )}
      </div>
    </div>
  );
};

export default Dashboard;
