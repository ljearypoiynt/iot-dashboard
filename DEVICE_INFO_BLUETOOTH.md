# Device Information via Bluetooth

## Overview
This document describes the enhanced Bluetooth provisioning feature that automatically sends device details (including MAC address, WiFi status, and configurable properties) when a device connects via Bluetooth.

## Features Implemented

### 1. Automatic Device Info Transmission
When a device connects via Bluetooth, it automatically sends its details to the web application, including:
- **MAC Address**: The device's unique identifier
- **Device Type**: Type of IoT device (e.g., "tank_meter", "generic_iot")
- **WiFi Connection Status**: Whether the device is currently connected to WiFi
- **WiFi SSID**: The name of the WiFi network (if connected)
- **WiFi IP Address**: The device's current IP address (if connected)
- **Device Properties**: Configurable parameters specific to the device type

### 2. Frontend Display
The web application displays all received device information in the Device Provisioning screen:

#### Device Connection Section
- Device Name
- Device ID
- MAC Address
- Device Type
- WiFi Status (if connected)
  - Current SSID
  - IP Address

#### Device Configuration Section (Section 1)
Displays and allows editing of device-specific properties:
- **Tank Meter Devices**:
  - Minimum Distance (Full) - in cm
  - Maximum Distance (Empty) - in cm
  - Refresh Rate - in seconds
  - Tank Capacity - in litres
  - Cloud Node MAC Address

- **Generic IoT Devices**:
  - Minimum Distance - in cm
  - Maximum Distance - in cm
  - Refresh Rate - in seconds
  - Total Litres

#### WiFi Configuration Section (Section 2)
- Shows current WiFi connection if already connected
- Allows updating WiFi credentials
- SSID input field
- Password input field
- Provision button to send new credentials

### 3. ESP32 Implementation

#### WiFiProvisioning.ino (Standalone Example/Template)
Located at: `esp32/WiFiProvisioning.ino`

**Note**: This is a standalone example for reference. The actual sensor and cloud nodes use their own provisioning implementations described below.

Features:
- Sends device info automatically on BLE connection
- Includes MAC address and WiFi status
- Supports receiving property updates from the web app
- Stores WiFi credentials and device properties in flash memory
- Auto-connects to stored WiFi on startup
- Maintains BLE advertising even when WiFi connected for remote configuration

BLE Characteristics:
- `0000ff01`: WiFi SSID (Write)
- `0000ff02`: WiFi Password (Write)
- `0000ff03`: Status (Read/Notify)
- `0000ff04`: Device Info (Read/Notify) - **Sends MAC, WiFi status, properties**
- `0000ff05`: Properties (Write/Notify) - **Receives property updates**

#### ESP32_Sensor_Node (Tank Meter - ACTIVE IMPLEMENTATION)
Located at: `ESP32_Sensor_Node/provisioning.cpp` and `provisioning.h`

This is the **actual implementation used by tank meter sensor nodes**.

Enhanced features:
- Full tank meter implementation with ultrasonic sensor
- ESP-NOW communication support
- Cloud node MAC address configuration
- Persistent storage of all settings
- Comprehensive property validation
- Status notifications for all operations
- WiFi status reporting (connected, SSID, IP address)
- Deep sleep power management

Device Type: `tank_meter`

Properties:
- `minDistance`: Full tank distance in cm
- `maxDistance`: Empty tank distance in cm
- `refreshRate`: Reading interval in seconds
- `totalLitres`: Tank capacity in litres
- `cloudNodeMAC`: MAC address of the cloud node for ESP-NOW communication

#### cloud_node (Cloud Gateway - ACTIVE IMPLEMENTATION)
Located at: `cloud_node/cloud_provisioning.cpp` and `cloud_provisioning.h`

This is the **actual implementation used by the cloud gateway node**.

Features:
- Receives ESP-NOW data from sensor nodes
- Maintains persistent WiFi connection
- Arduino Cloud integration
- BLE provisioning for initial setup
- WiFi status reporting (connected, SSID, IP address)
- No configurable properties (gateway device)

Device Type: `cloud_node`

### 4. Data Flow

#### On Connection:
1. User clicks "Scan for Devices" in web app
2. Browser shows available Bluetooth devices
3. User selects ESP32 device
4. Device automatically sends info via Device Info characteristic:
```json
{
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "deviceType": "tank_meter",
  "wifiConnected": true,
  "wifiSSID": "MyNetwork",
  "wifiIP": "192.168.1.100",
  "properties": {
    "minDistance": 20.0,
    "maxDistance": 120.0,
    "refreshRate": 300,
    "totalLitres": 900.0,
    "cloudNodeMAC": "0C:4E:A0:4D:54:8C"
  }
}
```
5. Web app displays all information in organized sections

#### Updating Properties:
1. User modifies property values in the form
2. User clicks "Update Properties" button
3. Web app sends JSON to Properties characteristic:
```json
{
  "minDistance": 25.0,
  "maxDistance": 115.0,
  "refreshRate": 600,
  "totalLitres": 850.0,
  "cloudNodeMAC": "0C:4E:A0:4D:54:8C"
}
```
4. ESP32 validates and saves properties to flash
5. ESP32 sends confirmation status
6. Web app refreshes device info to show updated values

#### Updating WiFi:
1. User enters new WiFi credentials
2. User clicks "Provision Device" button
3. Web app sends SSID and password via BLE characteristics
4. ESP32 attempts WiFi connection
5. Status updates sent via Status characteristic
6. Device info updated with new WiFi status

## Usage Instructions

### For End Users:
1. Open the IoT Dashboard web application
2. Click "Scan for Devices" button
3. Select your ESP32 device from the browser dialog
4. View device information automatically displayed:
   - MAC address
   - Current WiFi connection status
   - Device type
   - Configurable properties
5. (Optional) Update device properties and click "Update Properties"
6. (Optional) Update WiFi credentials and click "Provision Device"

### For Developers:

#### Adding New Device Types:
1. Modify ESP32 code to set appropriate `deviceType` in JSON
2. Add properties to the JSON payload in `sendDeviceInfo()`
3. Update frontend `bluetoothService.ts` `propertyMetadata` with new property definitions
4. Properties will automatically render as form fields

#### Adding New Properties:
1. **ESP32 Side**: Add property to device info JSON in `sendDeviceInfo()`
2. **Frontend Side**: Add metadata in `parseDeviceProperties()`:
```typescript
const propertyMetadata = {
  myNewProperty: { 
    label: 'My New Property', 
    type: 'number', 
    unit: 'units' 
  }
};
```

## Files Modified

### ESP32 Code (Actual Devices):
- ✅ `ESP32_Sensor_Node/provisioning.cpp` - Tank meter sensor implementation (ACTIVE)
- ✅ `ESP32_Sensor_Node/provisioning.h` - Header definitions (ACTIVE)
- ✅ `cloud_node/cloud_provisioning.cpp` - Cloud gateway implementation (ACTIVE)
- ✅ `cloud_node/cloud_provisioning.h` - Header definitions (ACTIVE)

### ESP32 Code (Template/Example):
- `esp32/WiFiProvisioning.ino` - Standalone example for reference (NOT used by actual devices)

### Frontend Code:
- `frontend/src/services/bluetoothService.ts` - Added WiFi status fields to DeviceInfo interface
- `frontend/src/components/DeviceProvisioning.tsx` - Enhanced display of device details
- `frontend/src/components/DeviceProvisioning.css` - Added styling for WiFi status display

## Testing

### Test Scenarios:
1. ✅ Connect to device without WiFi configured
   - Should show MAC address
   - Should show device type
   - Should show default properties
   - Should not show WiFi status

2. ✅ Connect to device with WiFi already configured
   - Should show MAC address
   - Should show device type
   - Should show WiFi SSID and IP
   - Should show current properties

3. ✅ Update device properties
   - Values should persist after page refresh
   - ESP32 should save to flash memory

4. ✅ Update WiFi credentials
   - Device should connect to new network
   - Status should update in real-time
   - New WiFi info should display after connection

## Technical Details

### BLE Service UUID
`0000ff00-0000-1000-8000-00805f9b34fb`

### BLE Characteristics

| UUID | Name | Properties | Purpose |
|------|------|------------|---------|
| ff01 | WiFi SSID | Write | Receive WiFi network name |
| ff02 | WiFi Password | Write | Receive WiFi password |
| ff03 | Status | Read, Notify | Connection status updates |
| ff04 | Device Info | Read, Notify | Send device details (MAC, WiFi, properties) |
| ff05 | Properties | Write, Notify | Receive property updates |

### Persistent Storage
Both WiFi credentials and device properties are stored in ESP32 flash memory using the Preferences library:
- **Namespace "wifi"**: Stores SSID and password
- **Namespace "device"**: Stores device-specific properties

### Auto-Reconnect
On startup, the ESP32 attempts to connect to stored WiFi credentials before starting BLE provisioning, enabling seamless operation without requiring re-provisioning after power cycles.

## Future Enhancements
- [ ] Support for multiple WiFi network profiles
- [ ] Automatic WiFi network scanning and signal strength display
- [ ] OTA firmware updates via Bluetooth
- [ ] Device name customization
- [ ] Export/import device configurations
- [ ] Batch configuration for multiple devices
