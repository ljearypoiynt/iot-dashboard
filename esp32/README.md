# ESP32 WiFi Provisioning

This Arduino sketch implements Bluetooth Low Energy (BLE) provisioning for the ESP32, allowing WiFi credentials to be configured from the web dashboard.

## Hardware Requirements
- ESP32 Development Board (ESP32-WROOM, ESP32-DevKit, etc.)
- USB cable for programming

## Software Requirements
- Arduino IDE (1.8.x or 2.x)
- ESP32 Board Support Package

## Installation

### 1. Install Arduino IDE
Download from: https://www.arduino.cc/en/software

### 2. Add ESP32 Board Support
1. Open Arduino IDE
2. Go to **File > Preferences**
3. Add this URL to "Additional Boards Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools > Board > Boards Manager**
5. Search for "ESP32"
6. Install "esp32 by Espressif Systems"

### 3. Install Required Libraries
The following libraries are included with the ESP32 board package:
- BLEDevice
- BLEServer
- BLEUtils
- WiFi

No additional library installation needed!

## Upload Instructions

1. **Open the sketch**: Open `WiFiProvisioning.ino` in Arduino IDE

2. **Select your board**:
   - Go to **Tools > Board**
   - Select your ESP32 board (e.g., "ESP32 Dev Module")

3. **Select the port**:
   - Go to **Tools > Port**
   - Select the COM port where your ESP32 is connected

4. **Configure board settings** (if needed):
   - Flash Frequency: 80MHz
   - Upload Speed: 921600
   - Flash Mode: QIO

5. **Upload**: Click the **Upload** button (→)

6. **Open Serial Monitor**: 
   - **Tools > Serial Monitor**
   - Set baud rate to **115200**

## Usage

### After uploading:
1. The ESP32 will start advertising as **"ESP32-IOT-Device"**
2. Open your web dashboard at `http://localhost:3000`
3. Click "Scan for Devices"
4. Select your ESP32 from the list
5. Enter WiFi credentials and click "Provision"
6. Watch the Serial Monitor to see connection status

### Serial Monitor Output
You should see:
```
Starting ESP32 BLE Provisioning...
BLE Provisioning service started
Waiting for a client connection...
BLE Client connected
Received SSID: YourNetworkName
Received Password: ****
Status: connecting
WiFi connected!
IP address: 192.168.1.100
Status: connected
```

## Customization

### Change Device Name
Line 95:
```cpp
BLEDevice::init("ESP32-IOT-Device");  // Change this name
```

### Add Your IoT Logic
After WiFi is connected (line 161):
```cpp
if (WiFi.status() == WL_CONNECTED) {
  // Add your sensor reading code here
  // Add your data transmission code here
  // Add your device-specific logic here
}
```

## Troubleshooting

### "Brownout detector was triggered"
- Use a better power supply or powered USB hub
- Add a larger capacitor (100-470µF) to the 3.3V pin

### "Failed to connect to WiFi"
- Check SSID and password are correct
- Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Check WiFi signal strength

### "Device not found in Bluetooth scan"
- Ensure ESP32 is powered on
- Check Serial Monitor for "BLE Provisioning service started"
- Try restarting the ESP32
- Make sure you're using a Bluetooth-compatible browser (Chrome, Edge)

### Cannot upload sketch
- Check USB cable (some are power-only)
- Hold BOOT button while uploading
- Try different baud rate (115200)
- Check driver installation for CH340/CP2102

## Security Considerations

**⚠️ This is a basic implementation for development purposes.**

For production use, consider:
- Encrypting BLE communications
- Implementing authentication
- Storing credentials in NVS (Non-Volatile Storage)
- Adding timeout for provisioning mode
- Implementing OTA updates
- Adding TLS for cloud communication

## Next Steps

After successful provisioning:
1. Store credentials in NVS to persist across reboots
2. Implement your IoT application logic
3. Add cloud connectivity (MQTT, HTTP, etc.)
4. Implement OTA updates
5. Add deep sleep for battery-powered devices

## Support

For issues related to:
- **ESP32 Arduino**: https://github.com/espressif/arduino-esp32
- **Web Dashboard**: Check the main project README
- **ESP-IDF**: https://docs.espressif.com/projects/esp-idf/
