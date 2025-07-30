import React, { useState } from 'react';
import { User, Shield, Bell, ChevronDown } from 'lucide-react';

const Settings: React.FC = () => {
  const [autoDelete, setAutoDelete] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [defaultExpiry, setDefaultExpiry] = useState('24 Hours');

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-500' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-700 pb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and application preferences</p>
        </div>
        <button className="btn-secondary">
          Preferences
        </button>
      </div>

      <div className="flex-1 pt-6 overflow-auto">
        <div className="max-w-4xl space-y-8">
          {/* Profile Settings */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Profile Settings</h2>
                <p className="text-gray-400">Manage your personal information and account details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue="John Doe"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  defaultValue="john@example.com"
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                <textarea
                  defaultValue="Product designer and file sharing enthusiast"
                  rows={3}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Security & Privacy */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Security & Privacy</h2>
                <p className="text-gray-400">Configure security settings and privacy preferences</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                </div>
                <button className="btn-secondary text-sm">
                  Enable 2FA
                </button>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-delete expired files</h3>
                    <p className="text-sm text-gray-400">Automatically remove files after they expire</p>
                  </div>
                  <ToggleSwitch enabled={autoDelete} onChange={setAutoDelete} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Default Link Expiry</h3>
                  <p className="text-sm text-gray-400">Shows dropdown with "24 Hours" selected</p>
                </div>
                <div className="relative">
                  <select
                    value={defaultExpiry}
                    onChange={(e) => setDefaultExpiry(e.target.value)}
                    className="input-field appearance-none pr-8"
                  >
                    <option value="1 Hour">1 Hour</option>
                    <option value="24 Hours">24 Hours</option>
                    <option value="7 Days">7 Days</option>
                    <option value="30 Days">30 Days</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Notifications</h2>
                <p className="text-gray-400">Choose how you want to be notified about activity</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-400">Receive email updates about downloads and activity</p>
                </div>
                <ToggleSwitch enabled={emailNotifications} onChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Push Notifications</h3>
                  <p className="text-sm text-gray-400">Get real-time notifications in your browser</p>
                </div>
                <ToggleSwitch enabled={pushNotifications} onChange={setPushNotifications} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;