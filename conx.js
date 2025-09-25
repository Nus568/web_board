// backend/db.js หรือ server.js
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/webboard')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));