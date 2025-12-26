const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Validate environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.log('💡 Please check your .env file in the backend folder');
  process.exit(1);
}

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
// CORS configuration - Allow both ports
// CORS configuration - Development (allow all)
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection with better error handling
const connectDatabase = async () => {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📁 Database URI:', process.env.MONGODB_URI ? '✓ Loaded' : '✗ Missing');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected Successfully');
    
    // Create indexes for better performance
    // await mongoose.connection.db.collection('users').createIndex({ email: 1 });
    // await mongoose.connection.db.collection('bloodrequests').createIndex({ status: 1, bloodGroup: 1 });
    // await mongoose.connection.db.collection('donations').createIndex({ donationDate: -1 });
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    if (error.message.includes('MONGODB_URI is not defined')) {
      console.log('\n💡 Solution:');
      console.log('1. Create a .env file in your backend folder');
      console.log('2. Add: MONGODB_URI=mongodb://127.0.0.1:27017/bloodbank_management');
      console.log('3. Restart the server');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solution:');
      console.log('1. Make sure MongoDB is running on your system');
      console.log('2. Start MongoDB with: mongod (or sudo systemctl start mongod)');
    }
    
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/bloodbanks', require('./routes/bloodbanks'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Blood Bank Management API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  console.log('🚀 Starting Blood Bank Management Server...');
  console.log('📁 Current directory:', __dirname);
  console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
  
  await connectDatabase();
  
  app.listen(PORT, () => {
    console.log('\n🎉 Server started successfully!');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api`);
    console.log(`👥 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
    console.log('\n📋 Available Endpoints:');
    console.log('   GET  /api/health          - Health check');
    console.log('   POST /api/auth/register   - User registration');
    console.log('   POST /api/auth/login      - User login');
    console.log('   GET  /api/inventory       - Blood inventory');
    console.log('   GET  /api/donors          - Donor list');
    console.log('\n⚡ Server is ready to accept requests!');
  });
};

startServer();