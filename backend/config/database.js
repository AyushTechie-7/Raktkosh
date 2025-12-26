const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes for better performance
    await mongoose.connection.db.collection('users').createIndex({ email: 1 });
    await mongoose.connection.db.collection('bloodrequests').createIndex({ status: 1, bloodGroup: 1 });
    await mongoose.connection.db.collection('donations').createIndex({ donationDate: -1 });
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDatabase;