import React, { useState, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { bluetoothService, DeviceProperty, DeviceInfo } from '../services/BluetoothService';
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
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isUpdatingProperties, setIsUpdatingProperties] = useState(false);
  const [propertyUpdateStatus, setPropertyUpdateStatus] = useState('');

  // Fetch device info when device is connected
  useEffect(() => {
    const fetchDeviceInfo = async () => {
      if (connectedDevice && !deviceInfo) {
        setIsLoadingInfo(true);
        try {
          const info = await getDeviceInfo();
          if (info) {
            setDeviceInfo(info);
            const properties = bluetoothService.parseDeviceProperties(info);
            setDeviceProperties(properties);
            
            // Initialize property values from device
            const initialValues: { [key: string]: any } = {};
            properties.forEach(prop => {
              initialValues[prop.name] = prop.value;
            });
            setPropertyValues(initialValues);
          }
        } catch (err) {
          console.error('Failed to fetch device info:', err);
        } finally {
          setIsLoadingInfo(false);
        }
      }
    };

    fetchDeviceInfo();
  }, [connectedDevice, deviceInfo, getDeviceInfo]);

  const handleScanAndConnect = async () => {
    clearError();
    try {
      const device = await bluetoothService.scanForDevices();
      await connectToDevice(device);
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
                  </>
                )}
              </div>
            </div>
            <button onClick={handleDisconnect} className="btn btn-secondary">
              Disconnect
            </button>
          </div>
        )}
      </div>

      {connectedDevice && (
        <div className="provisioning-section">
          <h2>WiFi Provisioning</h2>
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

      {connectedDevice && deviceInfo && deviceProperties.length > 0 && (
        <div className="properties-section">
          <h2>Device Properties</h2>
          {isLoadingInfo ? (
            <div className="loading-message">Loading device properties...</div>
          ) : (
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
          )}

          {propertyUpdateStatus && (
            <div className="status-message">
              {propertyUpdateStatus}
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
