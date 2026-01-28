/**
 * Bluetooth Service for ESP32 Device Provisioning
 * Uses Web Bluetooth API to discover and connect to ESP32 devices
 */

export interface WiFiCredentials {
  ssid: string;
  password: string;
}

export interface DeviceProperty {
  name: string;
  label: string;
  type: 'number' | 'string';
  value: number | string;
  unit?: string;
}

export interface DeviceInfo {
  macAddress: string;
  deviceType: string;
  properties: { [key: string]: any };
}

export interface ESP32Device {
  id: string;
  name: string;
  device: BluetoothDevice;
  server?: BluetoothRemoteGATTServer;
  info?: DeviceInfo;
}

export class BluetoothService {
  // Standard UUIDs for ESP32 provisioning
  private readonly PROVISIONING_SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
  private readonly WIFI_SSID_CHAR_UUID = '0000ff01-0000-1000-8000-00805f9b34fb';
  private readonly WIFI_PASSWORD_CHAR_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';
  private readonly STATUS_CHAR_UUID = '0000ff03-0000-1000-8000-00805f9b34fb';
  private readonly DEVICE_INFO_CHAR_UUID = '0000ff04-0000-1000-8000-00805f9b34fb';
  private readonly PROPERTIES_CHAR_UUID = '0000ff05-0000-1000-8000-00805f9b34fb';

  private connectedDevice: ESP32Device | null = null;

  /**
   * Check if Web Bluetooth API is available
   */
  isBluetoothAvailable(): boolean {
    return 'bluetooth' in navigator;
  }

  /**
   * Scan for ESP32 devices
   */
  async scanForDevices(): Promise<ESP32Device> {
    if (!this.isBluetoothAvailable()) {
      throw new Error('Web Bluetooth API is not available in this browser');
    }

    try {
      // Temporarily accept all devices and services for debugging
      const device = await navigator.bluetooth.requestDevice({
        // filters: [
        //   { namePrefix: 'ESP32' },
        //   { namePrefix: 'IOT' }
        // ],
        acceptAllDevices: true,
        optionalServices: [this.PROVISIONING_SERVICE_UUID]
      });

      const esp32Device: ESP32Device = {
        id: device.id,
        name: device.name || 'Unknown Device',
        device: device
      };

      return esp32Device;
    } catch (error) {
      throw new Error(`Failed to scan for devices: ${error}`);
    }
  }

  /**
   * Connect to an ESP32 device
   */
  async connectToDevice(esp32Device: ESP32Device): Promise<void> {
    try {
      const server = await esp32Device.device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      esp32Device.server = server;
      this.connectedDevice = esp32Device;

      // Set up disconnect handler
      esp32Device.device.addEventListener('gattserverdisconnected', () => {
        console.log('Device disconnected');
        this.connectedDevice = null;
      });

    } catch (error) {
      throw new Error(`Failed to connect to device: ${error}`);
    }
  }

  /**
   * Send WiFi credentials to the connected device
   */
  async provisionWiFi(credentials: WiFiCredentials): Promise<void> {
    if (!this.connectedDevice || !this.connectedDevice.server) {
      throw new Error('No device connected');
    }

    try {
      const service = await this.connectedDevice.server.getPrimaryService(
        this.PROVISIONING_SERVICE_UUID
      );

      // Write SSID
      const ssidCharacteristic = await service.getCharacteristic(
        this.WIFI_SSID_CHAR_UUID
      );
      const ssidEncoder = new TextEncoder();
      await ssidCharacteristic.writeValue(ssidEncoder.encode(credentials.ssid));

      // Write Password
      const passwordCharacteristic = await service.getCharacteristic(
        this.WIFI_PASSWORD_CHAR_UUID
      );
      const passwordEncoder = new TextEncoder();
      await passwordCharacteristic.writeValue(
        passwordEncoder.encode(credentials.password)
      );

      console.log('WiFi credentials sent successfully');
    } catch (error) {
      throw new Error(`Failed to provision WiFi: ${error}`);
    }
  }

  /**
   * Get provisioning status from the device
   */
  async getProvisioningStatus(): Promise<string> {
    if (!this.connectedDevice || !this.connectedDevice.server) {
      throw new Error('No device connected');
    }

    try {
      const service = await this.connectedDevice.server.getPrimaryService(
        this.PROVISIONING_SERVICE_UUID
      );

      const statusCharacteristic = await service.getCharacteristic(
        this.STATUS_CHAR_UUID
      );

      const value = await statusCharacteristic.readValue();
      const decoder = new TextDecoder();
      return decoder.decode(value);
    } catch (error) {
      throw new Error(`Failed to read status: ${error}`);
    }
  }

  /**
   * Get device information including type and available properties
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    if (!this.connectedDevice || !this.connectedDevice.server) {
      throw new Error('No device connected');
    }

    try {
      // Ensure connection is active
      if (!this.connectedDevice.server.connected) {
        throw new Error('Device connection lost');
      }

      const service = await this.connectedDevice.server.getPrimaryService(
        this.PROVISIONING_SERVICE_UUID
      );

      const infoCharacteristic = await service.getCharacteristic(
        this.DEVICE_INFO_CHAR_UUID
      );

      // Add a small delay to ensure characteristic is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const value = await infoCharacteristic.readValue();
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(value);
      
      console.log('Raw device info received:', jsonString);
      
      const deviceInfo: DeviceInfo = JSON.parse(jsonString);
      
      // Store device info
      if (this.connectedDevice) {
        this.connectedDevice.info = deviceInfo;
      }
      
      return deviceInfo;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to read device info:', errorMsg);
      throw new Error(`Failed to read device info: ${errorMsg}`);
    }
  }

  /**
   * Parse device properties into structured format for rendering
   */
  parseDeviceProperties(deviceInfo: DeviceInfo): DeviceProperty[] {
    const properties: DeviceProperty[] = [];
    const props = deviceInfo.properties;

    // Define property metadata based on device type
    const propertyMetadata: { [key: string]: { label: string; type: 'number' | 'string'; unit?: string } } = {
      minDistance: { label: 'Minimum Distance (Full)', type: 'number', unit: 'cm' },
      maxDistance: { label: 'Maximum Distance (Empty)', type: 'number', unit: 'cm' },
      refreshRate: { label: 'Refresh Rate', type: 'number', unit: 'seconds' },
      totalLitres: { label: 'Tank Capacity', type: 'number', unit: 'litres' },
      cloudNodeMAC: { label: 'Cloud Node MAC Address', type: 'string' }
    };

    // Convert properties object to array of DeviceProperty
    for (const [key, value] of Object.entries(props)) {
      const metadata = propertyMetadata[key];
      if (metadata) {
        properties.push({
          name: key,
          label: metadata.label,
          type: metadata.type,
          value: value,
          unit: metadata.unit
        });
      }
    }

    return properties;
  }

  /**
   * Send updated properties to the device
   */
  async updateDeviceProperties(properties: { [key: string]: any }): Promise<string> {
    if (!this.connectedDevice || !this.connectedDevice.server) {
      throw new Error('No device connected');
    }

    try {
      const service = await this.connectedDevice.server.getPrimaryService(
        this.PROVISIONING_SERVICE_UUID
      );

      const propertiesCharacteristic = await service.getCharacteristic(
        this.PROPERTIES_CHAR_UUID
      );

      // Convert properties to JSON string
      const jsonString = JSON.stringify(properties);
      const encoder = new TextEncoder();
      await propertiesCharacteristic.writeValue(encoder.encode(jsonString));

      console.log('Properties sent successfully:', jsonString);
      
      // Wait a bit and check status
      await new Promise(resolve => setTimeout(resolve, 500));
      const value = await propertiesCharacteristic.readValue();
      const decoder = new TextDecoder();
      return decoder.decode(value);
    } catch (error) {
      throw new Error(`Failed to update properties: ${error}`);
    }
  }

  /**
   * Disconnect from the current device
   */
  async disconnect(): Promise<void> {
    if (this.connectedDevice?.server) {
      this.connectedDevice.server.disconnect();
      this.connectedDevice = null;
    }
  }

  /**
   * Get the currently connected device
   */
  getConnectedDevice(): ESP32Device | null {
    return this.connectedDevice;
  }

  /**
   * Debug: List all available services on the connected device
   */
  async listAvailableServices(): Promise<string[]> {
    if (!this.connectedDevice || !this.connectedDevice.server) {
      throw new Error('No device connected');
    }

    try {
      const services = await this.connectedDevice.server.getPrimaryServices();
      const serviceUUIDs = services.map(service => service.uuid);
      console.log('Available services:', serviceUUIDs);
      return serviceUUIDs;
    } catch (error) {
      throw new Error(`Failed to list services: ${error}`);
    }
  }
}

export const bluetoothService = new BluetoothService();
