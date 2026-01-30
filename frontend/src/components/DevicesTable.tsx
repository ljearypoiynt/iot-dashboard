import React from 'react';
import { MoreIcon, RefreshIcon } from './Icons';
import { StatusDot } from './StatusIndicator';
import './Table.css';

export interface IoTDevice {
  id: string;
  name: string;
  type: 'CloudNode' | 'SensorNode';
  macAddress?: string;
  status: 'Online' | 'Offline';
  cloudNode?: string;
}

interface DevicesTableProps {
  devices: IoTDevice[];
  isLoading?: boolean;
  onRefresh: () => void;
  onSelect?: (device: IoTDevice) => void;
  onDelete?: (device: IoTDevice) => void;
}

const DevicesTable: React.FC<DevicesTableProps> = ({
  devices,
  isLoading = false,
  onRefresh,
  onSelect,
  onDelete,
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CloudNode':
        return 'badge-cloudnode';
      case 'SensorNode':
        return 'badge-sensornode';
      default:
        return 'badge-default';
    }
  };

  const getStatusIndicator = (status: string) => {
    return <StatusDot status={status === 'Online' ? 'online' : 'offline'} />;
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3 className="table-title">Paired Devices</h3>
        <button
          className="btn-refresh"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh devices"
        >
          <RefreshIcon width={18} height={18} color="currentColor" />
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="table-empty">
          <p>No devices found</p>
          <p className="table-empty-hint">Create or connect a device to get started</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="devices-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>TYPE</th>
                <th>MAC ADDRESS</th>
                <th>STATUS</th>
                <th>CLOUD NODE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className={`device-row ${device.status.toLowerCase()}`}>
                  <td className="cell-name">{device.name}</td>
                  <td className="cell-type">
                    <span className={`badge ${getTypeColor(device.type)}`}>
                      {device.type}
                    </span>
                  </td>
                  <td className="cell-mac">{device.macAddress}</td>
                  <td className="cell-status">
                    <div className="status-wrapper">
                      {getStatusIndicator(device.status)}
                      <span className="status-text">{device.status}</span>
                    </div>
                  </td>
                  <td className="cell-cloud">
                    {device.cloudNode ? (
                      <span className="cloud-node">{device.cloudNode}</span>
                    ) : (
                      <span className="cloud-node unassigned">Not assigned</span>
                    )}
                  </td>
                  <td className="cell-actions">
                    <div className="action-buttons">
                      {onSelect && (
                        <button
                          className="btn-action"
                          onClick={() => onSelect(device)}
                          title="Configure device"
                        >
                          Configure
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="btn-action btn-danger"
                          onClick={() => onDelete(device)}
                          title="Delete device"
                        >
                          Delete
                        </button>
                      )}
                      <button className="btn-more" title="More options">
                        <MoreIcon width={18} height={18} color="currentColor" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DevicesTable;
