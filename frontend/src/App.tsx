import React, { useState } from 'react';
import './App.css';
import { DeviceProvider } from './context/DeviceContext';
import DeviceManagement from './components/DeviceManagement';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';

type Page = 'devices' | 'dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('devices');

  return (
    <DeviceProvider>
      <div className="app-layout">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="main-content">
          {currentPage === 'devices' ? <DeviceManagement /> : <Dashboard />}
        </main>
      </div>
    </DeviceProvider>
  );
}

export default App;

