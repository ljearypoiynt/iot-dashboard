import React, { useState, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { bluetoothService, DeviceProperty, DeviceInfo } from '../services/BluetoothService';
import { apiService, IoTDevice } from '../services/ApiService';
import './DeviceProvisioning.css';

const DeviceManagement: React.FC = () => {
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
  
  // Device management state
  const [allDevices, setAllDevices] = useState<IoTDevice[]>([]);
  const [cloudNodes, setCloudNodes] = useState<IoTDevice[]>([]);
  const [selectedCloudNode, setSelectedCloudNode] = useState<string>('');
  const [assignmentStatus, setAssignmentStatus] = useState('');
  
  // Test device creation state
  const [showTestDeviceForm, setShowTestDeviceForm] = useState(false);
  const [testDeviceType, setTestDeviceType] = useState<'CloudNode' | 'SensorNode'>('SensorNode');
  const [testDeviceName, setTestDeviceName] = useState('');
  const [testDeviceMAC, setTestDeviceMAC] = useState('');
  const [testDeviceStatus, setTestDeviceStatus] = useState('');

  // Load all devices
  useEffect(() => {
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setPropertyUpdateStatus('Connecting to device...');
        
        try {
          // Wait for Bluetooth connection to stabilize
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setPropertyUpdateStatus('Reading device information...');
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
            setPropertyUpdateStatus('Device ready for configuration');
          }
        } catch (err) {
          console.error('Failed to fetch device info:', err);
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setPropertyUpdateStatus(`Error: ${errorMsg}. You can still provision WiFi.`);
        } finally {
          setIsLoadingInfo(false);
        }
      }
    };

    fetchDeviceInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedDevice, deviceInfo]);

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
          
          // Register device with backend using the device type from deviceInfo
          if (connectedDevice && deviceInfo) {
            const deviceType = deviceInfo.deviceType; // Use device's actual type
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

  const handleRetryDeviceInfo = async () => {
    if (!connectedDevice) return;
    
    setIsLoadingInfo(true);
    setPropertyUpdateStatus('Retrying to read device information...');
    
    try {
      // Wait a bit longer this time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
        setPropertyUpdateStatus('Device ready for configuration');
      }
    } catch (err) {
      console.error('Retry failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setPropertyUpdateStatus(`Error: ${errorMsg}`);
    } finally {
      setIsLoadingInfo(false);
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

  const handleAssignSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use the connected device as the sensor
    if (!connectedDevice || !deviceInfo) {
      setAssignmentStatus('No sensor device connected');
      return;
    }
    
    if (!selectedCloudNode) {
      setAssignmentStatus('Please select a cloud node');
      return;
    }

    setAssignmentStatus('Assigning sensor to cloud node...');
    
    try {
      // First, register the device if not already registered
      const registeredDevices = await apiService.getDevices();
      let sensorDeviceId = registeredDevices.find(d => d.macAddress === deviceInfo.macAddress)?.id;
      
      if (!sensorDeviceId) {
        const response = await apiService.registerDevice({
          deviceName: connectedDevice.name,
          bluetoothId: connectedDevice.id,
          deviceType: 'SensorNode',
          macAddress: deviceInfo.macAddress
        });
        
        if (response.device) {
          sensorDeviceId = response.device.id;
        } else {
          throw new Error('Failed to register device');
        }
      }
      
      if (!sensorDeviceId) {
        throw new Error('Could not determine sensor device ID');
      }
      
      const assignResponse = await apiService.assignSensorToCloudNode({
        sensorId: sensorDeviceId,
        cloudNodeId: selectedCloudNode
      });
      
      setAssignmentStatus(`Success! Cloud Node MAC: ${assignResponse.cloudNodeMacAddress}. Updating sensor...`);
      
      // Update the sensor device with cloud node MAC via Bluetooth
      try {
        const updatedProps = {
          ...propertyValues,
          cloudNodeMAC: assignResponse.cloudNodeMacAddress
        };
        await updateDeviceProperties(updatedProps);
        setAssignmentStatus(`Sensor successfully assigned and configured with Cloud Node MAC: ${assignResponse.cloudNodeMacAddress}`);
      } catch (err) {
        setAssignmentStatus(`Assignment succeeded, but failed to update sensor via Bluetooth. Please manually update the sensor with MAC: ${assignResponse.cloudNodeMacAddress}`);
      }
      
      // Reload devices
      await loadDevices();
    } catch (err) {
      setAssignmentStatus(`Failed to assign sensor to cloud node: ${err}`);
    }
  };

  const generateRandomMAC = () => {
    const hexDigits = '0123456789ABCDEF';
    let mac = '';
    for (let i = 0; i < 6; i++) {
      if (i > 0) mac += ':';
      mac += hexDigits.charAt(Math.floor(Math.random() * 16));
      mac += hexDigits.charAt(Math.floor(Math.random() * 16));
    }
    return mac;
  };

  const handleCreateTestDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testDeviceName) {
      setTestDeviceStatus('Please enter a device name');
      return;
    }

    setTestDeviceStatus('Creating test device...');
    
    try {
      const macAddress = testDeviceMAC || generateRandomMAC();
      const bluetoothId = `TEST-${Date.now()}`;
      
      const response = await apiService.registerDevice({
        deviceName: testDeviceName,
        bluetoothId: bluetoothId,
        deviceType: testDeviceType,
        macAddress: macAddress
      });

      if (response.success) {
        setTestDeviceStatus(`✅ Test device "${testDeviceName}" created successfully!`);
        
        // Reset form
        setTestDeviceName('');
        setTestDeviceMAC('');
        
        // Reload devices
        await loadDevices();
        
        // Hide form after 2 seconds
        setTimeout(() => {
          setShowTestDeviceForm(false);
          setTestDeviceStatus('');
        }, 2000);
      } else {
        setTestDeviceStatus(`❌ Failed to create test device: ${response.message}`);
      }
    } catch (err) {
      setTestDeviceStatus(`❌ Failed to create test device: ${err}`);
    }
  };

  const handleQuickCreateTestDevices = async () => {
    setTestDeviceStatus('Creating test devices...');
    
    try {
      // Create 1 cloud node
      await apiService.registerDevice({
        deviceName: 'Test-CloudNode-01',
        bluetoothId: `TEST-CN-${Date.now()}`,
        deviceType: 'CloudNode',
        macAddress: generateRandomMAC()
      });

      // Create 2 sensor nodes
      for (let i = 1; i <= 2; i++) {
        await apiService.registerDevice({
          deviceName: `Test-Sensor-0${i}`,
          bluetoothId: `TEST-SN-${Date.now()}-${i}`,
          deviceType: 'SensorNode',
          macAddress: generateRandomMAC()
        });
      }

      setTestDeviceStatus('✅ Created 1 cloud node and 2 sensor nodes!');
      await loadDevices();
      
      setTimeout(() => {
        setTestDeviceStatus('');
      }, 3000);
    } catch (err) {
      setTestDeviceStatus(`❌ Failed to create test devices: ${err}`);
    }
  };

  const handleDeviceTypeChange = async (deviceId: string, newType: string) => {
    try {
      await apiService.updateDeviceType(deviceId, newType);
      await loadDevices();
    } catch (err) {
      console.error('Failed to update device type:', err);
      alert(`Failed to update device type: ${err}`);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this device?')) {
      return;
    }
    
    try {
      await apiService.deleteDevice(deviceId);
      await loadDevices();
    } catch (err) {
      console.error('Failed to delete device:', err);
      alert(`Failed to delete device: ${err}`);
    }
  };

  return (
    <div className="provisioning-container">
      <h1>ESP32 Config</h1>
      
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

      {/* Device List - Show paired devices first */}
      <div className="device-list-section">
        <h2>Paired Devices</h2>
        <div className="section-actions">
          <button onClick={loadDevices} className="btn btn-secondary">Refresh</button>
          <button onClick={() => setShowTestDeviceForm(!showTestDeviceForm)} className="btn btn-info">
            {showTestDeviceForm ? 'Hide Test Device Form' : '➕ Create Test Device'}
          </button>
          <button onClick={handleQuickCreateTestDevices} className="btn btn-success">
            🚀 Quick Create Test Devices
          </button>
        </div>

        {/* Test Device Creation Form */}
        {showTestDeviceForm && (
          <div className="test-device-form">
            <h3>Create Test Device</h3>
            <p>Create mock devices for testing without Bluetooth provisioning</p>
            
            <form onSubmit={handleCreateTestDevice}>
              <div className="form-group">
                <label htmlFor="testDeviceType">Device Type:</label>
                <select
                  id="testDeviceType"
                  value={testDeviceType}
                  onChange={(e) => setTestDeviceType(e.target.value as 'CloudNode' | 'SensorNode')}
                >
                  <option value="SensorNode">Sensor Node</option>
                  <option value="CloudNode">Cloud Node</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="testDeviceName">Device Name: *</label>
                <input
                  id="testDeviceName"
                  type="text"
                  placeholder={testDeviceType === 'CloudNode' ? 'e.g., Test-CloudNode-01' : 'e.g., Test-Sensor-01'}
                  value={testDeviceName}
                  onChange={(e) => setTestDeviceName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="testDeviceMAC">MAC Address (optional):</label>
                <input
                  id="testDeviceMAC"
                  type="text"
                  placeholder="Leave blank to auto-generate (e.g., AA:BB:CC:DD:EE:FF)"
                  value={testDeviceMAC}
                  onChange={(e) => setTestDeviceMAC(e.target.value.toUpperCase())}
                />
                <small>Format: XX:XX:XX:XX:XX:XX or leave blank for random MAC</small>
              </div>

              <button type="submit" className="btn btn-primary">
                Create Test Device
              </button>
            </form>

            {testDeviceStatus && (
              <div className="status-message">
                {testDeviceStatus}
              </div>
            )}
          </div>
        )}
        
        <div className="device-list">
          {allDevices.length === 0 ? (
            <p>No devices paired yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>MAC Address</th>
                  <th>Status</th>
                  <th>Cloud Node</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allDevices.map(device => (
                  <tr key={device.id}>
                    <td>{device.name}</td>
                    <td>
                      <select
                        value={device.deviceType}
                        onChange={(e) => handleDeviceTypeChange(device.id, e.target.value)}
                        className="device-type-select"
                      >
                        <option value="SensorNode">Sensor Node</option>
                        <option value="CloudNode">Cloud Node</option>
                      </select>
                    </td>
                    <td>{device.macAddress || 'N/A'}</td>
                    <td>{device.status}</td>
                    <td>
                      {device.cloudNodeId 
                        ? cloudNodes.find(cn => cn.id === device.cloudNodeId)?.name || 'Unknown'
                        : device.deviceType === 'CloudNode' 
                          ? `${device.assignedSensorIds?.length || 0} sensors`
                          : 'Not assigned'}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleDeleteDevice(device.id)}
                        className="btn btn-danger btn-sm"
                        title="Delete device"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bluetooth Scanner Section */}
      <div className="device-section">
        <div className="scanner-header">
          <h2>🔷 Bluetooth Scanner</h2>
          <p>Scan for nearby ESP32 devices to configure</p>
        </div>
        
        {!connectedDevice ? (
          <div className="scanner-content">
            <button 
              onClick={handleScanAndConnect}
              disabled={isScanning || !bluetoothService.isBluetoothAvailable()}
              className="btn btn-primary scan-button"
            >
              🔷 {isScanning ? 'Scanning...' : 'Scan for Devices'}
            </button>
            {!isScanning && (
              <p className="no-devices-message">No devices found. Tap scan to search for nearby ESP32 devices.</p>
            )}
          </div>
        ) : (
          <div className="connected-device">
            <div className="device-info">
              <span className="status-indicator connected"></span>
              <div>
                <strong>{connectedDevice.name}</strong>
                <p className="device-id">ID: {connectedDevice.id}</p>
                {deviceInfo ? (
                  <>
                    <p className="device-mac">MAC: {deviceInfo.macAddress}</p>
                    <p className="device-type">Type: {deviceInfo.deviceType}</p>
                  </>
                ) : isLoadingInfo ? (
                  <p className="device-status">Loading device info...</p>
                ) : (
                  <p className="device-status">⚠️ Device info not loaded</p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {!deviceInfo && !isLoadingInfo && (
                <button 
                  onClick={handleRetryDeviceInfo} 
                  className="btn btn-info"
                  title="Retry reading device information"
                >
                  🔄 Retry
                </button>
              )}
              <button onClick={handleDisconnect} className="btn btn-secondary">
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Show configuration error message if device is connected but info failed to load */}
      {connectedDevice && !deviceInfo && !isLoadingInfo && (
        <div className="alert alert-error">
          <p><strong>Unable to read device configuration</strong></p>
          <p>This can happen if:</p>
          <ul>
            <li>The device doesn't support the provisioning service</li>
            <li>Multiple Bluetooth operations were attempted simultaneously</li>
            <li>The connection wasn't fully established</li>
          </ul>
          <p>Try clicking the <strong>Retry</strong> button above, or disconnect and reconnect the device.</p>
        </div>
      )}

      {/* Show different content based on device type */}
      {connectedDevice && deviceInfo && deviceInfo.deviceType === 'CloudNode' && (
        <div className="provisioning-section">
          <h2>WiFi Configuration</h2>
          <p>Configure WiFi settings for the Cloud Node</p>
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
              {isProvisioning ? 'Provisioning...' : 'Set WiFi Settings'}
            </button>
          </form>

          {provisioningStatus && (
            <div className="status-message">
              {provisioningStatus}
            </div>
          )}
        </div>
      )}

      {connectedDevice && deviceInfo && deviceInfo.deviceType !== 'CloudNode' && (
        <>
          <div className="properties-section">
            <h2>Sensor Configuration</h2>
            <p>Configure sensor properties for {deviceInfo.deviceType}</p>
            {isLoadingInfo ? (
              <div className="loading-message">Loading device properties...</div>
            ) : deviceProperties.length > 0 ? (
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
                <p>No configurable properties found for this device.</p>
                <p>Device type: <strong>{deviceInfo.deviceType}</strong></p>
                <p>You can still assign it to a cloud node below.</p>
              </div>
            )}

            {propertyUpdateStatus && (
              <div className="status-message">
                {propertyUpdateStatus}
              </div>
            )}
          </div>

          <div className="assignment-section">
            <h2>Assign to Cloud Node</h2>
            <p>Select a cloud node to receive data from this sensor</p>
            
            <form onSubmit={handleAssignSensor}>
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
                disabled={!selectedCloudNode}
                className="btn btn-primary"
              >
                Assign to Cloud Node
              </button>
            </form>

            {assignmentStatus && (
              <div className="status-message">
                {assignmentStatus}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default DeviceManagement;
