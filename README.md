# IoT Dashboard and Provisioning Application

A full-stack application for provisioning and managing ESP32 IoT devices via Bluetooth and WiFi, with support for both sensor nodes and cloud nodes.

## Features

- **Bluetooth Device Discovery**: Scan for nearby ESP32 devices using Web Bluetooth API
- **WiFi Provisioning**: Send WiFi credentials to ESP32 devices via Bluetooth
- **Cloud Node Management**: Configure cloud nodes that receive data from sensors
- **Sensor Assignment**: Assign sensor nodes to specific cloud nodes
- **Device Management**: Register, track, and manage IoT devices through a REST API
- **Real-time Status**: Monitor device connection status and metadata
- **MAC Address Tracking**: Automatically capture and store device MAC addresses
- **Automated Configuration**: Sensor nodes automatically receive cloud node MAC addresses
- **Interactive Dashboard**: Visualize sensor data with customizable graph widgets
- **Multiple Chart Types**: Line, area, and bar charts for data visualization
- **Real-time Data Updates**: Dashboard auto-refreshes every 10 seconds

## Technology Stack

### Frontend
- **React** with TypeScript
- **Web Bluetooth API** for device communication
- **Recharts** for data visualization
- Modern CSS for responsive UI
- Context API for state management
- Tab-based interface for device types
- Interactive dashboard with graph widgets

### Backend
- **.NET Core 10.0** Web API
- RESTful endpoints for device management
- OpenAPI/Swagger documentation
- CORS enabled for frontend integration
- In-memory device storage (expandable to database)

## Project Structure

```
iot-dashboard/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   └── DeviceProvisioning.tsx
│   │   ├── context/         # React context providers
│   │   │   └── DeviceContext.tsx
│   │   ├── services/        # Service layer
│   │   │   ├── BluetoothService.ts
│   │   │   └── ApiService.ts
│   │   └── App.tsx
│   └── package.json
│
└── backend/                  # .NET Core Web API
    ├── Controllers/
    │   └── DevicesController.cs
    ├── Models/
    │   ├── IoTDevice.cs
    │   └── ProvisioningRequest.cs
    ├── Services/
    │   └── DeviceService.cs
    └── Program.cs
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- .NET SDK 10.0
- Chrome, Edge, or Opera browser (for Web Bluetooth API support)

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Restore dependencies:
   ```bash
   dotnet restore
   ```

3. Run the API:
   ```bash
   dotnet run
   ```

   The backend will run on `https://localhost:5001` (or `http://localhost:5000`)

## Usage

### Provisioning a Cloud Node

1. Set `PROVISIONING_MODE true` in your cloud node firmware
2. Open the IoT Dashboard at http://localhost:3000
3. Click the **Cloud Node** tab
4. Click "Scan for Cloud Nodes"
5. Select your ESP32-CloudNode from the browser dialog
6. The cloud node's MAC address will be automatically captured
7. Enter WiFi credentials and click "Provision Device"
8. The cloud node will connect to WiFi and register with the backend

### Provisioning a Sensor Node

1. Ensure sensor node is in provisioning mode
2. Click the **Sensor Node** tab
3. Click "Scan for Sensor Nodes"
4. Configure device properties (tank capacity, distances, etc.)
5. Enter WiFi credentials and provision the device
6. The sensor node will register with the backend

### Assigning Sensors to Cloud Nodes

1. After provisioning both cloud node and sensor(s)
2. Go to the **Sensor Node** tab
3. Scroll to "Assign Sensor to Cloud Node" section
4. Select a sensor node and a cloud node
5. Click "Assign Sensor to Cloud Node"

### Using the Dashboard

1. Click the **📊 Dashboard** tab in the navigation
2. Click **"+ Add Graph Widget"** to create a new visualization
3. Fill in the widget configuration:
   - **Widget Title**: Name your graph (e.g., "Temperature Monitor")
   - **Select Device**: Choose the sensor device to visualize
   - **Data Field**: Select which sensor value to display (e.g., temperature, humidity)
   - **Chart Type**: Choose Line, Area, or Bar chart
   - **Color**: Pick a color for the graph
   - **Data Points Limit**: How many recent readings to display (5-100)
4. Click **"Add Widget"** to create the visualization
5. The dashboard will auto-refresh every 10 seconds with new data
6. You can edit (✏️) or remove (❌) widgets at any time

### Testing with the Sensor Simulator

For testing the dashboard without physical devices:

1. **Ensure both backend and frontend are running:**
   - Backend: `http://localhost:5071`
   - Frontend: `http://localhost:3000`
2. Open the sensor simulator: `http://localhost:3000/sensor-simulator.html` in your browser
   - ⚠️ **Important**: Must access through the React dev server (localhost:3000), not by opening the file directly
3. Enter a device ID from your test devices (click "Refresh" in Device Provisioning to see device IDs)
4. Adjust sensor values (temperature, humidity, etc.)
5. Click **"Send Data"** to manually send readings
6. Or use **"Start Auto-Send"** to automatically send data every 5 seconds with random variations
7. Watch your dashboard update in real-time!

### Creating Test Devices

For quick testing without physical ESP32 devices or Bluetooth:

**Quick Create Method:**
1. Go to the **📱 Device Provisioning** page
2. In the "Paired Devices" section, click **"🚀 Quick Create Test Devices"**
3. This automatically creates:
   - 1 test cloud node with a random MAC address
   - 2 test sensor nodes with random MAC addresses
4. These devices are immediately available for assignment and dashboard testing

**Manual Create Method:**
1. Click **"➕ Create Test Device"** button
2. Select device type (Sensor Node or Cloud Node)
3. Enter a device name (e.g., "Test-Sensor-01" or "Test-CloudNode-01")
4. Optionally enter a MAC address (or leave blank for auto-generation)
5. Click **"Create Test Device"**
6. The device will appear in the device list immediately

**Using Test Devices:**
- Test devices work exactly like real devices in the API
- You can assign test sensors to test cloud nodes
- Use the Sensor Simulator to send data from test devices
- Create graphs and visualizations on the dashboard
- Test devices have status "Offline" by default until they send data
6. The sensor will automatically receive the cloud node's MAC address
7. Sensor data will now be sent to the assigned cloud node via ESP-NOW

### ESP32 Device Requirements

Your ESP32 firmware should implement the following Bluetooth GATT services:

- **Provisioning Service UUID**: `0000ff00-0000-1000-8000-00805f9b34fb`
  - **WiFi SSID Characteristic**: `0000ff01-0000-1000-8000-00805f9b34fb` (Write)
  - **WiFi Password Characteristic**: `0000ff02-0000-1000-8000-00805f9b34fb` (Write)
  - **Status Characteristic**: `0000ff03-0000-1000-8000-00805f9b34fb` (Read/Notify)
  - **Device Info Characteristic**: `0000ff04-0000-1000-8000-00805f9b34fb` (Read/Notify)
  - **Properties Characteristic**: `0000ff05-0000-1000-8000-00805f9b34fb` (Write)

## API Endpoints

### Devices

- `GET /api/devices` - Get all registered devices
- `GET /api/devices/{id}` - Get a specific device
- `POST /api/devices/register` - Register a new device
- `PUT /api/devices/{id}/status` - Update device status
- `PUT /api/devices/{id}/metadata` - Update device metadata
- `DELETE /api/devices/{id}` - Delete a device

### Cloud Nodes

- `GET /api/devices/cloud-nodes` - Get all cloud nodes
- `GET /api/devices/cloud-nodes/{id}/sensors` - Get sensors assigned to a cloud node
- `POST /api/devices/assign-sensor` - Assign a sensor to a cloud node

### Sensor Data

- `POST /api/devices/sensor-data` - Save sensor data from a device
- `GET /api/devices/sensor-data` - Get all sensor data (ordered by time, newest first)
- `GET /api/devices/sensor-data/device/{deviceId}?limit={n}` - Get sensor data for a specific device (optional limit)
- `GET /api/devices/sensor-data/range?startTime={start}&endTime={end}` - Get sensor data within a time range

## Device Types

### Cloud Node
- Stays powered on continuously
- Connects to WiFi and Arduino Cloud
- Receives data from sensor nodes via ESP-NOW
- Forwards data to cloud services
- Configured via BLE provisioning

### Sensor Node
- Battery powered with deep sleep
- Wakes periodically to read sensors
- Sends data to cloud node via ESP-NOW
- Configured via BLE provisioning
- Receives cloud node MAC address for communication

## Browser Compatibility

The Web Bluetooth API is supported in:
- Chrome 56+
- Edge 79+
- Opera 43+

**Note**: Web Bluetooth is not supported in Firefox or Safari. For production use, consider implementing a native mobile app or using a bridge service.

## Security Considerations

- The current implementation stores devices in memory. For production, implement a persistent database.
- WiFi credentials are transmitted over Bluetooth. Ensure your ESP32 implements proper encryption.
- Consider implementing authentication and authorization for the API.
- Use HTTPS in production environments.
- Cloud node MAC addresses are stored for sensor routing

## Future Enhancements

- [x] Device dashboard with real-time metrics
- [x] Sensor data visualization
- [ ] Device grouping and management
- [ ] Alert and notification system
- [ ] Persistent database integration (PostgreSQL, MongoDB)
- [ ] User authentication and multi-tenancy
- [ ] OTA (Over-The-Air) firmware updates
- [ ] Multiple WiFi network profiles
- [ ] Batch sensor assignment
- [ ] Cloud node health monitoring
- [ ] Sensor battery status alerts
- [ ] Export dashboard data to CSV/Excel
- [ ] Custom date range selection for historical data
- [ ] Dashboard layout customization and save/load

## Troubleshooting

### Web Bluetooth not working
- Ensure you're using a supported browser (Chrome, Edge, or Opera)
- The page must be served over HTTPS (localhost is exempt)
- Check browser permissions for Bluetooth access

### Device not found
- Ensure the ESP32 is powered on and in provisioning mode
- Check that the device name starts with "ESP32" or "IOT"
- Verify Bluetooth is enabled on your computer
- For cloud nodes, ensure PROVISIONING_MODE is set to true

### Sensor not receiving cloud node MAC
- Ensure sensor is connected via BLE when assigning
- Check that cloud node was properly provisioned first
- Verify MAC address in the device list
- Manually reconnect to sensor if needed

### ESP-NOW communication issues
- Ensure both devices are on the same WiFi channel
- Verify sensor has correct cloud node MAC address
- Check Serial Monitor for ESP-NOW initialization
- Try ESP_NOW_TEST_MODE for debugging

### Backend connection errors
- Ensure the backend is running on port 5000
- Check CORS settings if accessing from a different origin
- Verify the API_BASE_URL in ApiService.ts matches your backend

## Documentation

See `cloud_node_v2/cloud_node/PROVISIONING_GUIDE.md` for detailed cloud node setup instructions.

## License

This project is provided as-is for educational and development purposes.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
