import React from 'react';
import { motion } from 'framer-motion';

const DonorDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Donor Dashboard</h1>
          <p className="text-gray-600">Donor-specific features and statistics coming soon...</p>
        </motion.div>
      </div>
    </div>
  );
};

export default DonorDashboard;