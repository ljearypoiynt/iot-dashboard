import React from 'react';
import { BluetoothIcon, ConnectIcon, SignalIcon } from './Icons';
import './Scanner.css';

export interface BluetoothDevice {
  id: string;
  name: string;
  signal: number; // Signal strength in dBm
  uuid: string;
}

interface BluetoothScannerProps {
  isScanning: boolean;
  devices: BluetoothDevice[];
  onStartScan: () => void;
  onConnect: (device: BluetoothDevice) => void;
  isConnecting?: boolean;
}

const BluetoothScanner: React.FC<BluetoothScannerProps> = ({
  isScanning,
  devices,
  onStartScan,
  onConnect,
  isConnecting = false,
}) => {
  const getSignalStrength = (dBm: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (dBm > -50) return 'excellent';
    if (dBm > -60) return 'good';
    if (dBm > -70) return 'fair';
    return 'poor';
  };

  const getSignalLabel = (strength: 'excellent' | 'good' | 'fair' | 'poor') => {
    switch (strength) {
      case 'excellent':
        return '████';
      case 'good':
        return '███░';
      case 'fair':
        return '██░░';
      case 'poor':
        return '█░░░';
      default:
        return 'N/A';
    }
  };

  return (
    <div className="scanner-container">
      <div className="scanner-header">
        <div className="scanner-title-section">
          <BluetoothIcon width={24} height={24} color="#4ade80" />
          <h3 className="scanner-title">Bluetooth Scanner</h3>
          <p className="scanner-subtitle">Scan for nearby ESP32 devices to configure</p>
        </div>
        <button
          className={`btn-scan ${isScanning ? 'scanning' : ''}`}
          onClick={onStartScan}
          disabled={isScanning}
        >
          {isScanning ? 'Scanning...' : 'Start Scan'}
        </button>
      </div>

      {isScanning && (
        <div className="scanner-progress">
          <div className="progress-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Searching for nearby devices...</p>
        </div>
      )}

      {devices.length === 0 && !isScanning ? (
        <div className="scanner-empty">
          <p>No devices found</p>
          <p className="scanner-empty-hint">Click "Start Scan" to discover nearby Bluetooth devices</p>
        </div>
      ) : (
        <div className="devices-list">
          {devices.map((device) => {
            const signalStrength = getSignalStrength(device.signal);
            return (
              <div key={device.id} className={`device-item ${signalStrength}`}>
                <div className="device-info">
                  <div className="device-main">
                    <h4 className="device-name">{device.name}</h4>
                    <p className="device-uuid">{device.uuid}</p>
                  </div>
                </div>

                <div className="device-signal">
                  <div className="signal-display">
                    <SignalIcon width={16} height={16} color="currentColor" />
                    <span className="signal-bars">{getSignalLabel(signalStrength)}</span>
                    <span className="signal-dbm">{device.signal} dBm</span>
                  </div>
                </div>

                <button
                  className="btn-connect"
                  onClick={() => onConnect(device)}
                  disabled={isConnecting}
                >
                  <ConnectIcon width={18} height={18} color="currentColor" />
                  Connect
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BluetoothScanner;
