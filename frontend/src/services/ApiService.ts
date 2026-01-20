import { ESP32Device } from './BluetoothService';

const API_BASE_URL = 'http://localhost:5000/api';

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
}

export const apiService = new ApiService();
