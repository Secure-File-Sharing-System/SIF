import React, { useState, useEffect } from 'react';
import { UploadCloud, Clock, BarChart2, Settings, HelpCircle, Upload } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: 'upload' | 'recent' | 'analytics' | 'settings') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const [isOnline, setIsOnline] = useState(true);

  // Check backend connectivity
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('/health');
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'upload', label: 'Upload & Share', icon: UploadCloud },
    { id: 'recent', label: 'Recent Shares', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const handleHelpClick = () => {
    // Open help documentation or support page
    window.open('mailto:support@secureshare.com', '_blank');
  };

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold">SecureShare</span>
          {/* Connection status indicator */}
          <div className={`w-2 h-2 rounded-full ml-auto ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
               title={isOnline ? 'Connected' : 'Disconnected'} />
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-gray-700">
        <button
          onClick={handleHelpClick}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          Help & Support
        </button>
      </div>
    </div>
  );
};

export default Sidebar;