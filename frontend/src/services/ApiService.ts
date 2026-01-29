const runtimeApiBaseUrl = window.__APP_CONFIG__?.API_BASE_URL;
const API_BASE_URL = (runtimeApiBaseUrl ?? process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:5071/api').replace(/\/$/, '');

export interface IoTDevice {
  id: string;
  name: string;
  deviceType: string;
  bluetoothId: string;
  ipAddress?: string;
  macAddress?: string;
  registeredAt: string;
  lastSeen: string;
  status: 'Offline' | 'Online' | 'Provisioning' | 'Error';
  metadata: Record<string, string>;
  cloudNodeId?: string;
  assignedSensorIds?: string[];
}

export interface ProvisioningRequest {
  deviceName: string;
  bluetoothId: string;
  deviceType: string;
  macAddress?: string;
}

export interface ProvisioningResponse {
  success: boolean;
  message: string;
  device?: IoTDevice;
}

export interface AssignSensorRequest {
  sensorId: string;
  cloudNodeId: string;
}

export interface AssignSensorResponse {
  message: string;
  cloudNodeMacAddress: string;
}

export interface SensorData {
  id: string;
  deviceId: string;
  deviceName: string;
  receivedAt: string;
  data: Record<string, any>;
}

export interface SensorDataRequest {
  deviceId: string;
  data: Record<string, any>;
}

export interface SensorDataResponse {
  success: boolean;
  message: string;
  data?: SensorData;
}

class ApiService {
  /**
   * Register a device with the backend
   */
  async registerDevice(request: ProvisioningRequest): Promise<ProvisioningResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to register device:', error);
      throw error;
    }
  }

  /**
   * Get all registered devices
   */
  async getDevices(): Promise<IoTDevice[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/devices`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get devices:', error);
      throw error;
    }
  }

  /**
   * Get a specific device by ID
   */
  async getDevice(id: string): Promise<IoTDevice> {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get device:', error);
      throw error;
    }
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(id: string, status: IoTDevice['status']): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(status)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to update device status:', error);
      throw error;
    }
  }

  /**
   * Update device metadata
   */
  async updateDeviceMetadata(id: string, metadata: Record<string, string>): Promise<IoTDevice> {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/${id}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update device metadata:', error);
      throw error;
    }
  }

  /**
   * Delete a device
   */
  async deleteDevice(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete device:', error);
      throw error;
    }
  }

  /**
   * Assign a sensor to a cloud node
   */
  async assignSensorToCloudNode(request: AssignSensorRequest): Promise<AssignSensorResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/assign-sensor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to assign sensor to cloud node:', error);
      throw error;
    }
  }

  /**
   * Get all cloud nodes
   */
  async getCloudNodes(): Promise<IoTDevice[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/cloud-nodes`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get cloud nodes:', error);
      throw error;
    }
  }

  /**
   * Get all sensors assigned to a cloud node
   */
  async getSensorsForCloudNode(cloudNodeId: string): Promise<IoTDevice[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/cloud-nodes/${cloudNodeId}/sensors`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get sensors for cloud node:', error);
      throw error;
    }
  }

  /**
   * Get all sensor data
   */
  async getAllSensorData(): Promise<SensorData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/sensor-data`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get sensor data:', error);
      throw error;
    }
  }

  /**
   * Get sensor data for a specific device
   */
  async getSensorDataByDevice(deviceId: string, limit?: number): Promise<SensorData[]> {
    try {
      const url = limit 
        ? `${API_BASE_URL}/devices/sensor-data/device/${deviceId}?limit=${limit}`
        : `${API_BASE_URL}/devices/sensor-data/device/${deviceId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get sensor data by device:', error);
      throw error;
    }
  }

  /**
   * Get sensor data within a time range
   */
  async getSensorDataByTimeRange(startTime: Date, endTime: Date): Promise<SensorData[]> {
    try {
      const start = startTime.toISOString();
      const end = endTime.toISOString();
      const response = await fetch(
        `${API_BASE_URL}/devices/sensor-data/range?startTime=${start}&endTime=${end}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get sensor data by time range:', error);
      throw error;
    }
  }

  /**
   * Save sensor data
   */
  async saveSensorData(request: SensorDataRequest): Promise<SensorDataResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/sensor-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to save sensor data:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
