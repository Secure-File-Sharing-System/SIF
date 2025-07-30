import React from 'react';
import { TrendingUp, Download, Users, Clock } from 'lucide-react';

const Analytics: React.FC = () => {
  const stats = [
    {
      title: 'Total Downloads',
      value: '2,847',
      change: '+12% from last month',
      icon: Download,
      color: 'text-blue-400'
    },
    {
      title: 'Files Shared',
      value: '394',
      change: '+8% from last month',
      icon: TrendingUp,
      color: 'text-green-400'
    },
    {
      title: 'Unique Visitors',
      value: '1,249',
      change: '-3% from last month',
      icon: Users,
      color: 'text-purple-400'
    },
    {
      title: 'Avg. Downloads/File',
      value: '7.2',
      change: '+6% from last month',
      icon: Clock,
      color: 'text-orange-400'
    }
  ];

  const countries = [
    { name: 'United States', percentage: 35 },
    { name: 'United Kingdom', percentage: 23 },
    { name: 'Germany', percentage: 18 },
    { name: 'Canada', percentage: 12 }
  ];

  const securityStats = [
    { label: 'Password Protected', value: '68%', color: 'bg-green-500' },
    { label: 'Expired Links', value: '12%', color: 'bg-red-500' }
  ];

  const expiryStats = [
    { label: '24 Hours', value: '45%' },
    { label: '7 Days', value: '32%' },
    { label: '30 Days', value: '23%' }
  ];

  const storageStats = [
    { label: 'Used 12.4 GB', value: '67%', color: 'bg-blue-500' },
    { label: '4.6 GB remaining', value: '33%', color: 'bg-gray-600' }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-700 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Analytics</h1>
          <p className="text-gray-400">Track your file sharing performance and usage statistics</p>
        </div>
        <div className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm">
          +12% this week
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-300 mb-1">{stat.title}</h3>
                <p className="text-sm text-green-400">{stat.change}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Download & Upload Trends</h3>
            <p className="text-sm text-gray-400 mb-4">Daily activity over the past week</p>
            <div className="bg-gray-700 rounded-lg h-48 flex items-center justify-center">
              <span className="text-gray-500">Chart Area</span>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">File Types Distribution</h3>
            <p className="text-sm text-gray-400 mb-4">Breakdown of shared file types</p>
            <div className="bg-gray-700 rounded-lg h-48 flex items-center justify-center">
              <span className="text-gray-500">Chart Area</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Daily Traffic Pattern</h3>
            <p className="text-sm text-gray-400 mb-4">Visitor activity throughout the day</p>
            <div className="bg-gray-700 rounded-lg h-48 flex items-center justify-center">
              <span className="text-gray-500">Chart Area</span>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Top Countries</h3>
            <p className="text-sm text-gray-400 mb-4">Downloads by country</p>
            <div className="space-y-3">
              {countries.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-300">{country.name}</span>
                  </div>
                  <span className="text-sm text-gray-400">{country.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Security
            </h3>
            <div className="space-y-4">
              {securityStats.map((stat, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-300">{stat.label}</span>
                    <span className="text-sm font-medium">{stat.value}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`${stat.color} h-2 rounded-full`}
                      style={{ width: stat.value }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Link Expiry
            </h3>
            <div className="space-y-3">
              {expiryStats.map((stat, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-sm text-gray-300">{stat.label}</span>
                  <span className="text-sm font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              Storage
            </h3>
            <div className="space-y-4">
              {storageStats.map((stat, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-300">{stat.label}</span>
                    <span className="text-sm font-medium">{stat.value}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`${stat.color} h-2 rounded-full`}
                      style={{ width: stat.value }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;