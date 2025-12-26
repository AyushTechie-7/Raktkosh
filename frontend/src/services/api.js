import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject({
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// Authentication API
export const authAPI = {
  // In your authAPI.register function, update the error handling:
register: async (userData) => {
  try {
    console.log('🔄 Sending registration request...', userData);
    const response = await apiClient.post('/auth/register', userData);
    
    if (response.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Registration successful! Welcome to RAKTKOSH.');
    }
    return response;
  } catch (error) {
    console.error('🚨 Registration API error:', error);
    
    // Show specific error message from backend
    const errorMessage = error.data?.message || error.message || 'Registration failed';
    const backendErrors = error.data?.errors || [];
    
    if (backendErrors.length > 0) {
      toast.error(`Registration failed: ${backendErrors.join(', ')}`);
    } else {
      toast.error(errorMessage);
    }
    
    throw error;
  }
},
  
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success(`Welcome back, ${response.data.user.name}!`);
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
    }
  },
  
  getProfile: async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
  
  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/auth/profile', userData);
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Profile updated successfully');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Profile update failed');
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.put('/auth/change-password', passwordData);
      if (response.success) {
        toast.success('Password changed successfully');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Password change failed');
      throw error;
    }
  }
};

// Donors API
export const donorsAPI = {
  getAllDonors: async (params = {}) => {
    try {
      const response = await apiClient.get('/donors', { params });
      return response;
    } catch (error) {
      console.error('Get donors error:', error);
      throw error;
    }
  },
  
  getNearbyDonors: async (location) => {
    try {
      const response = await apiClient.get('/donors/nearby', { 
        params: { latitude: location.latitude, longitude: location.longitude } 
      });
      return response;
    } catch (error) {
      console.error('Get nearby donors error:', error);
      throw error;
    }
  },

  getDonorStats: async () => {
    try {
      const response = await apiClient.get('/donors/stats');
      return response;
    } catch (error) {
      console.error('Get donor stats error:', error);
      throw error;
    }
  },

  updateDonorStatus: async (donorId, statusData) => {
    try {
      const response = await apiClient.put(`/donors/${donorId}/status`, statusData);
      if (response.success) {
        toast.success('Donor status updated successfully');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to update donor status');
      throw error;
    }
  },

  getDonorHistory: async (donorId) => {
    try {
      const response = await apiClient.get(`/donors/${donorId}/history`);
      return response;
    } catch (error) {
      console.error('Get donor history error:', error);
      throw error;
    }
  }
};

// Blood Banks API
export const bloodBanksAPI = {
  getAllBloodBanks: async (params = {}) => {
    try {
      const response = await apiClient.get('/bloodbanks', { params });
      return response;
    } catch (error) {
      console.error('Get blood banks error:', error);
      throw error;
    }
  },

  getBloodBankById: async (bloodBankId) => {
    try {
      const response = await apiClient.get(`/bloodbanks/${bloodBankId}`);
      return response;
    } catch (error) {
      console.error('Get blood bank error:', error);
      throw error;
    }
  },

  registerBloodBank: async (bloodBankData) => {
    try {
      const response = await apiClient.post('/bloodbanks/register', bloodBankData);
      if (response.success) {
        toast.success('Blood bank registered successfully');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Blood bank registration failed');
      throw error;
    }
  },

  updateBloodBank: async (bloodBankId, updateData) => {
    try {
      const response = await apiClient.put(`/bloodbanks/${bloodBankId}`, updateData);
      if (response.success) {
        toast.success('Blood bank updated successfully');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to update blood bank');
      throw error;
    }
  }
};

// Inventory API
export const inventoryAPI = {
  getInventory: async (bloodBankId = null) => {
    try {
      const params = bloodBankId ? { bloodBankId } : {};
      const response = await apiClient.get('/inventory', { params });
      return response;
    } catch (error) {
      console.error('Get inventory error:', error);
      throw error;
    }
  },

  updateInventory: async (inventoryData) => {
    try {
      const response = await apiClient.put('/inventory/update', inventoryData);
      if (response.success) {
        toast.success('Inventory updated successfully');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Inventory update failed');
      throw error;
    }
  },

  getLowStockAlerts: async () => {
    try {
      const response = await apiClient.get('/inventory/alerts');
      return response;
    } catch (error) {
      console.error('Get low stock alerts error:', error);
      throw error;
    }
  },

  getInventoryAnalytics: async () => {
    try {
      const response = await apiClient.get('/inventory/analytics');
      return response;
    } catch (error) {
      console.error('Get inventory analytics error:', error);
      throw error;
    }
  },

  searchBlood: async (searchParams) => {
    try {
      const response = await apiClient.get('/inventory/search', { params: searchParams });
      return response;
    } catch (error) {
      console.error('Search blood error:', error);
      throw error;
    }
  }
};

// Donations API
export const donationsAPI = {
  scheduleDonation: async (donationData) => {
    try {
      const response = await apiClient.post('/donations/schedule', donationData);
      if (response.success) {
        toast.success('Donation scheduled successfully');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to schedule donation');
      throw error;
    }
  },

  getDonations: async (params = {}) => {
    try {
      const response = await apiClient.get('/donations', { params });
      return response;
    } catch (error) {
      console.error('Get donations error:', error);
      throw error;
    }
  },

  updateDonationStatus: async (donationId, statusData) => {
    try {
      const response = await apiClient.put(`/donations/${donationId}/status`, statusData);
      if (response.success) {
        toast.success('Donation status updated successfully');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to update donation status');
      throw error;
    }
  },

  completeDonation: async (donationId, completionData) => {
    try {
      const response = await apiClient.post(`/donations/${donationId}/complete`, completionData);
      if (response.success) {
        toast.success('Donation completed successfully');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to complete donation');
      throw error;
    }
  },

  getDonationStats: async (period = 'month') => {
    try {
      const response = await apiClient.get('/donations/stats', { params: { period } });
      return response;
    } catch (error) {
      console.error('Get donation stats error:', error);
      throw error;
    }
  }
};

// Blood Requests API
export const bloodRequestsAPI = {
  createRequest: async (requestData) => {
    try {
      const response = await apiClient.post('/requests', requestData);
      if (response.success) {
        toast.success('Blood request created successfully');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to create blood request');
      throw error;
    }
  },

  getRequests: async (params = {}) => {
    try {
      const response = await apiClient.get('/requests', { params });
      return response;
    } catch (error) {
      console.error('Get blood requests error:', error);
      throw error;
    }
  },

  updateRequestStatus: async (requestId, statusData) => {
    try {
      const response = await apiClient.put(`/requests/${requestId}/status`, statusData);
      if (response.success) {
        toast.success('Request status updated successfully');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to update request status');
      throw error;
    }
  },

  fulfillRequest: async (requestId, fulfillmentData) => {
    try {
      const response = await apiClient.post(`/requests/${requestId}/fulfill`, fulfillmentData);
      if (response.success) {
        toast.success('Request fulfilled successfully');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to fulfill request');
      throw error;
    }
  },

  getMatchingDonors: async (requestId) => {
    try {
      const response = await apiClient.get(`/requests/${requestId}/matching-donors`);
      return response;
    } catch (error) {
      console.error('Get matching donors error:', error);
      throw error;
    }
  },

  getRequestStats: async () => {
    try {
      const response = await apiClient.get('/requests/stats');
      return response;
    } catch (error) {
      console.error('Get request stats error:', error);
      throw error;
    }
  }
};

// Emergency API
export const emergencyAPI = {
  createEmergencyRequest: async (emergencyData) => {
    try {
      const response = await apiClient.post('/emergency/request', emergencyData);
      if (response.success) {
        toast.success('Emergency request sent! Help is on the way.');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to send emergency request');
      throw error;
    }
  },

  getEmergencyContacts: async () => {
    try {
      const response = await apiClient.get('/emergency/contacts');
      return response;
    } catch (error) {
      console.error('Get emergency contacts error:', error);
      throw error;
    }
  },

  notifyNearbyDonors: async (emergencyId) => {
    try {
      const response = await apiClient.post(`/emergency/${emergencyId}/notify-donors`);
      if (response.success) {
        toast.success('Nearby donors notified');
      }
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to notify donors');
      throw error;
    }
  }
};

// Analytics API
export const analyticsAPI = {
  getDashboardStats: async () => {
    try {
      const response = await apiClient.get('/analytics/dashboard');
      return response;
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  },

  getBloodUsageAnalytics: async (period = 'month') => {
    try {
      const response = await apiClient.get('/analytics/blood-usage', { params: { period } });
      return response;
    } catch (error) {
      console.error('Get blood usage analytics error:', error);
      throw error;
    }
  },

  getDonorAnalytics: async () => {
    try {
      const response = await apiClient.get('/analytics/donors');
      return response;
    } catch (error) {
      console.error('Get donor analytics error:', error);
      throw error;
    }
  },

  exportReport: async (reportType, params = {}) => {
    try {
      const response = await apiClient.get(`/analytics/export/${reportType}`, { 
        params,
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to export report');
      throw error;
    }
  }
};

// Utility functions
export const apiUtils = {
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  },

  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  formatDateTime: (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  downloadBlob: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

// Fallback mock data for development (when backend is not available)
const mockData = {
  bloodInventory: [
    { id: 1, bloodGroup: 'A+', units: 45, capacity: 100, status: 'Adequate' },
    { id: 2, bloodGroup: 'A-', units: 15, capacity: 100, status: 'Low' },
    { id: 3, bloodGroup: 'B+', units: 38, capacity: 100, status: 'Adequate' },
    { id: 4, bloodGroup: 'B-', units: 12, capacity: 100, status: 'Critical' },
    { id: 5, bloodGroup: 'AB+', units: 8, capacity: 100, status: 'Critical' },
    { id: 6, bloodGroup: 'AB-', units: 4, capacity: 100, status: 'Critical' },
    { id: 7, bloodGroup: 'O+', units: 52, capacity: 100, status: 'Adequate' },
    { id: 8, bloodGroup: 'O-', units: 18, capacity: 100, status: 'Low' },
  ],
  donors: [
    { id: 1, name: 'John Doe', bloodGroup: 'A+', location: 'New York', lastDonation: '2024-01-15', contact: 'john@example.com' },
    { id: 2, name: 'Jane Smith', bloodGroup: 'O-', location: 'Los Angeles', lastDonation: '2024-02-20', contact: 'jane@example.com' },
  ],
  bloodBanks: [
    { id: 1, name: 'City Blood Bank', location: 'Downtown', contact: '555-0101', inventory: { 'A+': 25, 'O+': 30 } },
    { id: 2, name: 'Community Blood Center', location: 'Uptown', contact: '555-0102', inventory: { 'B+': 15, 'AB+': 8 } },
  ]
};

export default apiClient;