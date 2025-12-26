import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { analyticsAPI, donationsAPI, inventoryAPI, bloodRequestsAPI } from '../services/api';
import {
  ChartBarIcon,
  UsersIcon,
  HeartIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardStats, systemAlerts, donations] = await Promise.all([
        analyticsAPI.getDashboardStats(),
        inventoryAPI.getLowStockAlerts(),
        donationsAPI.getDonations({ limit: 5 })
      ]);

      setStats(dashboardStats.data);
      setAlerts(systemAlerts.data.lowStock || []);
      setRecentDonations(donations.data.donations || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Donors',
      value: stats.totalDonors || 0,
      icon: UsersIcon,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Blood Requests',
      value: stats.totalRequests || 0,
      icon: ShoppingBagIcon,
      color: 'green',
      change: '+8%'
    },
    {
      title: 'Total Donations',
      value: stats.totalDonations || 0,
      icon: HeartIcon,
      color: 'red',
      change: '+15%'
    },
    {
      title: 'Low Stock Alerts',
      value: alerts.length,
      icon: ExclamationTriangleIcon,
      color: 'yellow',
      change: '-5%'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.name}. Here's your system overview.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2 text-sm text-green-600">
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${stat.color}-100`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Donations */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <HeartIcon className="h-5 w-5 text-red-600 mr-2" />
              Recent Donations
            </h2>
            <div className="space-y-4">
              {recentDonations.map((donation) => (
                <div key={donation._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <HeartIcon className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {donation.donor?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {donation.bloodGroup} • {new Date(donation.donationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{donation.unitsDonated} units</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      donation.status === 'processed' ? 'bg-green-100 text-green-800' :
                      donation.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {donation.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* System Alerts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
              System Alerts
            </h2>
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert._id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800">{alert.bloodGroup} Stock Low</p>
                        <p className="text-sm text-red-700">{alert.bloodBankName}, {alert.bloodBankCity}</p>
                        <p className="text-sm text-red-600">
                          {alert.currentStock} units remaining ({alert.utilization.toFixed(1)}% capacity)
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        alert.status === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No critical alerts at this time</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center">
              <UsersIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <span className="text-gray-900 font-medium">Manage Users</span>
            </button>
            <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
              <ChartBarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <span className="text-gray-900 font-medium">View Reports</span>
            </button>
            <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center">
              <ShoppingBagIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <span className="text-gray-900 font-medium">Blood Requests</span>
            </button>
            <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center">
              <MapPinIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <span className="text-gray-900 font-medium">System Settings</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;