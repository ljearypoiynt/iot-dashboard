/**
 * ESP32 WiFi Provisioning via Bluetooth
 * Compatible with the IoT Dashboard Web Application
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <WiFi.h>

// BLE Service and Characteristic UUIDs - Must match frontend
#define SERVICE_UUID        "0000ff00-0000-1000-8000-00805f9b34fb"
#define SSID_CHAR_UUID      "0000ff01-0000-1000-8000-00805f9b34fb"
#define PASSWORD_CHAR_UUID  "0000ff02-0000-1000-8000-00805f9b34fb"
#define STATUS_CHAR_UUID    "0000ff03-0000-1000-8000-00805f9b34fb"

// BLE Objects
BLEServer* pServer = nullptr;
BLECharacteristic* pStatusCharacteristic = nullptr;
bool deviceConnected = false;

// WiFi Credentials
String wifiSSID = "";
String wifiPassword = "";
bool provisioningRequested = false;

// Connection callbacks
class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("BLE Client connected");
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
  
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    updateStatus("connected");
  } else {
    Serial.println("\nFailed to connect to WiFi");
    updateStatus("failed");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("Starting ESP32 BLE Provisioning...");

  // Create BLE Device
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
  pStatusCharacteristic->setValue("idle");

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  
  pAdvertising->setMaxPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("BLE Provisioning service started");
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
