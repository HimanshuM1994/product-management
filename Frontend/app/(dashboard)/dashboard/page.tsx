'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Package, Users, DollarSign } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const stats = [
    {
      name: 'Total Revenue',
      value: '$24,780',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      name: 'Total Products',
      value: '156',
      change: '+8',
      changeType: 'positive',
      icon: Package,
    },
    {
      name: 'Active Users',
      value: '2,847',
      change: '+15.3%',
      changeType: 'positive',
      icon: Users,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm font-medium text-green-600">{stat.change}</span>
                <span className="text-sm text-gray-500 ml-2">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { action: 'New product added', time: '2 hours ago', type: 'success' },
            { action: 'Order completed', time: '4 hours ago', type: 'info' },
            { action: 'User registered', time: '6 hours ago', type: 'success' },
            { action: 'Payment received', time: '8 hours ago', type: 'success' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  activity.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
                }`} />
                <span className="text-gray-900">{activity.action}</span>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}