/**
 * ESP32 WiFi Provisioning via Bluetooth
 * Compatible with the IoT Dashboard Web Application
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <WiFi.h>
#include <Preferences.h>

// BLE Service and Characteristic UUIDs - Must match frontend
#define SERVICE_UUID        "0000ff00-0000-1000-8000-00805f9b34fb"
#define SSID_CHAR_UUID      "0000ff01-0000-1000-8000-00805f9b34fb"
#define PASSWORD_CHAR_UUID  "0000ff02-0000-1000-8000-00805f9b34fb"
#define STATUS_CHAR_UUID    "0000ff03-0000-1000-8000-00805f9b34fb"
#define DEVICE_INFO_CHAR_UUID "0000ff04-0000-1000-8000-00805f9b34fb"
#define PROPERTIES_CHAR_UUID "0000ff05-0000-1000-8000-00805f9b34fb"

// BLE Objects
BLEServer* pServer = nullptr;
BLECharacteristic* pStatusCharacteristic = nullptr;
BLECharacteristic* pDeviceInfoCharacteristic = nullptr;
BLECharacteristic* pPropertiesCharacteristic = nullptr;
bool deviceConnected = false;

// WiFi Credentials
String wifiSSID = "";
String wifiPassword = "";
bool provisioningRequested = false;

// Device properties (customize these for your device)
float minDistance = 20.0;  // cm
float maxDistance = 120.0; // cm
uint32_t refreshRate = 300; // seconds
float totalLitres = 900.0; // litres

// Preferences for storing settings
Preferences preferences;

// Send device information to the connected client
void sendDeviceInfo() {
  if (pDeviceInfoCharacteristic != nullptr) {
    // Get MAC address
    String macAddress = WiFi.macAddress();
    
    // Check WiFi connection status
    bool isWiFiConnected = (WiFi.status() == WL_CONNECTED);
    String currentSSID = isWiFiConnected ? WiFi.SSID() : "";
    String ipAddress = isWiFiConnected ? WiFi.localIP().toString() : "";
    
    // Create JSON with device info
    String deviceInfo = "{";
    deviceInfo += "\"macAddress\":\"" + macAddress + "\",";
    deviceInfo += "\"deviceType\":\"generic_iot\",";
    deviceInfo += "\"wifiConnected\":" + String(isWiFiConnected ? "true" : "false") + ",";
    if (isWiFiConnected) {
      deviceInfo += "\"wifiSSID\":\"" + currentSSID + "\",";
      deviceInfo += "\"wifiIP\":\"" + ipAddress + "\",";
    }
    deviceInfo += "\"properties\":{";
    deviceInfo += "\"minDistance\":" + String(minDistance, 1) + ",";
    deviceInfo += "\"maxDistance\":" + String(maxDistance, 1) + ",";
    deviceInfo += "\"refreshRate\":" + String(refreshRate) + ",";
    deviceInfo += "\"totalLitres\":" + String(totalLitres, 1);
    deviceInfo += "}";
    deviceInfo += "}";
    
    pDeviceInfoCharacteristic->setValue(deviceInfo.c_str());
    pDeviceInfoCharacteristic->notify();
    
    Serial.println("Device info sent to frontend:");
    Serial.println(deviceInfo);
  }
}

// Connection callbacks
class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("BLE Client connected");
      // Send device info when client connects
      delay(500); // Small delay to ensure connection is stable
      sendDeviceInfo();
    }

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("BLE Client disconnected");
      // Restart advertising
      BLEDevice::startAdvertising();
    }
};

// SSID Characteristic callback
class SSIDCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* pCharacteristic) {
      uint8_t* data = pCharacteristic->getData();
      size_t len = pCharacteristic->getLength();
      if (len > 0) {
        wifiSSID = String((char*)data).substring(0, len);
        Serial.print("Received SSID: ");
        Serial.println(wifiSSID);
      }
    }
};

// Password Characteristic callback
class PasswordCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* pCharacteristic) {
      uint8_t* data = pCharacteristic->getData();
      size_t len = pCharacteristic->getLength();
      if (len > 0) {
        wifiPassword = String((char*)data).substring(0, len);
        Serial.println("Received Password: ****");
        
        // Trigger provisioning when both SSID and password are received
        if (wifiSSID.length() > 0) {
          provisioningRequested = true;
        }
      }
    }
};

// Properties Characteristic callback - receives updated properties from frontend
class PropertiesCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* pCharacteristic) {
      String value = pCharacteristic->getValue();
      if (value.length() > 0) {
        Serial.print("Received Properties JSON: ");
        Serial.println(value);
        
        // Parse JSON properties (simple parsing)
        int minDistIdx = value.indexOf("\"minDistance\":");
        int maxDistIdx = value.indexOf("\"maxDistance\":");
        int refreshIdx = value.indexOf("\"refreshRate\":");
        int litresIdx = value.indexOf("\"totalLitres\":");
        
        if (minDistIdx != -1) {
          int startIdx = minDistIdx + 14;
          int endIdx = value.indexOf(',', startIdx);
          if (endIdx == -1) endIdx = value.indexOf('}', startIdx);
          minDistance = value.substring(startIdx, endIdx).toFloat();
        }
        
        if (maxDistIdx != -1) {
          int startIdx = maxDistIdx + 14;
          int endIdx = value.indexOf(',', startIdx);
          if (endIdx == -1) endIdx = value.indexOf('}', startIdx);
          maxDistance = value.substring(startIdx, endIdx).toFloat();
        }
        
        if (refreshIdx != -1) {
          int startIdx = refreshIdx + 14;
          int endIdx = value.indexOf(',', startIdx);
          if (endIdx == -1) endIdx = value.indexOf('}', startIdx);
          refreshRate = value.substring(startIdx, endIdx).toInt();
        }
        
        if (litresIdx != -1) {
          int startIdx = litresIdx + 14;
          int endIdx = value.indexOf(',', startIdx);
          if (endIdx == -1) endIdx = value.indexOf('}', startIdx);
          totalLitres = value.substring(startIdx, endIdx).toFloat();
        }
        
        // Validate and save properties
        if (minDistance > 0 && maxDistance > 0 && refreshRate > 0 && totalLitres > 0 && minDistance < maxDistance) {
          // Save to persistent storage
          preferences.begin("device", false);
          preferences.putFloat("minDist", minDistance);
          preferences.putFloat("maxDist", maxDistance);
          preferences.putUInt("refresh", refreshRate);
          preferences.putFloat("litres", totalLitres);
          preferences.end();
          
          pPropertiesCharacteristic->setValue("properties_updated");
          pPropertiesCharacteristic->notify();
          Serial.println("✓ Properties saved successfully");
          
          // Send updated device info
          delay(100);
          sendDeviceInfo();
        } else {
          pPropertiesCharacteristic->setValue("properties_error");
          pPropertiesCharacteristic->notify();
          Serial.println("✗ Invalid property values received");
        }
      }
    }
};

void updateStatus(String status) {
  if (pStatusCharacteristic != nullptr) {
    pStatusCharacteristic->setValue(status.c_str());
    pStatusCharacteristic->notify();
    Serial.print("Status: ");
    Serial.println(status);
  }
}

void connectToWiFi() {
  Serial.println("Attempting to connect to WiFi...");
  updateStatus("connecting");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("MAC address: ");
    Serial.println(WiFi.macAddress());
    updateStatus("connected");
    
    // Save credentials to persistent storage
    preferences.begin("wifi", false);
    preferences.putString("ssid", wifiSSID);
    preferences.putString("password", wifiPassword);
    preferences.end();
    
    // Send updated device info with current WiFi connection
    delay(100);
    sendDeviceInfo();
  } else {
    Serial.println("\n✗ Failed to connect to WiFi");
    updateStatus("failed");
  }
}

void loadStoredSettings() {
  // Load WiFi credentials
  preferences.begin("wifi", true);
  wifiSSID = preferences.getString("ssid", "");
  wifiPassword = preferences.getString("password", "");
  preferences.end();
  
  // Load device properties
  preferences.begin("device", true);
  minDistance = preferences.getFloat("minDist", 20.0);
  maxDistance = preferences.getFloat("maxDist", 120.0);
  refreshRate = preferences.getUInt("refresh", 300);
  totalLitres = preferences.getFloat("litres", 900.0);
  preferences.end();
  
  Serial.println("Loaded stored settings:");
  Serial.print("  WiFi SSID: ");
  Serial.println(wifiSSID.length() > 0 ? wifiSSID : "none");
  Serial.print("  minDistance: ");
  Serial.println(minDistance);
  Serial.print("  maxDistance: ");
  Serial.println(maxDistance);
  Serial.print("  refreshRate: ");
  Serial.println(refreshRate);
  Serial.print("  totalLitres: ");
  Serial.println(totalLitres);
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== ESP32 BLE Provisioning ===");

  // Load stored settings from flash
  loadStoredSettings();

  // Try to connect to WiFi if credentials are stored
  if (wifiSSID.length() > 0 && wifiPassword.length() > 0) {
    Serial.println("Found stored WiFi credentials, attempting connection...");
    WiFi.mode(WIFI_STA);
    WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 10) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    Serial.println();
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("✓ Auto-connected to WiFi");
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("✗ Auto-connect failed, starting BLE provisioning");
    }
  }

  // Initialize BLE for provisioning (even if WiFi connected, for remote config)
  Serial.println("\nInitializing BLE...");
  BLEDevice::init("ESP32-IOT-Device");

  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  // Create BLE Service
  BLEService* pService = pServer->createService(SERVICE_UUID);

  // Create SSID Characteristic
  BLECharacteristic* pSSIDCharacteristic = pService->createCharacteristic(
    SSID_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pSSIDCharacteristic->setCallbacks(new SSIDCallbacks());

  // Create Password Characteristic
  BLECharacteristic* pPasswordCharacteristic = pService->createCharacteristic(
    PASSWORD_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pPasswordCharacteristic->setCallbacks(new PasswordCallbacks());

  // Create Status Characteristic
  pStatusCharacteristic = pService->createCharacteristic(
    STATUS_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pStatusCharacteristic->addDescriptor(new BLE2902());
  pStatusCharacteristic->setValue(WiFi.status() == WL_CONNECTED ? "connected" : "idle");

  // Create Device Info Characteristic
  pDeviceInfoCharacteristic = pService->createCharacteristic(
    DEVICE_INFO_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pDeviceInfoCharacteristic->addDescriptor(new BLE2902());
  pDeviceInfoCharacteristic->setValue("{}");

  // Create Properties Characteristic
  pPropertiesCharacteristic = pService->createCharacteristic(
    PROPERTIES_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY
  );
  pPropertiesCharacteristic->addDescriptor(new BLE2902());
  pPropertiesCharacteristic->setCallbacks(new PropertiesCallbacks());
  pPropertiesCharacteristic->setValue("idle");

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  
  pAdvertising->setMaxPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("✓ BLE Provisioning service started");
  Serial.print("Device Name: ");
  Serial.println("ESP32-IOT-Device");
  Serial.print("MAC Address: ");
  Serial.println(WiFi.macAddress());
  Serial.println("Waiting for a client connection...");
}

void loop() {
  // Handle WiFi provisioning
  if (provisioningRequested) {
    provisioningRequested = false;
    connectToWiFi();
  }

  // If connected to WiFi, you can add your main application logic here
  if (WiFi.status() == WL_CONNECTED) {
    // Your IoT device logic here
    // Example: Read sensors, send data to cloud, etc.
  }

  delay(100);
}
