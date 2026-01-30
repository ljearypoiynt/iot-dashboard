import React, { useState } from 'react';
import { useDevice } from '../context/DeviceContext';
import { bluetoothService, DeviceProperty, DeviceInfo } from '../services/BluetoothService';
import { apiService } from '../services/ApiService';
import './DeviceProvisioning.css';

const DeviceProvisioning: React.FC = () => {
  const { connectedDevice, isScanning, error, connectToDevice, provisionWiFi, disconnect, clearError, getDeviceInfo, updateDeviceProperties } = useDevice();
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [provisioningStatus, setProvisioningStatus] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [deviceProperties, setDeviceProperties] = useState<DeviceProperty[]>([]);
  const [propertyValues, setPropertyValues] = useState<{ [key: string]: any }>({});
  const [isUpdatingProperties, setIsUpdatingProperties] = useState(false);
  const [propertyUpdateStatus, setPropertyUpdateStatus] = useState('');

  // Removed useEffect - device info is now fetched immediately after connection in handleScanAndConnect

  const handleScanAndConnect = async () => {
    clearError();
    try {
      const device = await bluetoothService.scanForDevices();
      await connectToDevice(device);
      
      // Force immediate device info fetch after connection
      setTimeout(async () => {
        try {
          console.log('Fetching device info after connection...');
          const info = await getDeviceInfo();
          if (info) {
            setDeviceInfo(info);
            const properties = bluetoothService.parseDeviceProperties(info);
            setDeviceProperties(properties);
            
            // Initialize property values
            const initialValues: { [key: string]: any } = {};
            properties.forEach(prop => {
              initialValues[prop.name] = prop.value;
            });
            setPropertyValues(initialValues);
          }
        } catch (err) {
          console.error('Failed to fetch device info after connection:', err);
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to scan and connect:', err);
    }
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssid || !password) {
      return;
    }

    setIsProvisioning(true);
    setProvisioningStatus('Sending WiFi credentials...');
    
    try {
      await provisionWiFi({ ssid, password });
      setProvisioningStatus('WiFi credentials sent successfully!');
      
      // Wait a bit and check status
      setTimeout(async () => {
        try {
          const status = await bluetoothService.getProvisioningStatus();
          setProvisioningStatus(`Device status: ${status}`);
        } catch (err) {
          console.error('Failed to get status:', err);
        }
      }, 2000);
    } catch (err) {
      setProvisioningStatus('Failed to provision WiFi');
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setSsid('');
    setPassword('');
    setProvisioningStatus('');
    setDeviceInfo(null);
    setDeviceProperties([]);
    setPropertyValues({});
    setPropertyUpdateStatus('');
  };

  const handleDeleteDevice = async () => {
    if (!deviceInfo) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete device "${connectedDevice?.name}" (${deviceInfo.macAddress})? This will remove it from the backend database.`
    );
    
    if (!confirmDelete) return;
    
    try {
      setPropertyUpdateStatus('Deleting device...');
      
      // Call backend API to delete device by MAC address
      await apiService.deleteDevice(deviceInfo.macAddress);
      
      setPropertyUpdateStatus('Device deleted successfully!');
      // Disconnect after successful delete
      setTimeout(() => {
        handleDisconnect();
      }, 1500);
    } catch (err) {
      console.error('Failed to delete device:', err);
      setPropertyUpdateStatus(`Error deleting device: ${err instanceof Error ? err.message : 'Network error'}`);
    }
  };

  const handlePropertyChange = (propertyName: string, value: any) => {
    setPropertyValues(prev => ({
      ...prev,
      [propertyName]: value
    }));
  };

  const handleUpdateProperties = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProperties(true);
    setPropertyUpdateStatus('Updating device properties...');

    try {
      const status = await updateDeviceProperties(propertyValues);
      setPropertyUpdateStatus(`Properties updated successfully! Status: ${status}`);
      
      // Refresh device info after update
      setTimeout(async () => {
        try {
          const info = await getDeviceInfo();
          if (info) {
            setDeviceInfo(info);
            const properties = bluetoothService.parseDeviceProperties(info);
            setDeviceProperties(properties);
          }
        } catch (err) {
          console.error('Failed to refresh device info:', err);
        }
      }, 1000);
    } catch (err) {
      setPropertyUpdateStatus('Failed to update properties');
    } finally {
      setIsUpdatingProperties(false);
    }
  };

  return (
    <div className="provisioning-container">
      <h1>ESP32 Device Provisioning</h1>
      
      {!bluetoothService.isBluetoothAvailable() && (
        <div className="alert alert-error">
          Web Bluetooth API is not available in this browser. 
          Please use Chrome, Edge, or Opera on desktop.
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="device-section">
        <h2>Device Connection</h2>
        
        {!connectedDevice ? (
          <div>
            <p>Click the button below to scan for ESP32 devices via Bluetooth</p>
            <button 
              onClick={handleScanAndConnect}
              disabled={isScanning || !bluetoothService.isBluetoothAvailable()}
              className="btn btn-primary"
            >
              {isScanning ? 'Scanning...' : 'Scan for Devices'}
            </button>
          </div>
        ) : (
          <div className="connected-device">
            <div className="device-info">
              <span className="status-indicator connected"></span>
              <div>
                <strong>{connectedDevice.name}</strong>
                <p className="device-id">ID: {connectedDevice.id}</p>
                {deviceInfo && (
                  <>
                    <p className="device-mac">MAC: {deviceInfo.macAddress}</p>
                    <p className="device-type">Type: {deviceInfo.deviceType}</p>
                    {deviceInfo.wifiConnected && (
                      <>
                        <p className="device-wifi">WiFi: Connected to {deviceInfo.wifiSSID}</p>
                        <p className="device-ip">IP: {deviceInfo.wifiIP}</p>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="device-actions">
              <button onClick={handleDisconnect} className="btn btn-secondary">
                Disconnect
              </button>
              {deviceInfo && (
                <button onClick={handleDeleteDevice} className="btn btn-danger">
                  Delete Device
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {connectedDevice && (
        <div className="properties-section">
          <h2>1. Device Configuration</h2>
          {deviceInfo ? (
            deviceProperties.length > 0 ? (
              <form onSubmit={handleUpdateProperties}>
                {deviceProperties.map((prop) => (
                  <div key={prop.name} className="form-group">
                    <label htmlFor={prop.name}>
                      {prop.label}
                      {prop.unit && <span className="unit"> ({prop.unit})</span>}:
                    </label>
                    {prop.type === 'number' ? (
                      <input
                        id={prop.name}
                        type="number"
                        step="any"
                        value={propertyValues[prop.name] || ''}
                        onChange={(e) => handlePropertyChange(prop.name, parseFloat(e.target.value))}
                        required
                      />
                    ) : (
                      <input
                        id={prop.name}
                        type="text"
                        value={propertyValues[prop.name] || ''}
                        onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
                        required
                      />
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={isUpdatingProperties}
                  className="btn btn-primary"
                >
                  {isUpdatingProperties ? 'Updating...' : 'Update Properties'}
                </button>
              </form>
            ) : (
              <div className="info-message">
                <p>This device doesn't have configurable properties, or properties couldn't be loaded.</p>
                <p className="device-details">
                  <strong>Device Type:</strong> {deviceInfo.deviceType}<br/>
                  <strong>MAC Address:</strong> {deviceInfo.macAddress}
                </p>
              </div>
            )
          ) : (
            <div className="info-message">
              <p>Waiting for device to send configuration information...</p>
              <p>If device info doesn't appear, the device may not support automatic configuration.</p>
              <p>You can proceed with WiFi provisioning in the next section.</p>
            </div>
          )}

          {propertyUpdateStatus && (
            <div className="status-message">
              {propertyUpdateStatus}
            </div>
          )}
        </div>
      )}

      {connectedDevice && (
        <div className="provisioning-section">
          <h2>2. WiFi Configuration</h2>
          {deviceInfo?.wifiConnected && (
            <div className="info-message current-wifi">
              <p>📡 Currently connected to: <strong>{deviceInfo.wifiSSID}</strong></p>
              <p>You can update the WiFi connection below if needed.</p>
            </div>
          )}
          <form onSubmit={handleProvision}>
            <div className="form-group">
              <label htmlFor="ssid">WiFi SSID:</label>
              <input
                id="ssid"
                type="text"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                placeholder="Enter WiFi network name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">WiFi Password:</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter WiFi password"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isProvisioning || !ssid || !password}
              className="btn btn-primary"
            >
              {isProvisioning ? 'Provisioning...' : 'Provision Device'}
            </button>
          </form>

          {provisioningStatus && (
            <div className="status-message">
              {provisioningStatus}
            </div>
          )}
        </div>
      )}

      <div className="info-section">
        <h3>Instructions</h3>
        <ol>
          <li>Ensure your ESP32 device is powered on and in provisioning mode</li>
          <li>Click "Scan for Devices" to discover nearby ESP32 devices</li>
          <li>Select your device from the browser dialog</li>
          <li>The device will automatically send its type and available properties</li>
          <li>Configure device properties as needed (tank capacity, distances, etc.)</li>
          <li>Enter your WiFi network credentials</li>
          <li>Click "Provision Device" to send the credentials</li>
          <li>Wait for the device to connect to your WiFi network</li>
        </ol>
      </div>
    </div>
  );
};

export default DeviceProvisioning;
