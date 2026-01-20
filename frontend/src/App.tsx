import React from 'react';
import './App.css';
import { DeviceProvider } from './context/DeviceContext';
import DeviceManagement from './components/DeviceManagement';

function App() {
  return (
    <DeviceProvider>
      <div className="App">
        <DeviceManagement />
      </div>
    </DeviceProvider>
  );
}

export default App;
