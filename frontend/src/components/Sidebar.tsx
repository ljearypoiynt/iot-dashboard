import React from 'react';
import './Sidebar.css';
import { IoTIcon, DeviceIcon, DashboardIcon } from './Icons';

interface SidebarProps {
  currentPage: 'devices' | 'dashboard';
  onPageChange: (page: 'devices' | 'dashboard') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <IoTIcon width={24} height={24} color="#4ade80" className="logo-icon" />
          <span className="logo-text">IoT Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${currentPage === 'devices' ? 'active' : ''}`}
          onClick={() => onPageChange('devices')}
        >
          <DeviceIcon width={20} height={20} color="currentColor" className="nav-icon" />
          <span className="nav-label">Device Provisioning</span>
        </button>

        <button
          className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => onPageChange('dashboard')}
        >
          <DashboardIcon width={20} height={20} color="currentColor" className="nav-icon" />
          <span className="nav-label">Dashboard</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
