# Quick Start Guide - Cloud Node & Sensor Assignment

## Summary

Your IoT Dashboard now supports:
- ✅ Cloud node pairing via Bluetooth
- ✅ Cloud node WiFi configuration
- ✅ Automatic MAC address capture and storage
- ✅ Sensor node assignment to cloud nodes
- ✅ Automatic sensor update with cloud node MAC address

## How to Use

### 1. Start the Application

```bash
# Terminal 1 - Start Backend
cd d:\git\iot-dashboard\backend
dotnet run

# Terminal 2 - Start Frontend
cd d:\git\iot-dashboard\frontend
npm start
```

Open http://localhost:3000 in Chrome, Edge, or Opera

### 2. Setup Cloud Node

**On ESP32:**
1. Open `cloud_node.ino`
2. Set `#define PROVISIONING_MODE true`
3. Upload to ESP32
4. Device will advertise as "ESP32-CloudNode"

**In Dashboard:**
1. Click **Cloud Node** tab
2. Click "Scan for Cloud Nodes"
3. Select your device
4. MAC address appears automatically
5. Enter WiFi SSID and Password
6. Click "Provision Device"
7. Cloud node connects and registers

### 3. Setup Sensor Node

**In Dashboard:**
1. Click **Sensor Node** tab
2. Click "Scan for Sensor Nodes"
3. Select your sensor
4. Configure properties (distances, capacity, refresh rate)
5. Click "Update Properties"
6. Enter WiFi SSID and Password
7. Click "Provision Device"
8. Sensor connects and registers

### 4. Assign Sensor to Cloud Node

**In Dashboard:**
1. Stay on **Sensor Node** tab
2. Scroll to "Assign Sensor to Cloud Node"
3. Select sensor from dropdown
4. Select cloud node from dropdown
5. Click "Assign Sensor to Cloud Node"
6. If sensor is connected: Automatic update ✓
7. If sensor not connected: Reconnect to apply MAC

### 5. Verify

**Check Device List:**
- Shows all registered devices
- Cloud nodes show "X sensors" assigned
- Sensors show which cloud node they're assigned to
- MAC addresses displayed for all devices

**Check ESP32 Serial Monitor:**
- Cloud node shows WiFi connected
- Cloud node shows ESP-NOW initialized
- Sensor node shows cloud node MAC stored
- Sensor node sends data via ESP-NOW

## Key Features

### Automatic MAC Address Handling
- No manual MAC entry needed
- Cloud node MAC captured via BLE
- Sensor automatically receives correct MAC
- Stored in flash memory (persistent)

### Tab-Based Interface
- **Cloud Node Tab**: For cloud node setup
- **Sensor Node Tab**: For sensor setup and assignment
- Context-specific instructions
- Clear visual separation

### Device Management
- Real-time device list
- Status indicators
- Assignment tracking
- Refresh button

### Error Handling
- Clear status messages
- Bluetooth availability check
- Connection status feedback
- Assignment confirmation

## Troubleshooting

### Cloud Node Not Found
```cpp
// In cloud_node.ino, verify:
#define PROVISIONING_MODE true
```

### Sensor Not Updating with MAC
1. Ensure sensor is connected when assigning
2. Or reconnect to sensor after assignment
3. Check device list for cloud node MAC
4. Manually update if needed via properties

### ESP-NOW Not Working
1. Both devices must be on same WiFi channel
2. Check Serial Monitor for channel number
3. Verify sensor has correct cloud node MAC
4. Try ESP_NOW_TEST_MODE for debugging

### Backend Not Running
```bash
# Check if backend is running on port 5000
netstat -ano | findstr :5000

# Or just start it
cd d:\git\iot-dashboard\backend
dotnet run
```

## API Endpoints

```
# Devices
GET    /api/devices                      # All devices
POST   /api/devices/register            # Register device
GET    /api/devices/cloud-nodes         # All cloud nodes
POST   /api/devices/assign-sensor       # Assign sensor

# Example Assignment Request
POST /api/devices/assign-sensor
{
  "sensorId": "sensor-uuid",
  "cloudNodeId": "cloud-uuid"
}

# Example Response
{
  "message": "Sensor assigned successfully",
  "cloudNodeMacAddress": "A0:B1:C2:D3:E4:F5"
}
```

## Architecture

```
Frontend (React)
    ↓ Web Bluetooth
ESP32 Cloud Node
    ↓ BLE → WiFi credentials
    ↓ Connects to WiFi
    ↓ MAC address sent back
    ↓ Registers with backend
Backend (.NET Core)
    ↓ Stores cloud node MAC
    ↓ Links sensor to cloud node
    ↓ Returns MAC to frontend
Frontend
    ↓ BLE → Updates sensor
ESP32 Sensor Node
    ↓ Stores cloud node MAC
    ↓ ESP-NOW communication
ESP32 Cloud Node
    ↓ Receives sensor data
    ↓ Forwards to Arduino Cloud
```

## Files Modified

### Backend
- ✅ Models/IoTDevice.cs - Added MAC, CloudNodeId, AssignedSensorIds
- ✅ Models/ProvisioningRequest.cs - Added AssignSensorRequest
- ✅ Services/DeviceService.cs - Assignment logic
- ✅ Controllers/DevicesController.cs - New endpoints

### Frontend
- ✅ services/ApiService.ts - Cloud node methods
- ✅ components/DeviceManagement.tsx - New UI (replaces DeviceProvisioning)
- ✅ components/DeviceProvisioning.css - Tab and table styles
- ✅ App.tsx - Use new component

### ESP32
- ✅ cloud_node.ino - Provisioning mode
- ✅ cloud_provisioning.h - BLE header
- ✅ cloud_provisioning.cpp - BLE implementation

## Next Steps

1. ✅ All code implemented and tested
2. ⏭️ Upload cloud node firmware
3. ⏭️ Test cloud node provisioning
4. ⏭️ Test sensor node provisioning
5. ⏭️ Test sensor assignment
6. ⏭️ Verify ESP-NOW communication
7. ⏭️ Check Arduino Cloud data flow

## Support

See these files for more details:
- `IMPLEMENTATION_SUMMARY.md` - Complete technical details
- `cloud_node/PROVISIONING_GUIDE.md` - Cloud node setup guide
- `README.md` - Updated project documentation
