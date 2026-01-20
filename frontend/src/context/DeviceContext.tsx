import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { bluetoothService, ESP32Device, WiFiCredentials, DeviceInfo } from '../services/BluetoothService';

interface DeviceContextType {
  connectedDevice: ESP32Device | null;
  isScanning: boolean;
  error: string | null;
  scanForDevices: () => Promise<void>;
  connectToDevice: (device: ESP32Device) => Promise<void>;
  provisionWiFi: (credentials: WiFiCredentials) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  getDeviceInfo: () => Promise<DeviceInfo | null>;
  updateDeviceProperties: (properties: { [key: string]: any }) => Promise<string>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connectedDevice, setConnectedDevice] = useState<ESP32Device | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanForDevices = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    try {
      const device = await bluetoothService.scanForDevices();
      // Note: This returns the selected device, but doesn't auto-connect
      console.log('Device selected:', device.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan for devices');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const connectToDevice = useCallback(async (device: ESP32Device) => {
    setError(null);
    try {
      await bluetoothService.connectToDevice(device);
      setConnectedDevice(device);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to device');
      throw err;
    }
  }, []);

  const provisionWiFi = useCallback(async (credentials: WiFiCredentials) => {
    setError(null);
    try {
      await bluetoothService.provisionWiFi(credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to provision WiFi');
      throw err;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await bluetoothService.disconnect();
      setConnectedDevice(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getDeviceInfo = useCallback(async (): Promise<DeviceInfo | null> => {
    setError(null);
    try {
      const info = await bluetoothService.getDeviceInfo();
      // Update connected device with info
      if (connectedDevice) {
        setConnectedDevice({ ...connectedDevice, info });
      }
      return info;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get device info');
      return null;
    }
  }, [connectedDevice]);

  const updateDeviceProperties = useCallback(async (properties: { [key: string]: any }): Promise<string> => {
    setError(null);
    try {
      const status = await bluetoothService.updateDeviceProperties(properties);
      return status;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update properties');
      throw err;
    }
  }, []);

  return (
    <DeviceContext.Provider
      value={{
        connectedDevice,
        isScanning,
        error,
        scanForDevices,
        connectToDevice,
        provisionWiFi,
        disconnect,
        clearError,
        getDeviceInfo,
        updateDeviceProperties,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = (): DeviceContextType => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};
