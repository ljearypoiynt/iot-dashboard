import React, { useState, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { bluetoothService, DeviceProperty, DeviceInfo } from '../services/BluetoothService';
import { apiService, IoTDevice } from '../services/ApiService';
import './DeviceProvisioning.css';

type DeviceTab = 'sensor' | 'cloud';

const DeviceManagement: React.FC = () => {
  const { connectedDevice, isScanning, error, connectToDevice, provisionWiFi, disconnect, clearError, getDeviceInfo, updateDeviceProperties } = useDevice();
  const [activeTab, setActiveTab] = useState<DeviceTab>('sensor');
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
  
  // Device management state
  const [allDevices, setAllDevices] = useState<IoTDevice[]>([]);
  const [cloudNodes, setCloudNodes] = useState<IoTDevice[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<string>('');
  const [selectedCloudNode, setSelectedCloudNode] = useState<string>('');
  const [assignmentStatus, setAssignmentStatus] = useState('');

  // Load all devices
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const devices = await apiService.getDevices();
      setAllDevices(devices);
      
      const cloudNodesList = await apiService.getCloudNodes();
      setCloudNodes(cloudNodesList);
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  };

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
          
          // Register device with backend
          if (connectedDevice && deviceInfo) {
            const deviceType = activeTab === 'cloud' ? 'CloudNode' : 'SensorNode';
            await apiService.registerDevice({
              deviceName: connectedDevice.name,
              bluetoothId: connectedDevice.id,
              deviceType: deviceType,
              macAddress: deviceInfo.macAddress
            });
            
            // Reload devices list
            await loadDevices();
            setProvisioningStatus(`Device registered successfully as ${deviceType}`);
          }
        } catch (err) {
          console.error('Failed to complete provisioning:', err);
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

  const handleAssignSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSensor || !selectedCloudNode) {
      return;
    }

    setAssignmentStatus('Assigning sensor to cloud node...');
    
    try {
      const response = await apiService.assignSensorToCloudNode({
        sensorId: selectedSensor,
        cloudNodeId: selectedCloudNode
      });
      
      setAssignmentStatus(`Success! Cloud Node MAC: ${response.cloudNodeMacAddress}. Now update the sensor via Bluetooth with this MAC address.`);
      
      // Update the sensor device with cloud node MAC via Bluetooth if currently connected
      if (connectedDevice && connectedDevice.id === selectedSensor) {
        try {
          // Update properties to include cloudNodeMAC
          const updatedProps = {
            ...propertyValues,
            cloudNodeMAC: response.cloudNodeMacAddress
          };
          await updateDeviceProperties(updatedProps);
          setAssignmentStatus(`Sensor updated successfully with Cloud Node MAC: ${response.cloudNodeMacAddress}`);
        } catch (err) {
          setAssignmentStatus(`Assignment succeeded, but failed to update sensor via Bluetooth. Please manually update the sensor with MAC: ${response.cloudNodeMacAddress}`);
        }
      }
      
      // Reload devices
      await loadDevices();
    } catch (err) {
      setAssignmentStatus('Failed to assign sensor to cloud node');
    }
  };

  const getSensorNodes = () => {
    return allDevices.filter(d => d.deviceType === 'SensorNode');
  };

  return (
    <div className="provisioning-container">
      <h1>IoT Device Management</h1>
      
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

      {/* Tab Selection */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'sensor' ? 'active' : ''}`}
          onClick={() => setActiveTab('sensor')}
        >
          Sensor Node
        </button>
        <button 
          className={`tab ${activeTab === 'cloud' ? 'active' : ''}`}
          onClick={() => setActiveTab('cloud')}
        >
          Cloud Node
        </button>
      </div>

      <div className="device-section">
        <h2>
          {activeTab === 'sensor' ? 'Sensor Node' : 'Cloud Node'} Connection
        </h2>
        
        <p>
          {activeTab === 'sensor' 
            ? 'Connect to a sensor node to configure it and assign it to a cloud node.'
            : 'Connect to a cloud node to configure its WiFi settings. The cloud node will receive data from assigned sensors.'}
        </p>
        
        {!connectedDevice ? (
          <div>
            <button 
              onClick={handleScanAndConnect}
              disabled={isScanning || !bluetoothService.isBluetoothAvailable()}
              className="btn btn-primary"
            >
              {isScanning ? 'Scanning...' : `Scan for ${activeTab === 'sensor' ? 'Sensor' : 'Cloud'} Nodes`}
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

      {/* Sensor Assignment Section - Only show for sensor tab */}
      {activeTab === 'sensor' && (
        <div className="assignment-section">
          <h2>Assign Sensor to Cloud Node</h2>
          <p>Select a sensor and cloud node to create the assignment. This will configure the sensor to send data to the selected cloud node.</p>
          
          <form onSubmit={handleAssignSensor}>
            <div className="form-group">
              <label htmlFor="sensor">Sensor Node:</label>
              <select
                id="sensor"
                value={selectedSensor}
                onChange={(e) => setSelectedSensor(e.target.value)}
                required
              >
                <option value="">Select a sensor...</option>
                {getSensorNodes().map(device => (
                  <option key={device.id} value={device.id}>
                    {device.name} - {device.macAddress || 'No MAC'}
                    {device.cloudNodeId && ' (Already assigned)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cloudNode">Cloud Node:</label>
              <select
                id="cloudNode"
                value={selectedCloudNode}
                onChange={(e) => setSelectedCloudNode(e.target.value)}
                required
              >
                <option value="">Select a cloud node...</option>
                {cloudNodes.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.name} - {device.macAddress || 'No MAC'}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!selectedSensor || !selectedCloudNode}
              className="btn btn-primary"
            >
              Assign Sensor to Cloud Node
            </button>
          </form>

          {assignmentStatus && (
            <div className="status-message">
              {assignmentStatus}
            </div>
          )}
        </div>
      )}

      {/* Device List */}
      <div className="device-list-section">
        <h2>Registered Devices</h2>
        <button onClick={loadDevices} className="btn btn-secondary">Refresh</button>
        
        <div className="device-list">
          {allDevices.length === 0 ? (
            <p>No devices registered yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>MAC Address</th>
                  <th>Status</th>
                  <th>Cloud Node</th>
                </tr>
              </thead>
              <tbody>
                {allDevices.map(device => (
                  <tr key={device.id}>
                    <td>{device.name}</td>
                    <td>{device.deviceType}</td>
                    <td>{device.macAddress || 'N/A'}</td>
                    <td>{device.status}</td>
                    <td>
                      {device.cloudNodeId 
                        ? cloudNodes.find(cn => cn.id === device.cloudNodeId)?.name || 'Unknown'
                        : device.deviceType === 'CloudNode' 
                          ? `${device.assignedSensorIds?.length || 0} sensors`
                          : 'Not assigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="info-section">
        <h3>Instructions</h3>
        {activeTab === 'sensor' ? (
          <ol>
            <li>Power on your sensor node in provisioning mode</li>
            <li>Click "Scan for Sensor Nodes" to discover devices</li>
            <li>Configure sensor properties (tank capacity, distances, refresh rate)</li>
            <li>Enter WiFi credentials and provision the device</li>
            <li>After provisioning, assign the sensor to a cloud node below</li>
            <li>The sensor will automatically receive the cloud node's MAC address</li>
          </ol>
        ) : (
          <ol>
            <li>Power on your cloud node in provisioning mode</li>
            <li>Click "Scan for Cloud Nodes" to discover devices</li>
            <li>Enter WiFi credentials and provision the device</li>
            <li>The cloud node's MAC address will be stored for sensor assignments</li>
            <li>Switch to Sensor Node tab to assign sensors to this cloud node</li>
          </ol>
        )}
      </div>
    </div>
  );
};

export default DeviceManagement;
