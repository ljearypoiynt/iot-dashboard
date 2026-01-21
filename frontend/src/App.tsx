import React, { useState } from 'react';
import './App.css';
import { DeviceProvider } from './context/DeviceContext';
import DeviceManagement from './components/DeviceManagement';
import Dashboard from './components/Dashboard';

type Page = 'devices' | 'dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('devices');

  return (
    <DeviceProvider>
      <div className="App">
        <nav className="app-nav">
          <div className="nav-brand">IoT Management</div>
          <div className="nav-links">
            <button 
              className={`nav-link ${currentPage === 'devices' ? 'active' : ''}`}
              onClick={() => setCurrentPage('devices')}
            >
              📱 Device Provisioning
            </button>
            <button 
              className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentPage('dashboard')}
            >
              📊 Dashboard
            </button>
          </div>
        </nav>
        <main className="app-content">
          {currentPage === 'devices' ? <DeviceManagement /> : <Dashboard />}
        </main>
      </div>
    </DeviceProvider>
  );
}

export default App;

