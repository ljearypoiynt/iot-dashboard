<!-- Use this file to provide workspace-specific custom instructions to Copilot. -->

- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements - IoT Dashboard and Provisioning App with React TypeScript and .NET Core
- [x] Scaffold the Project
- [x] Customize the Project
- [x] Install Required Extensions
- [x] Compile the Project
- [x] Create and Run Task
- [x] Launch the Project
- [x] Ensure Documentation is Complete

## Project Type
IoT Dashboard and Provisioning Application
- Frontend: React TypeScript with Web Bluetooth API
- Backend: .NET Core Web API
- Focus: ESP32 device provisioning via Bluetooth and WiFi configuration

## How to Run

### Option 1: Run Both (Recommended)
Use the VS Code Tasks menu or run: `Terminal > Run Task > Start All`
This will start both the backend and frontend simultaneously.

### Option 2: Run Individually
- **Backend**: Run task `Start Backend API` or `cd backend && dotnet run`
- **Frontend**: Run task `Start Frontend` or `cd frontend && npm start`

The frontend will be available at http://localhost:3000
The backend API will be available at http://localhost:5000

## Features Implemented
- ✅ Web Bluetooth API integration for ESP32 device discovery
- ✅ WiFi provisioning service with GATT characteristics
- ✅ Device registration and management API
- ✅ React Context for state management
- ✅ Responsive UI with modern CSS
- ✅ CORS configuration for frontend-backend communication
- ✅ OpenAPI/Swagger documentation
- ✅ TypeScript type safety throughout
