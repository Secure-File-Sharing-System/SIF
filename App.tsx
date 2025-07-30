import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import UploadShare from './components/UploadShare';
import RecentShares from './components/RecentShares';
import Analytics from './components/Analytics';
import Settings from './components/Settings';

type ActivePage = 'upload' | 'recent' | 'analytics' | 'settings';

function App() {
  const [activePage, setActivePage] = useState<ActivePage>('upload');

  const renderContent = () => {
    switch (activePage) {
      case 'upload':
        return <UploadShare />;
      case 'recent':
        return <RecentShares />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <UploadShare />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;