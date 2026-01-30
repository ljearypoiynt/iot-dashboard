import React from 'react';

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

// IoT Logo Icon - Lightning Bolt
export const IoTIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

// Device Provisioning Icon
export const DeviceIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

// Dashboard Icon
export const DashboardIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5 12 3"></polyline>
    <line x1="12" y1="12" x2="20" y2="7.5"></line>
    <line x1="12" y1="12" x2="12" y2="21"></line>
    <line x1="12" y1="12" x2="4" y2="7.5"></line>
  </svg>
);

// Refresh Icon
export const RefreshIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
  </svg>
);

// Plus/Add Icon
export const PlusIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

// Connect/Link Icon
export const ConnectIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

// Bluetooth Icon
export const BluetoothIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="17 16 12 20 7 16"></polyline>
    <polyline points="17 8 12 4 7 8"></polyline>
    <line x1="12" y1="20" x2="12" y2="4"></line>
  </svg>
);

// Search Icon
export const SearchIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

// Menu/Hamburger Icon
export const MenuIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

// Close/X Icon
export const CloseIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Settings Icon
export const SettingsIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6m-15.78 7.78l4.24-4.24m3.08-3.08l4.24-4.24"></path>
  </svg>
);

// Check/Checkmark Icon
export const CheckIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

// Alert/Warning Icon
export const AlertIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

// Status Indicator - Online
export const StatusOnlineIcon: React.FC<IconProps> = ({ 
  width = 12, 
  height = 12, 
  color = '#4ade80',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill={color}
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
  </svg>
);

// Status Indicator - Offline
export const StatusOfflineIcon: React.FC<IconProps> = ({ 
  width = 12, 
  height = 12, 
  color = '#808080',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill={color}
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
  </svg>
);

// More/Ellipsis Icon
export const MoreIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="5" r="1"></circle>
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="12" cy="19" r="1"></circle>
  </svg>
);

// Signal/WiFi Icon
export const SignalIcon: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.94 0"></path>
    <line x1="12" y1="20" x2="12.01" y2="20"></line>
  </svg>
);
