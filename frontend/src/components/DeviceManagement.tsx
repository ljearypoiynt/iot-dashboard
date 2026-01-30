import React, { useState, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { bluetoothService, DeviceProperty, DeviceInfo } from '../services/BluetoothService';
import { apiService } from '../services/ApiService';
import PageHeader from './PageHeader';
import DevicesTable, { IoTDevice } from './DevicesTable';
import BluetoothScanner from './BluetoothScanner';
import { ConnectionStatus } from './StatusIndicator';
import { PlusIcon, RefreshIcon } from './Icons';
import './DeviceProvisioning.css';

interface ScannerDevice {
  id: string;
  name: string;
  signal: number;
  uuid: string;
}

const DeviceManagement: React.FC = () => {
  const { connectedDevice, isScanning, error, connectToDevice, provisionWiFi, disconnect, clearError, getDeviceInfo, updateDeviceProperties } = useDevice();
  
  const [allDevices, setAllDevices] = useState<IoTDevice[]>([]);
  const [scannerDevices, setScannerDevices] = useState<ScannerDevice[]>([]);
  const [cloudNodes, setCloudNodes] = useState<IoTDevice[]>([]);
  const [sensorNodes, setSensorNodes] = useState<IoTDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [deviceProperties, setDeviceProperties] = useState<DeviceProperty[]>([]);
  const [propertyValues, setPropertyValues] = useState<{ [key: string]: any }>({});
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [propertyUpdateStatus, setPropertyUpdateStatus] = useState('');
  
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [provisioningStatus, setProvisioningStatus] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  
  const [showTestDeviceForm, setShowTestDeviceForm] = useState(false);
  const [testDeviceType, setTestDeviceType] = useState<'CloudNode' | 'SensorNode'>('SensorNode');
  const [testDeviceStatus, setTestDeviceStatus] = useState('');
  const [selectedSensorId, setSelectedSensorId] = useState('');
  const [selectedCloudNodeId, setSelectedCloudNodeId] = useState('');
  const [assignmentStatus, setAssignmentStatus] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const devices = await apiService.getDevices();
      const tableDevices: IoTDevice[] = devices.map(d => ({
        id: d.id,
        name: d.name,
        status: ((d.status === 'Online' ? 'Online' : 'Offline') as 'Online' | 'Offline'),
        type: ((d.deviceType === 'CloudNode' ? 'CloudNode' : 'SensorNode') as 'CloudNode' | 'SensorNode'),
        macAddress: d.macAddress
      }));
      setAllDevices(tableDevices);
      setSensorNodes(tableDevices.filter(d => d.type === 'SensorNode'));
      
      const cloudNodesList = await apiService.getCloudNodes();
      const tableCloudNodes: IoTDevice[] = cloudNodesList.map(d => ({
        id: d.id,
        name: d.name,
        status: ((d.status === 'Online' ? 'Online' : 'Offline') as 'Online' | 'Offline'),
        type: ('CloudNode' as 'CloudNode' | 'SensorNode'),
        macAddress: d.macAddress
      }));
      setCloudNodes(tableCloudNodes);
      if (!selectedCloudNodeId && tableCloudNodes.length > 0) {
        setSelectedCloudNodeId(tableCloudNodes[0].id);
      }
      if (!selectedSensorId && tableDevices.filter(d => d.type === 'SensorNode').length > 0) {
        setSelectedSensorId(tableDevices.filter(d => d.type === 'SensorNode')[0].id);
      }
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      if (connectedDevice && !deviceInfo) {
        setIsLoadingInfo(true);
        setPropertyUpdateStatus('Connecting to device...');
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          setPropertyUpdateStatus('Reading device information...');
          const info = await getDeviceInfo();
          
          if (info) {
            setDeviceInfo(info);
            const properties = bluetoothService.parseDeviceProperties(info);
            setDeviceProperties(properties);
            
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
  }, [connectedDevice, deviceInfo, getDeviceInfo]);

  const handleScan = async () => {
    clearError();
    try {
      const device = await bluetoothService.scanForDevices();
      await connectToDevice(device);
    } catch (err) {
      console.error('Failed to scan:', err);
    }
  };

  const handleBluetoothConnect = async (device: ScannerDevice) => {
    try {
      clearError();
      const btDevice = {
        id: device.id,
        name: device.name,
        uuids: [device.uuid]
      } as any;
      await connectToDevice(btDevice);
    } catch (err) {
      console.error('Failed to connect:', err);
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

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssid || !password) return;

    setIsProvisioning(true);
    setProvisioningStatus('Sending WiFi credentials...');
    
    try {
      await provisionWiFi({ ssid, password });
      setProvisioningStatus('WiFi credentials sent successfully!');
      
      setTimeout(async () => {
        try {
          const status = await bluetoothService.getProvisioningStatus();
          setProvisioningStatus(`Device status: ${status}`);
          
          if (connectedDevice && deviceInfo) {
            const deviceType = deviceInfo.deviceType;
            await apiService.registerDevice({
              deviceName: connectedDevice.name,
              bluetoothId: connectedDevice.id,
              deviceType: deviceType,
              macAddress: deviceInfo.macAddress
            });
            
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

  const handleRefresh = () => {
    loadDevices();
  };

  const handleAssignSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignmentStatus('');

    if (!selectedSensorId || !selectedCloudNodeId) {
      setAssignmentStatus('Please select both a sensor and a cloud node.');
      return;
    }

    setIsAssigning(true);
    setAssignmentStatus('Assigning sensor to cloud node...');

    try {
      const result = await apiService.assignSensorToCloudNode({
        sensorId: selectedSensorId,
        cloudNodeId: selectedCloudNodeId
      });

      let statusMessage = `Assigned successfully. Cloud node MAC: ${result.cloudNodeMacAddress}`;

      if (connectedDevice && deviceInfo?.deviceType === 'SensorNode') {
        try {
          await updateDeviceProperties({ cloudNodeMAC: result.cloudNodeMacAddress });
          statusMessage += ' (Updated connected sensor via BLE)';
        } catch (err) {
          statusMessage += ' (BLE update failed; reconnect to sensor to apply MAC)';
        }
      }

      setAssignmentStatus(statusMessage);
      await loadDevices();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign sensor.';
      setAssignmentStatus(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteDevice = async (device: IoTDevice) => {
    if (window.confirm(`Are you sure you want to delete ${device.name}?`)) {
      try {
        setAllDevices(prev => prev.filter(d => d.id !== device.id));
      } catch (err) {
        console.error('Failed to delete device:', err);
      }
    }
  };

  const handleSelectDevice = (device: IoTDevice) => {
    console.log('Select device:', device);
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

  const generateTestData = async () => {
    const mac = generateRandomMAC();
    
    try {
      await apiService.registerDevice({
        deviceName: `Test-${testDeviceType}-${Date.now().toString().slice(-3)}`,
        bluetoothId: `test-${Date.now()}`,
        deviceType: testDeviceType,
        macAddress: mac
      });
      
      setTestDeviceStatus('Device created successfully!');
      await loadDevices();
      setTimeout(() => setShowTestDeviceForm(false), 2000);
    } catch (err) {
      setTestDeviceStatus(`Error: ${err}`);
    }
  };

  return (
    <div className="device-management">
      <PageHeader
        title="ESP32 Configuration"
        subtitle="Manage and configure your paired IoT devices"
      >
        <button className="btn-primary" onClick={handleRefresh} disabled={isLoadingDevices}>
          <RefreshIcon width={16} height={16} />
          Refresh
        </button>
        <button className="btn-primary" onClick={() => setShowTestDeviceForm(!showTestDeviceForm)}>
          <PlusIcon width={16} height={16} />
          Create Device
        </button>
        <button className="btn-primary" onClick={() => generateTestData()}>
          Quick Create
        </button>
      </PageHeader>

      <div className="device-management-content">
        <div className="devices-grid">
          <div className="grid-column">
            <DevicesTable
              devices={allDevices}
              isLoading={isLoadingDevices}
              onRefresh={handleRefresh}
              onSelect={handleSelectDevice}
              onDelete={handleDeleteDevice}
            />
          </div>

          <div className="grid-column">
            <BluetoothScanner
              isScanning={isScanning}
              devices={scannerDevices}
              onStartScan={handleScan}
              onConnect={handleBluetoothConnect}
              isConnecting={isLoadingInfo}
            />
          </div>
        </div>

        {connectedDevice && (
          <div className="connected-device-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0 }}>Connected Device: {connectedDevice.name}</h3>
                <ConnectionStatus connected={true} pulse={true} />
              </div>
              <button className="btn-secondary" onClick={handleDisconnect}>Disconnect</button>
            </div>
            
            {propertyUpdateStatus && (
              <div className="status-message">{propertyUpdateStatus}</div>
            )}

            <form onSubmit={handleProvision}>
              <h4>WiFi Provisioning</h4>
              <input
                type="text"
                placeholder="SSID"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" disabled={isProvisioning}>
                {isProvisioning ? 'Provisioning...' : 'Provision WiFi'}
              </button>
              {provisioningStatus && <p>{provisioningStatus}</p>}
            </form>
          </div>
        )}

        {showTestDeviceForm && (
          <div className="test-device-form">
            <h3>Create Test Device</h3>
            <select 
              value={testDeviceType}
              onChange={(e) => setTestDeviceType(e.target.value as 'CloudNode' | 'SensorNode')}
            >
              <option value="SensorNode">Sensor Node</option>
              <option value="CloudNode">Cloud Node</option>
            </select>
            <button onClick={generateTestData}>Generate</button>
            {testDeviceStatus && <p>{testDeviceStatus}</p>}
          </div>
        )}

        <div className="assignment-section">
          <h3>Assign Sensor to Cloud Node</h3>
          <form onSubmit={handleAssignSensor}>
            <div className="form-group">
              <label htmlFor="sensorSelect">Sensor Node</label>
              <select
                id="sensorSelect"
                value={selectedSensorId}
                onChange={(e) => setSelectedSensorId(e.target.value)}
                disabled={sensorNodes.length === 0}
              >
                {sensorNodes.length === 0 && <option value="">No sensors available</option>}
                {sensorNodes.map(sensor => (
                  <option key={sensor.id} value={sensor.id}>
                    {sensor.name}{sensor.macAddress ? ` (${sensor.macAddress})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cloudNodeSelect">Cloud Node</label>
              <select
                id="cloudNodeSelect"
                value={selectedCloudNodeId}
                onChange={(e) => setSelectedCloudNodeId(e.target.value)}
                disabled={cloudNodes.length === 0}
              >
                {cloudNodes.length === 0 && <option value="">No cloud nodes available</option>}
                {cloudNodes.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.name}{node.macAddress ? ` (${node.macAddress})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn btn-primary" type="submit" disabled={isAssigning}>
              {isAssigning ? 'Assigning...' : 'Assign Sensor to Cloud Node'}
            </button>
          </form>

          {assignmentStatus && <div className="status-message">{assignmentStatus}</div>}
        </div>
      </div>
    </div>
  );
};

export default DeviceManagement;
