import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  HeartIcon,
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Total Donations', value: '24', icon: HeartIcon, color: 'text-red-600' },
    { label: 'Lives Saved', value: '72', icon: UsersIcon, color: 'text-green-600' },
    { label: 'Active Requests', value: '8', icon: ChartBarIcon, color: 'text-blue-600' },
    { label: 'Response Time', value: '15min', icon: ClockIcon, color: 'text-purple-600' },
  ];

  const recentActivity = [
    { action: 'Blood donation completed', time: '2 hours ago', type: 'donation' },
    { action: 'Emergency request fulfilled', time: '1 day ago', type: 'emergency' },
    { action: 'Profile updated', time: '2 days ago', type: 'update' },
    { action: 'New donor registered', time: '3 days ago', type: 'registration' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Here's your activity summary and quick access to important features.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                <span>+12% from last month</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <HeartIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{activity.action}</p>
                    <p className="text-gray-500 text-sm">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-center">
                <HeartIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <span className="text-gray-900 font-medium">Donate Blood</span>
              </button>
              <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center">
                <UsersIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <span className="text-gray-900 font-medium">Find Donors</span>
              </button>
              <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
                <ChartBarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <span className="text-gray-900 font-medium">Inventory</span>
              </button>
              <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center">
                <ClockIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <span className="text-gray-900 font-medium">Emergency</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;